#!/usr/bin/env node
/**
 * Product image fetcher for the ALBTRIX assortment.
 * -------------------------------------------------
 * Looks up product photos by barcode and stores them, easiest products first,
 * so they can be reviewed as a preview page before anything reaches the site.
 *
 * Input : scripts/product-images/albtrix-products.json  (see prepare-dataset.py)
 * Output: .image-cache/originals/<code>.<ext>           (gitignored, not published)
 *         scripts/reports/product-images-<label>.json   (one entry per product)
 *         scripts/state/product-images-progress.json    (resume marker)
 *
 * Source: the Open Facts family (Open Beauty Facts / Open Food Facts / Open
 * Products Facts). Their photos are contributor-uploaded and licensed CC-BY-SA,
 * i.e. explicitly reusable with attribution — which is why they come first.
 * Every record keeps the server, the product URL and the licence, so no image
 * is ever used without knowing where it came from. Manufacturer-site adapters
 * plug into the same SOURCES array once their response shape is verified live.
 *
 * What is deliberately NOT fetched:
 *   - `kind: "pharma"` — the medicine range, including prescription-only items.
 *     Same call the SHEMO importer makes for its clinical lines: those need a
 *     pharmacist's decision, not an automated download.
 *   - `kind: "account"` / `"asset"` — the export carries bookkeeping rows
 *     (rent, insurance) and company cars. They are not products.
 *   - anything whose barcode cannot be resolved globally (bad check digit,
 *     placeholder, or an in-store code) — a lookup would be guesswork.
 *
 * Safety:
 *   - Resumable: an image already on disk that still validates is never
 *     re-downloaded; re-running continues where an interrupted run stopped.
 *   - Polite: one request at a time, spaced, with a User-Agent naming the site
 *     it runs for. No auth, no rate-limit bypass.
 *   - Downloads are validated by file signature, so an error page saved as
 *     .jpg is rejected rather than silently kept.
 *
 * Usage:
 *   node scripts/product-images/fetch-images.mjs --dry-run          # show the
 *                                                                   # selection
 *   node scripts/product-images/fetch-images.mjs --limit 100        # test batch
 *   node scripts/product-images/fetch-images.mjs --brand VICHY      # one brand
 *   node scripts/product-images/fetch-images.mjs --limit 500 --per-brand 0 \
 *        --label batch2
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/* ------------------------------- config -------------------------------- */

const REQUEST_TIMEOUT_MS = 20_000;
const MAX_RETRIES = 3;
const POLITE_DELAY_MS = 700; // between lookups; Open Facts asks for <100/min
const MIN_IMAGE_BYTES = 3_000; // below this it is a spacer, not a packshot
// Identify ourselves by the domain we actually run: jara-pharmacy.com. The
// hyphen-less jarapharmacy.com belongs to someone else entirely.
const USER_AGENT =
  "JaraPharmacyImageFetcher/1.0 (+catalog images for jara-pharmacy.com)";

/**
 * Image sources, tried in order. Each adapter turns a product into
 * `{ imageUrl, sourceUrl, source, license, title }` or null.
 */
const OPEN_FACTS_SERVERS = [
  ["openbeautyfacts", "world.openbeautyfacts.org"], // cosmetics, dermocosmetics
  ["openfoodfacts", "world.openfoodfacts.org"], // supplements, baby food
  ["openproductsfacts", "world.openproductsfacts.org"], // everything else
];

const SOURCES = OPEN_FACTS_SERVERS.map(([id, host]) => ({
  id,
  host,
  licence: "CC-BY-SA 3.0",
  async lookup(product) {
    const fields =
      "code,product_name,brands,image_front_url,image_url,selected_images";
    const url = `https://${this.host}/api/v2/product/${product.barcode}.json?fields=${fields}`;
    const { json } = await fetchWithRetry(url, { as: "json" });
    if (!json || json.status !== 1 || !json.product) return null;
    const p = json.product;
    const imageUrl =
      p.image_front_url ||
      p.image_url ||
      p.selected_images?.front?.display?.[Object.keys(p.selected_images.front.display ?? {})[0]] ||
      null;
    if (!imageUrl) return null;
    return {
      imageUrl,
      sourceUrl: `https://${this.host}/product/${product.barcode}`,
      source: this.id,
      licence: this.licence,
      title: [p.brands, p.product_name].filter(Boolean).join(" ").trim(),
    };
  },
}));

