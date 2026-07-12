#!/usr/bin/env node
/**
 * SHEMO → JARA Pharmacy catalog importer.
 * ----------------------------------------
 * Imports unique products from the public SHEMO catalog
 * (https://shemo-katalog.com/) into JARA's static data layer:
 *   - downloads the original product images into `public/products/`
 *   - writes an idempotent, product-code-keyed store to
 *     `src/data/imported/shemo-products.json`
 *   - emits machine-readable reports under `scripts/reports/`
 *
 * The catalog is a single static HTML page: every product is an inline
 * `<div class='product'>` with an image (`produkt/<file>.png`), a product code
 * (`<div class='nrserik'>`) and a name (`<p>`), grouped under `<h2>` section
 * headings. There is no API, no per-product page, and no descriptions/prices/
 * barcodes — so only name + code + image are available; nothing is invented.
 *
 * Some sections are branded prescription/clinical pharma lines (antibiotics,
 * PPIs, diabetes meds, IV solutions, injectables) rather than OTC retail
 * items. Those are listed in EXCLUDED_CATEGORIES below and are never
 * downloaded/published — they're routed to the manual-review CSV instead,
 * pending an explicit pharmacist/owner decision.
 *
 * Safety:
 *   - Idempotent: re-running never creates duplicates; unchanged records are
 *     preserved byte-for-byte (stable timestamps).
 *   - Resumable: if a product's image is already on disk and validates, the
 *     network fetch is skipped entirely — re-running after an interruption
 *     picks up where it left off without re-downloading completed work.
 *   - Never deletes existing/curated products.
 *   - The product store is written once, atomically, after all batches
 *     complete — a crash mid-run leaves the previous store file untouched.
 *   - No auth/CAPTCHA/rate-limit bypass; a single polite HTML fetch, then
 *     spaced image downloads (only for images not already on disk) with
 *     retries and timeouts.
 *
 * Usage:
 *   node scripts/import-shemo.mjs                 # real import (writes files)
 *   node scripts/import-shemo.mjs --dry-run       # fast count + category
 *                                                  # breakdown only, no
 *                                                  # network image fetches,
 *                                                  # nothing written
 *   SHEMO_BATCH_SIZE=50 node scripts/import-shemo.mjs
 *   SHEMO_IMPORT_LIMIT=25 node scripts/import-shemo.mjs   # cap for testing
 *   SHEMO_FAIL_CODE=5088 node scripts/import-shemo.mjs    # simulate 1 bad image
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/* ------------------------------- config -------------------------------- */

const SOURCE_URL = "https://shemo-katalog.com/";
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 3;
const POLITE_DELAY_MS = 400; // between image downloads that hit the network
const USER_AGENT =
  "JaraPharmacyImporter/1.0 (+authorized catalog import for jarapharmacy.com)";

// Defensive ceiling only — the known catalog is ~1,833 products. Prevents a
// markup change (e.g. an accidental infinite match) from running away.
const SAFETY_CAP = 5000;
// Optional override for staged/test runs; unset = SAFETY_CAP (i.e. "all").
const IMPORT_LIMIT = process.env.SHEMO_IMPORT_LIMIT
  ? Number(process.env.SHEMO_IMPORT_LIMIT)
  : SAFETY_CAP;
const BATCH_SIZE = process.env.SHEMO_BATCH_SIZE
  ? Number(process.env.SHEMO_BATCH_SIZE)
  : 50;

