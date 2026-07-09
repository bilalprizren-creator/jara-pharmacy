#!/usr/bin/env node
/**
 * SHEMO → JARA Pharmacy catalog importer (TEST IMPORT).
 * -----------------------------------------------------
 * Imports EXACTLY the first `IMPORT_LIMIT` (10) unique products from the public
 * SHEMO catalog (https://shemo-katalog.com/) into JARA's static data layer:
 *   - downloads the original product images into `public/products/`
 *   - writes an idempotent, product-code-keyed store to
 *     `src/data/imported/shemo-products.json`
 *   - emits a machine-readable report under `scripts/reports/`
 *
 * The catalog is a single static HTML page: every product is an inline
 * `<div class='product'>` with an image (`produkt/<file>.png`), a product code
 * (`<div class='nrserik'>`) and a name (`<p>`), grouped under `<h2>` headings.
 * There is no API, no per-product page, and no descriptions/prices/barcodes —
 * so only name + code + image are available; nothing is invented.
 *
 * Safety:
 *   - HARD LIMIT of 10 unique products enforced in code (not a comment).
 *   - Idempotent: re-running never creates duplicates; unchanged records are
 *     preserved byte-for-byte (stable timestamps).
 *   - Never deletes existing/curated products.
 *   - No auth/CAPTCHA/rate-limit bypass; polite single HTML fetch + spaced
 *     image downloads with retries and timeouts.
 *
 * Usage:
 *   node scripts/import-shemo.mjs            # real import (writes files)
 *   node scripts/import-shemo.mjs --dry-run  # fetch+parse+validate, write nothing
 *   SHEMO_FAIL_CODE=5088 node scripts/import-shemo.mjs   # simulate one bad image
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/* ------------------------------- config -------------------------------- */

const SOURCE_URL = "https://shemo-katalog.com/";
const IMPORT_LIMIT = 10; // ← hard cap on unique products, enforced below
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 3;
const POLITE_DELAY_MS = 400; // between image downloads
const USER_AGENT =
  "JaraPharmacyImporter/1.0 (+authorized test import of first 10 products)";

// Original SHEMO section heading → target JARA category.
const CATEGORY_MAP = {
  autan: {
    slug: "insect-care",
    label: { al: "Kundër insekteve", en: "Insect Protection" },
  },
};

const DRY_RUN = process.argv.includes("--dry-run");
const FAIL_CODE = process.env.SHEMO_FAIL_CODE || null; // test hook for resilience

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PUBLIC_PRODUCTS = path.join(ROOT, "public", "products");
const DATA_DIR = path.join(ROOT, "src", "data", "imported");
const DATA_FILE = path.join(DATA_DIR, "shemo-products.json");
const REPORT_DIR = path.join(__dirname, "reports");

/* ------------------------------ logging -------------------------------- */

const ts = () => new Date().toISOString();
const log = (level, msg, extra) =>
  console.log(
    JSON.stringify({ t: ts(), level, msg, ...(extra ? { extra } : {}) }),
  );
const info = (m, e) => log("info", m, e);
const warn = (m, e) => log("warn", m, e);
const error = (m, e) => log("error", m, e);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ------------------------------ helpers -------------------------------- */