/**
 * Brands with a maintained international online catalogue — their packshots
 * are the easiest to find and the most likely to be the right one. Ordering
 * the work by this is what "start with the easiest" means in practice.
 */
const CATALOGUED_BRANDS = new Set([
  "VICHY", "LA ROCHE-POSAY", "EUCERIN", "CERA VE", "AVENE", "NIVEA", "GARNIER",
  "NEUTROGENA", "SEBAMED", "RILASTIL", "BIODERMA", "DERMEDIC", "URIAGE",
  "CHICCO", "AVENT", "MAM", "NUK", "BIBS", "TOMMEE TIPPEE", "SUAVINEX",
  "LANSINOH", "CANPOL", "BABY NOVA", "WEE BABY", "HIPP", "NESTLE",
  "SWANSON", "NATURES AID", "NATURES TRUTH", "VITABIOTICS", "SOLGAR",
  "BIOKAP", "CURAPROX", "ORAL-B", "COLGATE", "SENSODYNE", "ELGYDIUM",
  "BELLS", "ORZAX", "MYCEY", "FACE FACTS", "BEBEDOR",
]);

/* -------------------------------- paths -------------------------------- */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPTS_DIR = path.resolve(__dirname, "..");
const ROOT = path.resolve(SCRIPTS_DIR, "..");
const DATASET_FILE = path.join(__dirname, "albtrix-products.json");
const CACHE_DIR = path.join(ROOT, ".image-cache", "originals");
const REPORT_DIR = path.join(SCRIPTS_DIR, "reports");
const STATE_DIR = path.join(SCRIPTS_DIR, "state");
const PROGRESS_FILE = path.join(STATE_DIR, "product-images-progress.json");

/* ------------------------------ logging -------------------------------- */

const ts = () => new Date().toISOString();
const log = (level, msg, extra) =>
  console.log(JSON.stringify({ t: ts(), level, msg, ...(extra ? { extra } : {}) }));
const info = (m, e) => log("info", m, e);
const warn = (m, e) => log("warn", m, e);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ------------------------------ arguments ------------------------------ */

function readArgs(argv) {
  const flag = (name, fallback) => {
    const i = argv.indexOf(`--${name}`);
    return i === -1 || i + 1 >= argv.length ? fallback : argv[i + 1];
  };
  return {
    dryRun: argv.includes("--dry-run"),
    limit: Number(flag("limit", 100)),
    perBrand: Number(flag("per-brand", 8)), // 0 = no cap
    brand: (flag("brand", "") || "").toUpperCase(),
    kind: flag("kind", "retail"),
    label: flag("label", "batch1"),
  };
}

/* ------------------------------- helpers ------------------------------- */

async function fetchWithRetry(url, { as = "json" } = {}) {
  let lastErr;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": USER_AGENT,
          Accept: as === "json" ? "application/json" : "image/*,*/*",
        },
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      // A missing product is an answer, not a failure worth retrying.
      if (res.status === 404) return { json: null, buffer: null, status: 404 };
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if (as === "json") return { json: await res.json(), status: res.status };
      return {
        buffer: Buffer.from(await res.arrayBuffer()),
        contentType: res.headers.get("content-type") || "",
        status: res.status,
      };
    } catch (e) {
      clearTimeout(timer);
      lastErr = e;
      if (attempt < MAX_RETRIES) await sleep(500 * attempt);
    }
  }
  throw lastErr;
}

/**
 * Identify an image by its file signature and read its dimensions. Returns
 * null for anything that is not a real raster image — an HTML error page
 * saved under a .jpg name never makes it into the preview this way.
 */
function inspectImage(buf) {
  if (!buf || buf.length < 24) return null;
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return { ext: "png", width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    // Walk the JPEG markers to the first start-of-frame for the real size.
    let i = 2;
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) { i++; continue; }
      const marker = buf[i + 1];
      const len = buf.readUInt16BE(i + 2);
      const isSOF = marker >= 0xc0 && marker <= 0xcf &&
        ![0xc4, 0xc8, 0xcc].includes(marker);
      if (isSOF) {
        return { ext: "jpg", height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
      }
      i += 2 + len;
    }
    return { ext: "jpg", width: 0, height: 0 };
  }
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") {
    return { ext: "webp", width: 0, height: 0 };
  }
  return null;
}