// Original SHEMO section heading (exact, case-sensitive) → target JARA
// category slug. Every heading found in the catalog must appear here or in
// EXCLUDED_CATEGORIES below; anything unrecognized is routed to manual review
// rather than guessed at.
const CATEGORY_MAP = {
  Autan: "insect-care",
  SHEMO: "medical-devices",
  "Oksigjen dhe aparatura": "medical-devices",
  Diabetike: "medical-devices",
  "Aparatur per tension": "medical-devices",
  "Mates i temperatures": "medical-devices",
  "Bebe dhe Nena": "mother-baby",
  Rabir: "medical-devices",
  "Pajisje per vesh": "medical-devices",
  Pavloderm: "skincare",
  "Top Pomada": "skincare",
  Vaseline: "skincare",
  Labella: "skincare",
  Senti2: "health-care",
  Krauterhof: "natural",
  Figo: "medical-devices",
  Cansin: "medical-devices",
  "Elina Med": "health-care",
  "Love,Hitman,Dolphi": "intimate-care",
  Qokollada: "vitamins",
  Corega: "oral-care",
  NT41: "health-care",
  "Ivy Bear": "vitamins",
  "Eferveta me brende te ndryshme": "vitamins",
  Haribo: "other",
  "Multiplus suplement": "vitamins",
  Dermosept: "health-care",
  "Aqua dhe Dermosept": "health-care",
  Nutrifactor: "vitamins",
  "Cellcense by Nutrifactor": "haircare",
  Pharmavital: "vitamins",
  Vajera: "natural",
  "Suplemente te ndryshme": "vitamins",
  Shurup: "vitamins",
  ATC: "natural",
  Orbita: "other",
  Froika: "mother-baby",
  "Bioblas dhe restorex": "haircare",
  "Kozmetika te ndryshme": "skincare",
  "Kozmetike becutan": "mother-baby",
  "Johnson's Baby": "mother-baby",
  Dentare: "oral-care",
  "Mr. White": "oral-care",
  Chicco: "mother-baby",
  "Bio Tree Baby": "mother-baby",
  Pampersa: "mother-baby",
  "Peceta Higjienike dhe Tampon": "feminine-care",
  Ortopedike: "medical-devices",
  Ortopedi: "medical-devices",
  Tio: "medical-devices",
  "Dr. Luigi": "medical-devices",
  "Pika dhe Spreja": "health-care",
};

// Bilingual labels for every target slug used above (mirrors src/data/categories.ts).
const CATEGORY_LABELS = {
  skincare: { al: "Kujdes për lëkurën", en: "Skincare" },
  haircare: { al: "Kujdes për flokë", en: "Hair Care" },
  vitamins: { al: "Vitamina & suplemente", en: "Vitamins & Supplements" },
  "mother-baby": { al: "Nënë & bebe", en: "Mother & Baby" },
  natural: { al: "Produkte natyrale", en: "Natural Products" },
  "oral-care": { al: "Kujdes oral", en: "Oral Care" },
  "health-care": { al: "Kujdes shëndetësor", en: "Health Care" },
  "insect-care": { al: "Kundër insekteve", en: "Insect Protection" },
  "medical-devices": { al: "Pajisje mjekësore", en: "Medical Devices" },
  "feminine-care": { al: "Higjiena femërore", en: "Feminine Care" },
  "intimate-care": { al: "Kujdes intim", en: "Intimate Care" },
  other: { al: "Të tjera", en: "Other" },
};

// Branded prescription/clinical pharma sections — excluded from auto-import
// pending pharmacist/owner review (approved scope; see manual-review CSV).
const EXCLUDED_CATEGORIES = new Set([
  "Belupo",
  "Galenika",
  "HEMOFARM",
  "STADA",
  "REMEDICA",
  "ABDIIBRAHIM",
  "Nobel",
  "Infuzione",
  "Ampulla",
  "Barnat",
]);

const DRY_RUN = process.argv.includes("--dry-run");
const FAIL_CODE = process.env.SHEMO_FAIL_CODE || null; // test hook for resilience

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PUBLIC_PRODUCTS = path.join(ROOT, "public", "products");
const DATA_DIR = path.join(ROOT, "src", "data", "imported");
const DATA_FILE = path.join(DATA_DIR, "shemo-products.json");
const REPORT_DIR = path.join(__dirname, "reports");
const STATE_DIR = path.join(__dirname, "state");
const PROGRESS_FILE = path.join(STATE_DIR, "shemo-import-progress.json");

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

// Fallback artwork spec — only rendered if `image` were ever missing, which
// never happens here (every imported product has a validated downloaded image).
function guessForm(name) {
  const n = name.toLowerCase();
  if (/(sprej|sprey|spray|deo)/.test(n)) return "spray";
  if (/gel/.test(n)) return "tube";
  if (/(krem|cream)/.test(n)) return "jar";
  if (/(shampo|shampoo|balsam)/.test(n)) return "bottle";
  return "box";
}

function keywordTags(code, name, sourceCategory) {
  const words = slugify(name, 200).split("-").filter((w) => w.length > 2);
  const brandTag = slugify(sourceCategory, 30);
  return Array.from(new Set([code, brandTag, ...words]));
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

/** Parse ALL unique products in document order, tagged with their source section. */
function parseAllProducts(html) {
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
    if (seen.has(code)) continue; // unique by product code
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
    if (products.length >= SAFETY_CAP) break; // ← hard defensive ceiling
  }
  return products;
}