function decodeEntities(s) {
  return String(s)
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function slugify(s, max = 50) {
  let out = String(s)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip combining diacritics (ë→e, ç→c)
    .replace(/ë/g, "e")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (out.length > max) {
    out = out.slice(0, max).replace(/-+$/g, "");
  }
  return out || "product";
}

function parsePackageSize(name) {
  const m = name.match(/(\d+(?:[.,]\d+)?)\s?(ml|l|mg|kg|g)\b/i);
  return m ? `${m[1].replace(",", ".")}${m[2].toLowerCase()}` : undefined;
}

// Fallback artwork spec (only rendered if `image` is ever missing — it isn't).
function guessForm(name) {
  const n = name.toLowerCase();
  if (/(sprej|sprey|spray|deo)/.test(n)) return "spray";
  if (/gel/.test(n)) return "tube";
  return "bottle";
}

function keywordTags(code, name) {
  const words = slugify(name, 200).split("-").filter((w) => w.length > 2);
  return Array.from(new Set([code, "autan", ...words]));
}

/** Read PNG width/height from the IHDR chunk. Returns null if not a valid PNG. */
function pngSize(buf) {
  const sig = [137, 80, 78, 71, 13, 10, 26, 10];
  if (buf.length < 24) return null;
  for (let i = 0; i < 8; i++) if (buf[i] !== sig[i]) return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

async function fetchWithRetry(url, { as = "text" } = {}) {
  let lastErr;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": USER_AGENT,
          Accept: as === "text" ? "text/html,*/*" : "image/*,*/*",
        },
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const contentType = res.headers.get("content-type") || "";
      if (as === "text") return { text: await res.text(), contentType };
      const buffer = Buffer.from(await res.arrayBuffer());
      return { buffer, contentType };
    } catch (e) {
      clearTimeout(timer);
      lastErr = e;
      if (attempt < MAX_RETRIES) {
        warn("request failed, retrying", {
          url,
          attempt,
          err: String(e && e.message ? e.message : e),
        });
        await sleep(500 * attempt);
      }
    }
  }
  throw lastErr;
}

/* ------------------------------ parsing -------------------------------- */

/** Parse the first IMPORT_LIMIT UNIQUE products in document (default) order. */
function parseFirstProducts(html) {
  // Heading positions, so each product can be tagged with its source section.
  const headings = [];
  const h2re = /<h2>([^<]*)<\/h2>/g;
  let hm;
  while ((hm = h2re.exec(html))) {
    headings.push({ index: hm.index, cat: decodeEntities(hm[1]).trim() });
  }

  const prodRe =
    /<div class='product'>\s*<img[^>]*src='([^']+)'[^>]*>\s*<div class='productinfo'>\s*<div class='nrserik'[^>]*>([^<]*)<\/div>\s*<p[^>]*>([^<]*)<\/p>/g;

  const products = [];
  const seen = new Set();
  let pm;
  while ((pm = prodRe.exec(html))) {
    const idx = pm.index;
    const code = decodeEntities(pm[2]).trim();
    const name = decodeEntities(pm[3]).trim();
    if (!code || !name) continue;
    if (seen.has(code)) continue; // first N *unique* products
    let sourceCategory = "";
    for (const h of headings) {
      if (h.index < idx) sourceCategory = h.cat;
      else break;
    }
    seen.add(code);
    products.push({
      order: products.length + 1,
      code,
      name,
      imgSrc: pm[1].trim(),
      sourceCategory,
    });
    if (products.length >= IMPORT_LIMIT) break; // ← HARD LIMIT enforced in code
  }
  // Defensive second guard so the cap can never be exceeded.
  return products.slice(0, IMPORT_LIMIT);
}

/* --------------------------- image download ---------------------------- */

async function downloadImage(imgSrc, code, destPath) {
  // Resolve + percent-encode (filenames contain spaces / parentheses).
  let url = new URL(imgSrc, SOURCE_URL).href;
  if (FAIL_CODE && code === FAIL_CODE) {
    url = new URL("produkt/__does_not_exist__.png", SOURCE_URL).href; // test hook
    warn("simulating broken image for resilience test", { code, url });
  }
  const { buffer, contentType } = await fetchWithRetry(url, { as: "binary" });

  // Validate: content-type, size, PNG signature.
  if (!/image\//i.test(contentType)) {
    throw new Error(`unexpected content-type: ${contentType}`);
  }
  if (buffer.length < 1024) {
    throw new Error(`suspiciously small image: ${buffer.length} bytes`);
  }
  const size = pngSize(buffer);
  if (!size) throw new Error("not a valid PNG (bad signature/IHDR)");

  if (!DRY_RUN) fs.writeFileSync(destPath, buffer);
  return { bytes: buffer.length, contentType, ...size, url };
}

