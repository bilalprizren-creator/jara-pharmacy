#!/usr/bin/env node
/**
 * Looks for a better picture of a product we have already identified.
 * -------------------------------------------------------------------
 * The barcode pass identifies products exactly, but the photo attached to a
 * barcode is whatever a contributor happened to upload — and measured over the
 * 739 hits, almost all of them are snapshots on a table or a bed sheet rather
 * than packshots. Correct product, wrong picture: next to the studio shots
 * already on the site they would look careless.
 *
 * Open Facts keeps every upload for a product, not only the one shown, so this
 * fetches the alternatives, scores each with `lib/packshot.mjs`, and keeps the
 * best — but only when it actually beats what we have. A product whose photos
 * are all snapshots keeps its current one and is flagged, so it is clear which
 * articles still need a picture from somewhere else.
 *
 * Nothing is thrown away: the original stays on disk and the report records
 * both scores, so a wrong call can always be traced and reversed.
 *
 * Usage:
 *   node scripts/catalog/improve-images.mjs --limit 60      # measure first
 *   node scripts/catalog/improve-images.mjs                 # the whole report
 *   node scripts/catalog/improve-images.mjs --report reports/openfacts-01.json
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { packshotScore } from "./lib/packshot.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..");
const IMAGE_DIR = path.join(ROOT, ".image-cache", "better");

const USER_AGENT = "JaraPharmacy-ImageBot/1.0 (+https://jara-pharmacy.com)";
const PAUSE_MS = 800;
const IMAGE_PAUSE_MS = 200;
const MIN_IMAGE_BYTES = 3000;

/** Below this a photo is not worth showing on the site. */
const WEAK = 0.45;
/** A replacement has to be clearly better, not marginally. */
const MIN_GAIN = 0.15;
/** Raw uploads to try per product; the first ones are the oldest and usually best. */
const MAX_CANDIDATES = 5;

async function main() {
  const args = readArgs(process.argv.slice(2));
  const reportPath = path.resolve(HERE, args.report);
  const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));

  const scored = [];
  for (const photo of report.photos) {
    const file = path.join(ROOT, photo.file);
    const score = fs.existsSync(file) ? await packshotScore(file) : null;
    scored.push({ photo, score: score?.score ?? 0, verdict: score?.verdict ?? "—" });
  }

  const weak = scored.filter((entry) => entry.score < WEAK);
  const targets = args.limit ? weak.slice(0, args.limit) : weak;

  console.log(`\n  Fotografi më të mira — ${report.label}`);
  console.log(`  ${"-".repeat(62)}`);
  console.log(`  Gjithsej          ${scored.length}`);
  console.log(`  Të mira tashmë    ${scored.length - weak.length}`);
  console.log(`  Për t'u përmirësuar ${weak.length}${args.limit ? ` (po provoj ${targets.length})` : ""}\n`);

  fs.mkdirSync(IMAGE_DIR, { recursive: true });
  const improved = [];
  const stillWeak = [];
  let checked = 0;

  for (const entry of targets) {
    checked += 1;
    const candidates = await candidateUrls(entry.photo);
    let best = null;

    for (const url of candidates.slice(0, MAX_CANDIDATES)) {
      const buffer = await fetchBuffer(url);
      if (!buffer || buffer.length < MIN_IMAGE_BYTES) continue;
      const score = await packshotScore(buffer);
      await sleep(IMAGE_PAUSE_MS);
      if (!score) continue;
      if (!best || score.score > best.score.score) best = { url, buffer, score };
    }

    if (best && best.score.score >= entry.score + MIN_GAIN && best.score.score >= WEAK) {
      const extension = path.extname(new URL(best.url).pathname) || ".jpg";
      const fileName = `${safe(entry.photo.code)}_${safe(entry.photo.barcode)}${extension}`;
      fs.writeFileSync(path.join(IMAGE_DIR, fileName), best.buffer);
      improved.push({
        code: entry.photo.code,
        name: entry.photo.name,
        was: entry.score,
        now: best.score.score,
        verdict: best.score.verdict,
        url: best.url,
        file: path.posix.join(".image-cache/better", fileName),
      });
    } else {
      stillWeak.push({
        code: entry.photo.code,
        name: entry.photo.name,
        score: entry.score,
        bestAlternative: best ? best.score.score : null,
      });
    }

    if (checked % 10 === 0) {
      process.stdout.write(`     ${checked}/${targets.length} të kontrolluara, ${improved.length} të përmirësuara\r`);
    }
    await sleep(PAUSE_MS);
  }

  const rate = targets.length ? ((improved.length / targets.length) * 100).toFixed(0) : "0";
  console.log(`     ${checked} të kontrolluara, ${improved.length} të përmirësuara (${rate} %)          `);

  if (improved.length) {
    console.log("\n  Shembuj të përmirësuar:");
    for (const item of improved.slice(0, 8)) {
      console.log(`     ${item.was.toFixed(2)} → ${item.now.toFixed(2)}  ${item.name.slice(0, 44)}`);
    }
  }
  console.log(`\n  Mbeten pa fotografi të mirë: ${stillWeak.length} — këtyre u duhet burim tjetër.\n`);

  const out = path.join(HERE, "reports", `${report.label}-better.json`);
  fs.writeFileSync(
    out,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        basedOn: report.label,
        checked,
        improved,
        stillWeak,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
  console.log(`  Raporti: ${path.relative(ROOT, out)}\n`);
}

/**
 * Every raw upload Open Facts holds for this barcode. The displayed photo is a
 * *selected* image ("front_fr"); the numbered keys are the originals people
 * uploaded, and a product photographed twice by two contributors is exactly the
 * case worth looking at.
 */
async function candidateUrls(photo) {
  const host = new URL(photo.sourcePage).host;
  const payload = await fetchJson(`https://${host}/api/v2/product/${photo.barcode}.json?fields=images`);
  const images = payload?.product?.images ?? {};
  const base = photo.imageUrl.slice(0, photo.imageUrl.lastIndexOf("/"));

  const urls = [];
  for (const [key, value] of Object.entries(images)) {
    if (!/^\d+$/.test(key)) continue; // skip front_/ingredients_/packaging_ selections
    if (!value?.sizes?.["400"]) continue;
    urls.push(`${base}/${key}.400.jpg`);
  }
  return urls;
}

/* ------------------------------------------------------------------ */

async function fetchJson(url, attempt = 1) {
  try {
    const response = await fetch(url, {
      headers: { "user-agent": USER_AGENT, accept: "application/json" },
      signal: AbortSignal.timeout(30000),
    });
    if (response.status === 429 || response.status >= 500) throw new Error(`HTTP ${response.status}`);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    if (attempt >= 2) return null;
    await sleep(2000);
    return fetchJson(url, attempt + 1);
  }
}

async function fetchBuffer(url) {
  try {
    const response = await fetch(url, {
      headers: { "user-agent": USER_AGENT },
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) return null;
    return Buffer.from(await response.arrayBuffer());
  } catch {
    return null;
  }
}

function readArgs(argv) {
  const flag = (name, fallback) => {
    const index = argv.indexOf(`--${name}`);
    return index >= 0 && argv[index + 1] ? argv[index + 1] : fallback;
  };
  return {
    report: flag("report", "reports/openfacts-01.json"),
    limit: Number(flag("limit", 0)) || 0,
  };
}

const safe = (value) => String(value ?? "").replace(/[^A-Za-z0-9._-]+/g, "-");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