/* --------------------------- image download ---------------------------- */

/**
 * Resolve a product's image: reuse an already-downloaded, still-valid local
 * file when present (resumability — no network call, no rate-limit delay),
 * otherwise fetch it fresh from the source and validate before saving.
 */
async function resolveImage(imgSrc, code, destPath) {
  if (fs.existsSync(destPath)) {
    try {
      const buffer = fs.readFileSync(destPath);
      const size = pngSize(buffer);
      if (size && buffer.length >= 1024) {
        return { bytes: buffer.length, ...size, reused: true };
      }
      warn("existing image invalid, re-downloading", { code, destPath });
    } catch {
      // fall through to re-download
    }
  }

  let url = new URL(imgSrc, SOURCE_URL).href;
  if (FAIL_CODE && code === FAIL_CODE) {
    url = new URL("produkt/__does_not_exist__.png", SOURCE_URL).href; // test hook
    warn("simulating broken image for resilience test", { code, url });
  }
  const { buffer, contentType } = await fetchWithRetry(url, { as: "binary" });

  if (!/image\//i.test(contentType)) {
    throw new Error(`unexpected content-type: ${contentType}`);
  }
  if (buffer.length < 1024) {
    throw new Error(`suspiciously small image: ${buffer.length} bytes`);
  }
  const size = pngSize(buffer);
  if (!size) throw new Error("not a valid PNG (bad signature/IHDR)");

  if (!DRY_RUN) fs.writeFileSync(destPath, buffer);
  return { bytes: buffer.length, contentType, ...size, url, reused: false };
}

/* ------------------------------ records -------------------------------- */

const META_KEYS = ["importedAt", "createdAt", "updatedAt"];

function stripMeta(rec) {
  const clone = { ...rec };
  for (const k of META_KEYS) delete clone[k];
  return clone;
}