/* ------------------------------ records -------------------------------- */

const META_KEYS = ["importedAt", "createdAt", "updatedAt"];

function stripMeta(rec) {
  const clone = { ...rec };
  for (const k of META_KEYS) delete clone[k];
  return clone;
}

/** Build a deterministic Product record (timestamps applied later in merge). */
function buildRecord(p, imagePath) {
  const mapping = CATEGORY_MAP[p.sourceCategory.toLowerCase()];
  if (!mapping) {
    throw new Error(
      `no category mapping for source section "${p.sourceCategory}" (code ${p.code})`,
    );
  }
  const nameSlug = slugify(p.name);
  // Fixed key order → stable JSON for idempotent byte-comparison.
  return {
    id: `shemo-${p.code}`,
    slug: `shemo-${p.code}-${nameSlug}`,
    name: p.name, // original name, unchanged
    brand: p.sourceCategory, // derived from the SHEMO section heading (e.g. "Autan")
    category: mapping.slug,
    categoryLabel: mapping.label,
    visual: { form: guessForm(p.name), palette: "green", label: "AUTAN" },
    image: imagePath,
    featured: false,
    tags: keywordTags(p.code, p.name),
    sku: p.code,
    productCode: p.code,
    packageSize: parsePackageSize(p.name),
    sourceCategory: p.sourceCategory,
    sourceUrl: SOURCE_URL,
    importSource: "shemo-katalog.com",
    isActive: true,
  };
}