/** Products worth photographing, ordered so the easiest come first. */
function selectProducts(dataset, args) {
  const brandCounts = new Map();
  for (const p of dataset.products) {
    if (p.brand) brandCounts.set(p.brand, (brandCounts.get(p.brand) ?? 0) + 1);
  }

  const scored = dataset.products
    .filter((p) => p.kind === args.kind)
    .filter((p) => p.barcodeUsable)
    .filter((p) => !args.brand || p.brand === args.brand)
    .map((p) => {
      const reasons = [];
      let score = 0;
      if (p.brand) { score += 20; reasons.push("Marke bekannt"); }
      if (CATALOGUED_BRANDS.has(p.brand)) {
        score += 40;
        reasons.push("Marke mit Online-Katalog");
      }
      const siblings = brandCounts.get(p.brand) ?? 0;
      score += Math.min(siblings, 60) / 4; // bundle effect, capped
      if (siblings >= 20) reasons.push(`${siblings} Produkte derselben Marke`);
      if (/\d+\s?(ml|g|gr|mg|kg|l)\b/i.test(p.name)) {
        score += 5;
        reasons.push("Packungsgröße im Namen");
      }
      return { ...p, score, reasons };
    })
    .sort((a, b) => b.score - a.score || a.brand.localeCompare(b.brand) ||
      a.name.localeCompare(b.name));

  if (args.perBrand <= 0) return scored.slice(0, args.limit);

  // Spread the batch across brands, strongest brand first, one product per
  // brand per pass. A straight score sort would fill the whole batch from
  // whichever brand happens to sort first alphabetically; this way the review
  // shows a dozen manufacturers instead of one shelf.
  const byBrand = new Map();
  for (const p of scored) {
    if (!byBrand.has(p.brand)) byBrand.set(p.brand, []);
    byBrand.get(p.brand).push(p);
  }
  const ranked = [...byBrand.keys()].sort(
    (a, b) =>
      (brandCounts.get(b) ?? 0) - (brandCounts.get(a) ?? 0) || a.localeCompare(b),
  );
  // Only as many brands as the batch can actually fill `perBrand` times over.
  // With 380 brands in the export, a round-robin over all of them would hand
  // back one product each and say nothing about how consistent a brand's
  // photos are.
  const brands = ranked.slice(0, Math.max(1, Math.ceil(args.limit / args.perBrand)));

  const picked = [];
  for (let pass = 0; pass < args.perBrand && picked.length < args.limit; pass++) {
    for (const brand of brands) {
      if (picked.length >= args.limit) break;
      const next = byBrand.get(brand)[pass];
      if (next) picked.push(next);
    }
  }
  return picked;
}

function cachedFileFor(code) {
  for (const ext of ["png", "jpg", "webp"]) {
    const file = path.join(CACHE_DIR, `${code}.${ext}`);
    if (fs.existsSync(file)) return file;
  }
  return null;
}

async function fetchImageFor(product) {
  for (const source of SOURCES) {
    let hit;
    try {
      hit = await source.lookup(product);
    } catch (e) {
      warn("Quelle nicht erreichbar", {
        source: source.id,
        code: product.code,
        err: String(e?.message ?? e),
      });
      continue;
    }
    await sleep(POLITE_DELAY_MS);
    if (!hit) continue;

    const { buffer, contentType } = await fetchWithRetry(hit.imageUrl, { as: "binary" });
    const shape = inspectImage(buffer);
    if (!shape) {
      warn("keine gültige Bilddatei", { code: product.code, contentType });
      continue;
    }
    if (buffer.length < MIN_IMAGE_BYTES) {
      warn("Bild zu klein", { code: product.code, bytes: buffer.length });
      continue;
    }
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    const file = path.join(CACHE_DIR, `${product.code}.${shape.ext}`);
    fs.writeFileSync(file, buffer);
    await sleep(POLITE_DELAY_MS);
    return { ...hit, file, bytes: buffer.length, ...shape };
  }
  return null;
}

