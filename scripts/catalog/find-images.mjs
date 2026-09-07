#!/usr/bin/env node
/**
 * Finds product photos for the assortment, by barcode.
 * ----------------------------------------------------
 * First source: the Open Facts family (Open Beauty Facts, Open Food Facts,
 * Open Products Facts). They are free, openly licensed (photos are CC-BY-SA),
 * and identify a product by its GTIN — an exact match, not a guess from a
 * product name. A measured sample of this assortment resolves at roughly 15 %,
 * very unevenly: La Roche-Posay lands ~70 %, Chicco and Avent nothing at all.
 * So this is the cheap, clean first pass, not the whole answer.
 *
 * Two decisions make this fast and polite at the same time:
 *   - barcodes are looked up in batches of 50 through the search endpoint, so
 *     6.285 articles cost a few hundred requests rather than twenty thousand,
 *   - the three servers are tried in order and a product stops as soon as it is
 *     found, which is why the beauty server goes first for this assortment.
 *
 * Nothing here decides anything: every hit is a *candidate* carrying its source
 * URL, licence and a confidence derived from how well the found name matches
 * ours. A person confirms it on the review page before it can reach the site.
 *
 * Usage:
 *   node scripts/catalog/find-images.mjs --dry-run        # hit rate only
 *   node scripts/catalog/find-images.mjs --limit 500      # first 500 articles
 *   node scripts/catalog/find-images.mjs --brand VICHY    # one brand
 *   node scripts/catalog/find-images.mjs --label seria-02
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..");
const DATA = path.join(HERE, "data", "albtrix-products.json");
const REPORT_DIR = path.join(HERE, "reports");
const IMAGE_DIR = path.join(ROOT, ".image-cache", "found");

const USER_AGENT = "JaraPharmacy-ImageBot/1.0 (+https://jara-pharmacy.com)";

/** Beauty first: this assortment is mostly cosmetics and personal care. */
const SERVERS = [
  { id: "openbeautyfacts", host: "world.openbeautyfacts.org", label: "Open Beauty Facts" },
  { id: "openfoodfacts", host: "world.openfoodfacts.org", label: "Open Food Facts" },
  { id: "openproductsfacts", host: "world.openproductsfacts.org", label: "Open Products Facts" },
];

const BATCH = 50; // barcodes per search request
const PAUSE_MS = 900; // between requests — a free community service
const IMAGE_PAUSE_MS = 220; // between image downloads
const MIN_IMAGE_BYTES = 3000;

