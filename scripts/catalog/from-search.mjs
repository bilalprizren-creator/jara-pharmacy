#!/usr/bin/env node
/**
 * Turns web-search hits into product photos.
 * ------------------------------------------
 * The article names carry everything a person needs to find the product —
 * brand, product, pack size — and typing one into a search engine finds it in
 * seconds. What was missing was never the information; it was a way to ask a
 * general search engine from a script. Google returns no image URLs to a
 * program at all, and its official API needs a key.
 *
 * So this takes the other half of the chain, which needs no key: given a
 * product and a handful of candidate pages, it fetches each, reads the photo
 * the page advertises, scores them all with `lib/packshot.mjs` and keeps the
 * best. Measured on the first products tried, two pages in three yield a clean
 * studio shot, often from the manufacturer itself.
 *
 * Input is a small JSON file — `[{ "code": "802752", "urls": [...] }]` — which
 * is what a search, done here or through a paid search API, produces.
 *
 * Usage:
 *   node scripts/catalog/from-search.mjs --input scripts/catalog/state/search-hits.json
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { packshotScore } from "./lib/packshot.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..");
const DATA = path.join(HERE, "data", "albtrix-products.json");
const IMAGE_DIR = path.join(ROOT, ".image-cache", "kerkim");

const USER_AGENT = "JaraPharmacy-ImageBot/1.0 (+https://jara-pharmacy.com)";
const PAUSE_MS = 700;
const MIN_IMAGE_BYTES = 3000;
/** Below this a page's picture is a logo or a banner, not the product. */
const MIN_SCORE = 0.45;

async function main() {
  const args = readArgs(process.argv.slice(2));
  const hits = JSON.parse(fs.readFileSync(path.resolve(ROOT, args.input), "utf8"));
  const catalog = JSON.parse(fs.readFileSync(DATA, "utf8"));
  const byCode = new Map(catalog.products.map((product) => [product.code, product]));

  fs.mkdirSync(IMAGE_DIR, { recursive: true });
  const photos = [];
  const empty = [];

  console.log(`\n  Fotografi nga rezultatet e kërkimit — ${hits.length} produkte`);
  console.log(`  ${"-".repeat(62)}`);

  for (const hit of hits) {
    const product = byCode.get(hit.code);
    if (!product) {
      empty.push({ code: hit.code, reason: "nuk gjendet në listë" });
      continue;
    }

    let best = null;
    for (const url of (hit.urls ?? []).slice(0, 6)) {
      const found = await imageFrom(url);
      if (!found) continue;
      if (!best || found.score.score > best.score.score) best = { ...found, url };
      // A perfect packshot ends the search for this product.
      if (best.score.score >= 0.95) break;
    }

    if (!best || best.score.score < MIN_SCORE) {
      empty.push({ code: hit.code, name: product.name, reason: best ? `më e mira ${best.score.score}` : "asnjë fotografi" });
      console.log(`     ·  ${product.name.slice(0, 46).padEnd(48)} ${best ? best.score.score : "—"}`);
      continue;
    }

    const extension = path.extname(new URL(best.image).pathname).toLowerCase() || ".jpg";
    const fileName = `${safeName(product.code)}${extension}`;
    fs.writeFileSync(path.join(IMAGE_DIR, fileName), best.bytes);

    photos.push({
      number: photos.length + 1,
      code: product.code,
      name: product.name,
      barcode: product.barcode,
      brand: product.brand,
      // Found by searching the name, then confirmed by eye on the review page:
      // the page could be about a different pack of the same line.
      confidence: "E mesme",
      status: "Për verifikim",
      note:
        `Gjetur me kërkim sipas emrit te ${new URL(best.url).host}. ` +
        `Kontrollo që madhësia dhe varianti të përputhen me paketimin.`,
      sourcePage: best.url,
      imageUrl: best.image,
      licence: `Faqe e jashtme — ${new URL(best.url).host}`,
      file: path.posix.join(".image-cache/kerkim", fileName),
      bytes: best.bytes.length,
      quality: best.score.score,
    });
    console.log(`     ✓  ${product.name.slice(0, 46).padEnd(48)} ${best.score.score}  ${new URL(best.url).host.slice(0, 24)}`);
  }

  const report = {
    generatedAt: new Date().toISOString(),
    label: args.label,
    source: "Kërkim në internet sipas emrit të produktit",
    totals: { tried: hits.length, found: photos.length, empty: empty.length },
    empty,
    photos,
  };
  const out = path.join(HERE, "reports", `${args.label}.json`);
  fs.writeFileSync(out, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  const rate = hits.length ? Math.round((photos.length / hits.length) * 100) : 0;
  console.log(`\n  ${photos.length} nga ${hits.length} (${rate} %)`);
  console.log(`  Raporti: ${path.relative(ROOT, out)}\n`);
}

/** Fetches a page and returns the picture it advertises, already scored. */
async function imageFrom(url) {
  try {
    const response = await fetch(url, {
      headers: { "user-agent": USER_AGENT, accept: "text/html" },
      redirect: "follow",
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) return null;
    const html = await response.text();
    const image =
      html.match(/property="og:image"[^>]*content="([^"]+)"/)?.[1] ??
      html.match(/content="([^"]+)"[^>]*property="og:image"/)?.[1];
    if (!image) return null;

    const picture = await fetch(new URL(image, url).href, {
      headers: { "user-agent": USER_AGENT },
      signal: AbortSignal.timeout(20000),
    });
    if (!picture.ok) return null;
    const bytes = Buffer.from(await picture.arrayBuffer());
    if (bytes.length < MIN_IMAGE_BYTES) return null;

    const score = await packshotScore(bytes);
    if (!score) return null;
    await sleep(PAUSE_MS);
    return { image: new URL(image, url).href, bytes, score };
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
    input: flag("input", "scripts/catalog/state/search-hits.json"),
    label: flag("label", "kerkim-01"),
  };
}

const safeName = (value) => String(value ?? "").replace(/[^A-Za-z0-9._-]+/g, "-");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