/** Build a deterministic Product record (timestamps applied later in merge). */
function buildRecord(p, imagePath, targetSlug) {
  const nameSlug = slugify(p.name);
  const label = (p.sourceCategory || "PRODUCT").toUpperCase().slice(0, 24);
  // Fixed key order → stable JSON for idempotent byte-comparison.
  return {
    id: `shemo-${p.code}`,
    slug: `shemo-${p.code}-${nameSlug}`,
    name: p.name, // original name, unchanged
    brand: p.sourceCategory, // derived from the SHEMO section heading
    category: targetSlug,
    categoryLabel: CATEGORY_LABELS[targetSlug],
    visual: { form: guessForm(p.name), palette: "green", label },
    image: imagePath,
    featured: false,
    tags: keywordTags(p.code, p.name, p.sourceCategory),
    sku: p.code,
    productCode: p.code,
    packageSize: parsePackageSize(p.name),
    sourceCategory: p.sourceCategory,
    sourceUrl: SOURCE_URL,
    importSource: "shemo-katalog.com",
    isActive: true,
    additionalImages: [],
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

  const freshCodes = new Set(freshRecords.map((r) => r.productCode));
  const preserved = existing.filter((r) => !freshCodes.has(r.productCode));
  const output = [...freshRecords, ...preserved];
  return { output, statuses, preservedCount: preserved.length };
}

/* -------------------------------- CSV ----------------------------------- */

function csvEscape(v) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(rows, columns) {
  const header = columns.join(",");
  const lines = rows.map((r) => columns.map((c) => csvEscape(r[c])).join(","));
  return [header, ...lines].join("\n") + "\n";
}

/* -------------------------------- main --------------------------------- */

async function main() {
  const startedAt = Date.now();
  info("SHEMO import started", {
    dryRun: DRY_RUN,
    importLimit: IMPORT_LIMIT === SAFETY_CAP ? "all (safety cap " + SAFETY_CAP + ")" : IMPORT_LIMIT,
    batchSize: BATCH_SIZE,
  });

  if (!DRY_RUN) {
    fs.mkdirSync(PUBLIC_PRODUCTS, { recursive: true });
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.mkdirSync(REPORT_DIR, { recursive: true });
    fs.mkdirSync(STATE_DIR, { recursive: true });
  }

  // 1. Fetch the catalog (single polite request; it's one static page).
  info("fetching catalog", { url: SOURCE_URL });
  const { text: html } = await fetchWithRetry(SOURCE_URL, { as: "text" });
  info("catalog fetched", { bytes: html.length });

  // 2. Parse ALL unique products, then classify by category.
  const all = parseAllProducts(html);
  info("parsed catalog", { totalUniqueProducts: all.length });
  if (all.length === 0) throw new Error("no products parsed — markup changed?");

  const byCategory = new Map();
  for (const p of all) {
    if (!byCategory.has(p.sourceCategory)) byCategory.set(p.sourceCategory, []);
    byCategory.get(p.sourceCategory).push(p);
  }

  const toImport = [];
  const excludedRows = [];
  const unmappedRows = [];
  for (const p of all) {
    if (EXCLUDED_CATEGORIES.has(p.sourceCategory)) {
      excludedRows.push({
        code: p.code,
        name: p.name,
        sourceCategory: p.sourceCategory,
        reason: "excluded-category (prescription/clinical pharma line — pending review)",
        sourceUrl: SOURCE_URL,
      });
      continue;
    }
    if (!CATEGORY_MAP[p.sourceCategory]) {
      unmappedRows.push({
        code: p.code,
        name: p.name,
        sourceCategory: p.sourceCategory,
        reason: "unmapped-category (no target JARA category defined)",
        sourceUrl: SOURCE_URL,
      });
      continue;
    }
    toImport.push(p);
  }

  const capped = toImport.slice(0, IMPORT_LIMIT);
  if (capped.length < toImport.length) {
    info("import limit applied", { limit: IMPORT_LIMIT, skipped: toImport.length - capped.length });
  }

  // Category breakdown report (always computed — this is the "dry run" data).
  const categoryBreakdown = [...byCategory.entries()].map(([cat, arr]) => ({
    sourceCategory: cat,
    count: arr.length,
    status: EXCLUDED_CATEGORIES.has(cat)
      ? "excluded"
      : CATEGORY_MAP[cat]
        ? "mapped -> " + CATEGORY_MAP[cat]
        : "UNMAPPED",
  }));

  info("category breakdown ready", {
    totalCategories: byCategory.size,
    toImport: capped.length,
    excluded: excludedRows.length,
    unmapped: unmappedRows.length,
  });

  if (DRY_RUN) {
    console.log("\n=== SHEMO catalog — DRY RUN (counts only, nothing written) ===");
    console.table(categoryBreakdown);
    console.log(
      `\nTotal unique products in catalog: ${all.length}\n` +
        `Would import (OTC/retail): ${capped.length}\n` +
        `Excluded (pharma/clinical, -> manual review): ${excludedRows.length}\n` +
        `Unmapped (-> manual review): ${unmappedRows.length}\n` +
        `Target categories used: ${new Set(capped.map((p) => CATEGORY_MAP[p.sourceCategory])).size}`,
    );
    return;
  }

  // 3–4. Download/validate images (skipping ones already on disk) + build records.
  const now = ts();
  const fresh = [];
  const reportRows = [];
  const failures = [];
  const totalBatches = Math.ceil(capped.length / BATCH_SIZE) || 1;

  for (let b = 0; b < totalBatches; b++) {
    const batch = capped.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE);
    let batchOk = 0;
    let batchFailed = 0;
    let batchReused = 0;

    for (const p of batch) {
      const targetSlug = CATEGORY_MAP[p.sourceCategory];
      const filename = `shemo-${p.code}-${slugify(p.name)}-original.png`;
      const destPath = path.join(PUBLIC_PRODUCTS, filename);
      const imagePath = `/products/${filename}`;
      const row = {
        order: p.order,
        code: p.code,
        name: p.name,
        sourceCategory: p.sourceCategory,
        category: targetSlug,
        sourceUrl: SOURCE_URL,
      };
      try {
        const img = await resolveImage(p.imgSrc, p.code, destPath);
        row.image = imagePath;
        row.imageBytes = img.bytes;
        row.resolution = `${img.width}x${img.height}`;
        row.imageStatus = img.reused ? "reused-existing" : "downloaded";
        const rec = buildRecord(p, imagePath, targetSlug);
        fresh.push(rec);
        row.recordId = rec.id;
        batchOk++;
        if (img.reused) batchReused++;
        if (!img.reused) await sleep(POLITE_DELAY_MS); // rate-limit real network hits only
      } catch (e) {
        row.imageStatus = "FAILED";
        row.error = String(e && e.message ? e.message : e);
        failures.push({ ...row });
        batchFailed++;
        error("product failed", { code: p.code, err: row.error });
      }
      reportRows.push(row);
    }

    info("batch complete", {
      batch: b + 1,
      of: totalBatches,
      batchSize: batch.length,
      ok: batchOk,
      reused: batchReused,
      failed: batchFailed,
      totalProcessedSoFar: reportRows.length,
      totalOfPlanned: capped.length,
    });

    fs.writeFileSync(
      PROGRESS_FILE,
      JSON.stringify(
        {
          updatedAt: ts(),
          batch: b + 1,
          totalBatches,
          processed: reportRows.length,
          planned: capped.length,
          succeeded: reportRows.filter((r) => r.recordId).length,
          failed: failures.length,
        },
        null,
        2,
      ) + "\n",
      "utf8",
    );
  }

  // 5–8. Idempotent merge + single atomic store write.
  const { output, statuses, preservedCount } = mergeRecords(fresh, now);
  for (const row of reportRows) {
    if (row.recordId) row.mergeStatus = statuses.get(row.code) || "n/a";
  }

  fs.writeFileSync(DATA_FILE, JSON.stringify(output, null, 2) + "\n", "utf8");
  info("store written", {
    file: path.relative(ROOT, DATA_FILE),
    total: output.length,
    preserved: preservedCount,
  });

  // 9. Reports.
  const succeeded = reportRows.filter((r) => r.recordId).length;
  const inserted = [...statuses.values()].filter((s) => s === "inserted").length;
  const updated = [...statuses.values()].filter((s) => s === "updated").length;
  const skippedUnchanged = [...statuses.values()].filter((s) => s === "skipped-unchanged").length;
  const durationMs = Date.now() - startedAt;

  const manualReviewRows = [...excludedRows, ...unmappedRows];

  const fullReport = {
    generatedAt: now,
    source: SOURCE_URL,
    durationMs,
    batchSize: BATCH_SIZE,
    totalBatches,
    totals: {
      uniqueProductsInCatalog: all.length,
      uniqueSourceCategories: byCategory.size,
      plannedForImport: capped.length,
      succeeded,
      inserted,
      updated,
      skippedUnchanged,
      failed: failures.length,
      excludedPharma: excludedRows.length,
      unmappedCategory: unmappedRows.length,
      storeTotalAfterMerge: output.length,
      preservedExisting: preservedCount,
    },
    categoryBreakdown,
    products: reportRows,
  };
  const reportPath = path.join(
    REPORT_DIR,
    `shemo-full-import-report.json`,
  );
  fs.writeFileSync(reportPath, JSON.stringify(fullReport, null, 2) + "\n", "utf8");
  info("full report written", { file: path.relative(ROOT, reportPath) });

  const failuresPath = path.join(REPORT_DIR, "shemo-import-failures.json");
  fs.writeFileSync(failuresPath, JSON.stringify(failures, null, 2) + "\n", "utf8");

  const reviewPath = path.join(REPORT_DIR, "shemo-manual-review.csv");
  fs.writeFileSync(
    reviewPath,
    toCsv(manualReviewRows, ["code", "name", "sourceCategory", "reason", "sourceUrl"]),
    "utf8",
  );
  info("manual-review + failures reports written", {
    failures: path.relative(ROOT, failuresPath),
    manualReview: path.relative(ROOT, reviewPath),
  });

  console.log("\n=== SHEMO full import summary ===");
  console.table(categoryBreakdown);
  console.log(
    `\nCatalog unique products: ${all.length} · categories: ${byCategory.size}\n` +
      `Imported (succeeded): ${succeeded} (inserted ${inserted}, updated ${updated}, unchanged ${skippedUnchanged})\n` +
      `Failed: ${failures.length} · Excluded (pharma): ${excludedRows.length} · Unmapped: ${unmappedRows.length}\n` +
      `Store total after merge: ${output.length} · Duration: ${(durationMs / 1000).toFixed(1)}s\n` +
      `Reports: ${path.relative(ROOT, reportPath)}, ${path.relative(ROOT, failuresPath)}, ${path.relative(ROOT, reviewPath)}`,
  );

  if (failures.length > 0) {
    warn("some products failed", { codes: failures.map((f) => f.code) });
  }
}

main().catch((e) => {
  error("import aborted", { err: String(e && e.stack ? e.stack : e) });
  process.exit(1);
});