async function main() {
  const args = readArgs(process.argv.slice(2));
  const catalog = JSON.parse(fs.readFileSync(DATA, "utf8"));

  const already = knownCodes();
  let pool = catalog.products.filter(
    (product) => product.forWebsite && product.barcodeUsable && !already.has(product.code),
  );
  if (args.brand) {
    pool = pool.filter((product) => product.brand.toUpperCase().includes(args.brand.toUpperCase()));
  }
  if (args.limit) pool = pool.slice(0, args.limit);

  console.log(`\n  Kërkimi i fotografive — ${pool.length} produkte pa fotografi`);
  if (already.size) console.log(`  (${already.size} kanë tashmë një fotografi dhe u anashkaluan)`);
  console.log(`  ${"-".repeat(62)}`);

  /** code → candidate */
  const hits = new Map();
  let requests = 0;

  for (const server of SERVERS) {
    const open = pool.filter((product) => !hits.has(product.code));
    if (!open.length) break;

    let found = 0;
    for (const chunk of chunks(open, BATCH)) {
      const codes = chunk.map((product) => product.barcode).join(",");
      const url =
        `https://${server.host}/api/v2/search?code=${codes}` +
        `&fields=code,product_name,brands,image_front_url,image_url&page_size=${BATCH}`;

      const payload = await fetchJson(url);
      requests += 1;
      for (const entry of payload?.products ?? []) {
        const image = entry.image_front_url || entry.image_url;
        if (!image || hits.has(entry.code)) continue;
        const product = chunk.find((item) => item.barcode === entry.code);
        if (!product) continue;
        hits.set(product.code, {
          product,
          imageUrl: image,
          foundName: entry.product_name || "",
          foundBrand: entry.brands || "",
          server,
        });
        found += 1;
      }
      process.stdout.write(`     ${server.label}: ${found} të gjetura nga ${open.length}   \r`);
      await sleep(PAUSE_MS);
    }
    console.log(`     ${server.label.padEnd(22)} ${String(found).padStart(5)} të gjetura nga ${open.length} të mbetura`);
  }

  const rate = pool.length ? ((hits.size / pool.length) * 100).toFixed(1) : "0";
  console.log(`\n  Gjithsej: ${hits.size} fotografi për ${pool.length} produkte (${rate} %) me ${requests} kërkesa`);

  if (args.dryRun) {
    console.log("\n  --dry-run: asgjë nuk u shkarkua.\n");
    printBrandBreakdown(hits);
    return;
  }

  /* ---- download the candidates ---- */
  fs.mkdirSync(IMAGE_DIR, { recursive: true });
  const photos = [];
  const failed = [];
  let index = 0;

  for (const hit of hits.values()) {
    index += 1;
    const extension = path.extname(new URL(hit.imageUrl).pathname).toLowerCase() || ".jpg";
    const fileName = `${String(index).padStart(4, "0")}_${hit.product.code}_${hit.product.barcode}${extension}`;
    const target = path.join(IMAGE_DIR, fileName);

    let bytes = null;
    if (fs.existsSync(target) && fs.statSync(target).size >= MIN_IMAGE_BYTES) {
      bytes = fs.statSync(target).size; // resumable: already downloaded
    } else {
      const buffer = await fetchBuffer(hit.imageUrl);
      if (!buffer || buffer.length < MIN_IMAGE_BYTES || !looksLikeImage(buffer)) {
        failed.push({ code: hit.product.code, url: hit.imageUrl });
        continue;
      }
      fs.writeFileSync(target, buffer);
      bytes = buffer.length;
      await sleep(IMAGE_PAUSE_MS);
    }

    const match = confidenceFor(hit);
    photos.push({
      number: photos.length + 1,
      code: hit.product.code,
      name: hit.product.name,
      barcode: hit.product.barcode,
      brand: hit.product.brand,
      confidence: match.confidence,
      status: match.status,
      note: match.note,
      sourcePage: `https://${hit.server.host}/product/${hit.product.barcode}`,
      imageUrl: hit.imageUrl,
      licence: `${hit.server.label} — CC-BY-SA`,
      file: path.posix.join(".image-cache/found", fileName),
      bytes,
    });
    if (index % 25 === 0) process.stdout.write(`     ${index} të shkarkuara\r`);
  }

  const report = {
    generatedAt: new Date().toISOString(),
    label: args.label,
    source: "Open Facts (beauty/food/products) sipas barkodit",
    totals: {
      considered: pool.length,
      found: hits.size,
      downloaded: photos.length,
      failed: failed.length,
      byConfidence: countBy(photos, (photo) => photo.confidence),
      byBrand: topEntries(countBy(photos, (photo) => photo.brand || "—"), 15),
    },
    failed,
    photos,
  };

  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const reportPath = path.join(REPORT_DIR, `${args.label}.json`);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log(`     ${photos.length} fotografi të shkarkuara${failed.length ? `, ${failed.length} dështuan` : ""}`);
  console.log(`\n  Raporti: ${path.relative(ROOT, reportPath)}`);
  console.log(`  Faqja:   node scripts/catalog/build-review-page.mjs --report reports/${args.label}.json --seria "..." --title "..."\n`);
  printBrandBreakdown(hits);
}

/* ------------------------------------------------------------------ */
/*  Judging a candidate                                                */
/* ------------------------------------------------------------------ */

/**
 * A barcode hit is already an exact identifier, so the name comparison only
 * decides how loudly to ask the reviewer to look: a database entry whose name
 * shares nothing with ours may be a re-used or mistyped barcode.
 */