function readExisting() {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

/**
 * Idempotent merge, keyed by productCode.
 *  - new code          → insert (importedAt/createdAt/updatedAt = now)
 *  - existing, changed → update (keep importedAt/createdAt, bump updatedAt)
 *  - existing, same    → skip   (preserve all timestamps → byte-identical)
 * Existing records not in this run are preserved (never deleted).
 */
function mergeRecords(freshRecords, now) {
  const existing = readExisting();
  const byCode = new Map(existing.map((r) => [r.productCode, r]));
  const statuses = new Map();

  for (const rec of freshRecords) {
    const prev = byCode.get(rec.productCode);
    if (!prev) {
      rec.importedAt = now;
      rec.createdAt = now;
      rec.updatedAt = now;
      statuses.set(rec.productCode, "inserted");
    } else {
      rec.importedAt = prev.importedAt ?? now;
      rec.createdAt = prev.createdAt ?? prev.importedAt ?? now;
      const same =
        JSON.stringify(stripMeta(prev)) === JSON.stringify(stripMeta(rec));
      rec.updatedAt = same ? (prev.updatedAt ?? rec.importedAt) : now;
      statuses.set(rec.productCode, same ? "skipped-unchanged" : "updated");
    }
    byCode.set(rec.productCode, rec);
  }

  // Output: this run's products in catalog order, then any pre-existing
  // records that were not part of this run (kept intact).
  const freshCodes = new Set(freshRecords.map((r) => r.productCode));
  const preserved = existing.filter((r) => !freshCodes.has(r.productCode));
  const output = [...freshRecords, ...preserved];
  return { output, statuses, preservedCount: preserved.length };
}

/* -------------------------------- main --------------------------------- */

async function main() {
  info("SHEMO import started", { dryRun: DRY_RUN, importLimit: IMPORT_LIMIT });

  if (!DRY_RUN) {
    fs.mkdirSync(PUBLIC_PRODUCTS, { recursive: true });
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.mkdirSync(REPORT_DIR, { recursive: true });
  }

  // 1. Fetch the catalog (single polite request, with retries/timeout).
  info("fetching catalog", { url: SOURCE_URL });
  const { text: html } = await fetchWithRetry(SOURCE_URL, { as: "text" });
  info("catalog fetched", { bytes: html.length });

  // 2. Parse the first 10 unique products.
  const parsed = parseFirstProducts(html);
  info("parsed products", { count: parsed.length });
  if (parsed.length === 0) throw new Error("no products parsed — markup changed?");

  // 3. Download + validate images; 4. build records.
  const now = ts();
  const fresh = [];
  const reportRows = [];
  for (const p of parsed) {
    const filename = `shemo-${p.code}-${slugify(p.name)}-original.png`;
    const destPath = path.join(PUBLIC_PRODUCTS, filename);
    const imagePath = `/products/${filename}`;
    const row = {
      order: p.order,
      code: p.code,
      name: p.name,
      sourceCategory: p.sourceCategory,
      sourceUrl: SOURCE_URL,
    };
    try {
      const img = await downloadImage(p.imgSrc, p.code, destPath);
      row.image = imagePath;
      row.imageBytes = img.bytes;
      row.resolution = `${img.width}x${img.height}`;
      row.imageStatus = DRY_RUN ? "validated (not saved)" : "downloaded";
      const rec = buildRecord(p, imagePath);
      rec.additionalImages = []; // SHEMO exposes a single image per product
      fresh.push(rec);
      row.category = rec.category;
      row.recordId = rec.id;
      info("product ok", {
        code: p.code,
        resolution: row.resolution,
        category: rec.category,
      });
    } catch (e) {
      row.imageStatus = "FAILED";
      row.error = String(e && e.message ? e.message : e);
      error("product failed", { code: p.code, err: row.error });
    }
    reportRows.push(row);
    await sleep(POLITE_DELAY_MS);
  }

  // 5–8. Idempotent merge + write store.
  const { output, statuses, preservedCount } = mergeRecords(fresh, now);
  for (const row of reportRows) {
    if (row.recordId) row.mergeStatus = statuses.get(row.code) || "n/a";
  }

  if (!DRY_RUN) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(output, null, 2) + "\n", "utf8");
    info("store written", {
      file: path.relative(ROOT, DATA_FILE),
      total: output.length,
      preserved: preservedCount,
    });
  } else {
    info("dry-run: store NOT written", { wouldTotal: output.length });
  }

  // 9. Report.
  const succeeded = reportRows.filter((r) => r.recordId).length;
  const failed = reportRows.filter((r) => !r.recordId);
  const report = {
    generatedAt: now,
    dryRun: DRY_RUN,
    source: SOURCE_URL,
    importLimit: IMPORT_LIMIT,
    parsed: parsed.length,
    imported: succeeded,
    failed: failed.length,
    storeFile: path.relative(ROOT, DATA_FILE),
    storeTotalAfterMerge: output.length,
    preservedExisting: preservedCount,
    products: reportRows,
  };
  if (!DRY_RUN) {
    const reportPath = path.join(
      REPORT_DIR,
      `shemo-import-${now.replace(/[:.]/g, "-")}.json`,
    );
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n", "utf8");
    info("report written", { file: path.relative(ROOT, reportPath) });
  }

  // Console summary table.
  console.log("\n=== SHEMO import summary ===");
  console.table(
    reportRows.map((r) => ({
      "#": r.order,
      code: r.code,
      name: r.name.length > 42 ? r.name.slice(0, 39) + "…" : r.name,
      "src cat": r.sourceCategory,
      "JARA cat": r.category || "-",
      resolution: r.resolution || "-",
      image: r.imageStatus,
      merge: r.mergeStatus || "-",
    })),
  );
  console.log(
    `\nParsed ${parsed.length} · imported ${succeeded} · failed ${failed.length}` +
      (DRY_RUN ? " · DRY RUN (nothing written)" : ` · store: ${report.storeFile}`),
  );

  if (failed.length > 0) {
    warn("some products failed", { codes: failed.map((f) => f.code) });
  }
}

main().catch((e) => {
  error("import aborted", { err: String(e && e.stack ? e.stack : e) });
  process.exit(1);
});