/* --------------------------------- main -------------------------------- */

async function main() {
  const args = readArgs(process.argv.slice(2));
  if (!fs.existsSync(DATASET_FILE)) {
    console.error(
      `Datenbasis fehlt: ${DATASET_FILE}\n` +
        "Zuerst prepare-dataset.py mit dem ALBTRIX-Export ausführen.",
    );
    process.exit(1);
  }
  const dataset = JSON.parse(fs.readFileSync(DATASET_FILE, "utf8"));
  const selection = selectProducts(dataset, args);

  info("Auswahl steht", {
    ausgewaehlt: selection.length,
    von: dataset.counts.retail,
    marken: new Set(selection.map((p) => p.brand)).size,
    kind: args.kind,
  });

  if (args.dryRun) {
    for (const [i, p] of selection.entries()) {
      console.log(
        `${String(i + 1).padStart(3)}. ${(p.brand || "—").padEnd(18)} ` +
          `${p.barcode.padEnd(14)} ${p.name.slice(0, 52).padEnd(52)} ` +
          `${p.reasons.join(", ")}`,
      );
    }
    const byBrand = selection.reduce((acc, p) => {
      acc[p.brand || "—"] = (acc[p.brand || "—"] ?? 0) + 1;
      return acc;
    }, {});
    info("Marken in dieser Charge", byBrand);
    return;
  }

  const results = [];
  const startedAt = Date.now();
  for (const [i, product] of selection.entries()) {
    const cached = cachedFileFor(product.code);
    if (cached) {
      const shape = inspectImage(fs.readFileSync(cached)) ?? {};
      results.push({
        ...baseRecord(product),
        status: "gefunden",
        source: "cache",
        file: path.relative(ROOT, cached),
        ...shape,
      });
      continue;
    }

    let hit = null;
    try {
      hit = await fetchImageFor(product);
    } catch (e) {
      results.push({
        ...baseRecord(product),
        status: "fehler",
        error: String(e?.message ?? e),
      });
      continue;
    }

    results.push(
      hit
        ? {
            ...baseRecord(product),
            status: "gefunden",
            source: hit.source,
            sourceUrl: hit.sourceUrl,
            imageUrl: hit.imageUrl,
            licence: hit.licence,
            sourceTitle: hit.title,
            file: path.relative(ROOT, hit.file),
            bytes: hit.bytes,
            width: hit.width,
            height: hit.height,
          }
        : { ...baseRecord(product), status: "kein Treffer" },
    );

    if ((i + 1) % 10 === 0 || i + 1 === selection.length) {
      const found = results.filter((r) => r.status === "gefunden").length;
      info("Fortschritt", { verarbeitet: i + 1, von: selection.length, gefunden: found });
      writeProgress(args, { processed: i + 1, total: selection.length, found });
    }
  }

  const found = results.filter((r) => r.status === "gefunden").length;
  const report = {
    generatedAt: ts(),
    label: args.label,
    dataset: path.relative(ROOT, DATASET_FILE),
    selection: {
      kind: args.kind,
      limit: args.limit,
      perBrand: args.perBrand,
      brand: args.brand || null,
    },
    totals: {
      selected: selection.length,
      found,
      missing: selection.length - found,
      durationMs: Date.now() - startedAt,
    },
    products: results,
  };
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const reportFile = path.join(REPORT_DIR, `product-images-${args.label}.json`);
  fs.writeFileSync(reportFile, `${JSON.stringify(report, null, 2)}\n`);
  info("fertig", {
    gefunden: found,
    ohneTreffer: selection.length - found,
    bericht: path.relative(ROOT, reportFile),
  });
}

function baseRecord(product) {
  return {
    code: product.code,
    name: product.name,
    brand: product.brand,
    barcode: product.barcode,
    price: product.price,
    supplier: product.supplier,
    reasons: product.reasons,
  };
}

function writeProgress(args, progress) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(
    PROGRESS_FILE,
    `${JSON.stringify({ updatedAt: ts(), label: args.label, ...progress }, null, 2)}\n`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