function confidenceFor(hit) {
  const ours = tokens(hit.product.name);
  const theirs = tokens(`${hit.foundName} ${hit.foundBrand}`);
  const shared = [...ours].filter((token) => theirs.has(token)).length;
  const overlap = ours.size ? shared / ours.size : 0;
  const brandMatches =
    hit.product.brand && hit.foundBrand
      ? tokens(hit.foundBrand).has(tokens(hit.product.brand).values().next().value)
      : false;

  if (!hit.foundName) {
    return {
      confidence: "E mesme",
      status: "Për verifikim",
      note: "Barkodi përputhet, por baza e të dhënave nuk ka emër produkti. Krahasoje me paketimin.",
    };
  }
  if (overlap >= 0.34 || brandMatches) {
    return {
      confidence: "E lartë",
      status: "Për verifikim",
      note: `Barkodi dhe emri përputhen ("${hit.foundName}"). Krahasoje me paketimin para publikimit.`,
    };
  }
  if (overlap > 0) {
    return {
      confidence: "E mesme",
      status: "Për verifikim",
      note: `Barkodi përputhet, emri vetëm pjesërisht ("${hit.foundName}").`,
    };
  }
  return {
    confidence: "E ulët",
    status: "Mospërputhje",
    note: `Barkodi përputhet, por emri është krejt tjetër ("${hit.foundName}"). Kontrollo me kujdes.`,
  };
}

const STOPWORDS = new Set(["ML", "MG", "TAB", "CAPS", "CAP", "GR", "KOM", "SIR", "DHE", "ME", "PER", "THE", "AND"]);
function tokens(value) {
  return new Set(
    String(value ?? "")
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, " ")
      .split(" ")
      .filter((token) => token.length > 2 && !STOPWORDS.has(token)),
  );
}

/* ------------------------------------------------------------------ */
/*  Network                                                            */
/* ------------------------------------------------------------------ */

async function fetchJson(url, attempt = 1) {
  try {
    const response = await fetch(url, {
      headers: { "user-agent": USER_AGENT, accept: "application/json" },
      signal: AbortSignal.timeout(45000),
    });
    if (response.status === 429 || response.status >= 500) throw new Error(`HTTP ${response.status}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    if (attempt >= 3) return null;
    await sleep(attempt * 2500); // back off — the servers are a free service
    return fetchJson(url, attempt + 1);
  }
}

async function fetchBuffer(url, attempt = 1) {
  try {
    const response = await fetch(url, {
      headers: { "user-agent": USER_AGENT },
      signal: AbortSignal.timeout(45000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return Buffer.from(await response.arrayBuffer());
  } catch {
    if (attempt >= 2) return null;
    await sleep(1500);
    return fetchBuffer(url, attempt + 1);
  }
}

/** Rejects HTML error pages served with a 200. */
function looksLikeImage(buffer) {
  const png = buffer.readUInt32BE(0) === 0x89504e47;
  const jpeg = buffer[0] === 0xff && buffer[1] === 0xd8;
  const webp = buffer.subarray(0, 4).toString("ascii") === "RIFF";
  const gif = buffer.subarray(0, 3).toString("ascii") === "GIF";
  return png || jpeg || webp || gif;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Every code that already has a photo, from all reports written so far. */
function knownCodes() {
  const codes = new Set();
  if (!fs.existsSync(REPORT_DIR)) return codes;
  for (const file of fs.readdirSync(REPORT_DIR)) {
    if (!file.endsWith(".json")) continue;
    try {
      const report = JSON.parse(fs.readFileSync(path.join(REPORT_DIR, file), "utf8"));
      for (const photo of report.photos ?? []) if (photo.code) codes.add(photo.code);
    } catch {
      // A malformed report must not stop a search run.
    }
  }
  return codes;
}

function readArgs(argv) {
  const flag = (name, fallback) => {
    const index = argv.indexOf(`--${name}`);
    return index >= 0 && argv[index + 1] ? argv[index + 1] : fallback;
  };
  return {
    dryRun: argv.includes("--dry-run"),
    limit: Number(flag("limit", 0)) || 0,
    brand: flag("brand", ""),
    label: flag("label", `openfacts-${new Date().toISOString().slice(0, 10)}`),
  };
}

function* chunks(items, size) {
  for (let i = 0; i < items.length; i += size) yield items.slice(i, i + size);
}

function countBy(items, pick) {
  const counts = {};
  for (const item of items) {
    const key = pick(item);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

const topEntries = (counts, count) =>
  Object.fromEntries(Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, count));

function printBrandBreakdown(hits) {
  const counts = countBy([...hits.values()], (hit) => hit.product.brand || "—");
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 12);
  if (!top.length) return;
  console.log("  Markat me më shumë fotografi të gjetura:");
  for (const [brand, count] of top) console.log(`     ${brand.slice(0, 30).padEnd(32)} ${String(count).padStart(4)}`);
  console.log("");
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
