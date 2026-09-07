#!/usr/bin/env node
/**
 * ALBTRIX export → the catalog's working data set.
 * ------------------------------------------------
 * Reads the pharmacy's ERP export ("Lista e Produkteve_me Brende_JARA.xlsx")
 * and writes a clean, machine-readable record of every article to
 * `scripts/catalog/data/albtrix-products.json`.
 *
 * Why this file exists at all: the source .xlsx is excluded from git (`*.xlsx`
 * is in .gitignore, and an ERP dump does not belong in a public repository), so
 * the generated JSON is the durable, reviewable record the rest of the pipeline
 * builds on — and the only copy that travels between the two work machines.
 *
 * What it decides, and nothing more:
 *   - which rows are products at all (bookkeeping lines are dropped),
 *   - retail goods vs. medicines, because only retail goes to the website,
 *   - whether a barcode can identify the product outside this pharmacy,
 *   - how findable a photo is (A-D), so batch 1 can start with the easy ones.
 *
 * It invents nothing: no categories, no descriptions, no photos. Those come
 * later, from the image search and from human review.
 *
 * Usage:
 *   node scripts/catalog/import-albtrix.mjs
 *   node scripts/catalog/import-albtrix.mjs --dry-run     # report only
 *   node scripts/catalog/import-albtrix.mjs --source <path to .xlsx>
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readWorkbook } from "./lib/xlsx.mjs";
import { classifyBarcode, findabilityGrade } from "./lib/gs1.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..");
const DEFAULT_SOURCE = path.join(ROOT, "9460 Produkte", "Lista e Produkteve_me Brende_JARA.xlsx");
const OUT_FILE = path.join(HERE, "data", "albtrix-products.json");

/** Column layout of the ALBTRIX export, verified against the real file. */
const COLUMNS = {
  code: "A", // Shifra
  name: "B", // Emërtimi
  barcode: "C", // Barkodi
  kind: "D", // Lloji i artikullit
  price: "E", // Çmimi shitës
  supplier: "F", // Furnitori
  brand: "G", // Brendi
};

/** Article kinds seen in the export. Only `100` is destined for the website. */
const KINDS = {
  100: { id: "retail", label: "Mall tregtar (OTC)", forWebsite: true },
  901: { id: "medicine", label: "Barna", forWebsite: false },
  700: { id: "expense", label: "Llogari shpenzimesh", forWebsite: false },
  200: { id: "asset", label: "Mjete themelore", forWebsite: false },
  750: { id: "other", label: "Tjetër", forWebsite: false },
};

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const sourceIndex = args.indexOf("--source");
  const source = sourceIndex >= 0 ? args[sourceIndex + 1] : DEFAULT_SOURCE;

  if (!fs.existsSync(source)) {
    console.error(`\n  Quelldatei nicht gefunden:\n  ${source}\n`);
    process.exit(1);
  }

  const workbook = readWorkbook(fs.readFileSync(source));
  const rows = workbook.rows(0);
  const products = [];
  const skipped = [];

  for (const [rowNumber, cells] of [...rows.entries()].sort((a, b) => a[0] - b[0])) {
    if (rowNumber === 1) continue; // header
    const code = text(cells[COLUMNS.code]);
    const name = text(cells[COLUMNS.name]);
    // The export ends with two technical footer lines that carry no article
    // code; anything without both a code and a name is not a product.
    if (!code || !name) {
      if (code || name) skipped.push({ row: rowNumber, code, name });
      continue;
    }
    products.push(buildRecord({ rowNumber, cells }));
  }

  const report = summarize(products, skipped, source);
  printSummary(report, products);

  if (dryRun) {
    console.log("  --dry-run: es wurde nichts geschrieben.\n");
    return;
  }

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  writeAtomic(OUT_FILE, `${JSON.stringify({ ...report, products }, null, 2)}\n`);
  console.log(`  Geschrieben: ${path.relative(ROOT, OUT_FILE)} (${sizeMb(OUT_FILE)} MB)\n`);
}

function buildRecord({ rowNumber, cells }) {
  const rawKind = text(cells[COLUMNS.kind]);
  const kind = KINDS[rawKind] ?? { id: "unknown", label: `Lloji ${rawKind || "?"}`, forWebsite: false };
  const brand = cleanBrand(cells[COLUMNS.brand]);
  const barcodeRaw = text(cells[COLUMNS.barcode]);
  const barcode = classifyBarcode(barcodeRaw);

  return {
    row: rowNumber,
    code: text(cells[COLUMNS.code]),
    name: collapseSpaces(text(cells[COLUMNS.name])),
    brand,
    barcode: barcodeRaw,
    barcodeStatus: barcode.status,
    barcodeUsable: barcode.usable,
    barcodeNote: barcode.reason,
    kind: kind.id,
    kindLabel: kind.label,
    forWebsite: kind.forWebsite,
    price: parsePrice(cells[COLUMNS.price]),
    supplier: cleanSupplier(cells[COLUMNS.supplier]),
    findability: findabilityGrade({ barcodeUsable: barcode.usable, hasBrand: Boolean(brand) }),
  };
}

/* ------------------------------------------------------------------ */
/*  Reporting                                                          */
/* ------------------------------------------------------------------ */

function summarize(products, skipped, source) {
  const retail = products.filter((p) => p.forWebsite);
  const duplicateCodes = findDuplicates(products.map((p) => p.code));
  const duplicateNames = findDuplicates(products.map((p) => p.name.toUpperCase()));

  return {
    generatedAt: new Date().toISOString(),
    source: path.basename(source),
    totals: {
      rows: products.length + skipped.length,
      products: products.length,
      skippedRows: skipped.length,
      byKind: countBy(products, (p) => p.kindLabel),
      retail: retail.length,
      retailWithUsableBarcode: retail.filter((p) => p.barcodeUsable).length,
      retailWithBrand: retail.filter((p) => p.brand).length,
      retailByFindability: countBy(retail, (p) => p.findability),
      retailByBarcodeStatus: countBy(retail, (p) => p.barcodeStatus),
    },
    dataQuality: {
      duplicateCodes,
      duplicateNameCount: duplicateNames.length,
      skippedRows: skipped,
    },
  };
}

function printSummary(report, products) {
  const t = report.totals;
  console.log(`\n  ALBTRIX-Import — ${report.source}`);
  console.log(`  ${"-".repeat(60)}`);
  console.log(`  Zeilen gelesen        ${t.rows}`);
  console.log(`  davon Artikel         ${t.products}   (${t.skippedRows} Nicht-Artikel-Zeilen verworfen)`);
  for (const [label, count] of Object.entries(t.byKind)) {
    console.log(`     ${label.padEnd(24)} ${String(count).padStart(5)}`);
  }
  console.log(`\n  Für die Website (Mall tregtar): ${t.retail}`);
  console.log(`     mit brauchbarem Barcode ${String(t.retailWithUsableBarcode).padStart(5)}`);
  console.log(`     mit Markenname          ${String(t.retailWithBrand).padStart(5)}`);
  console.log(`\n  Auffindbarkeit der Fotos (nur Handelsware):`);
  for (const grade of ["A", "B", "C", "D"]) {
    const count = t.retailByFindability[grade] ?? 0;
    const share = ((count / Math.max(1, t.retail)) * 100).toFixed(1);
    console.log(`     ${grade}  ${String(count).padStart(5)}  ${share.padStart(5)} %  ${GRADE_HINT[grade]}`);
  }
  if (report.dataQuality.duplicateCodes.length) {
    console.log(`\n  Achtung: ${report.dataQuality.duplicateCodes.length} doppelte Artikelcodes ` +
      `(${report.dataQuality.duplicateCodes.slice(0, 5).join(", ")})`);
  }
  console.log(`  ${products.length} Datensätze aufbereitet.`);
}

const GRADE_HINT = {
  A: "Barcode + Marke — beste Chance",
  B: "nur Barcode",
  C: "nur Marke",
  D: "weder noch — Handarbeit",
};

/* ------------------------------------------------------------------ */
/*  Small helpers                                                      */
/* ------------------------------------------------------------------ */

const text = (value) => (value ?? "").toString().trim();
const collapseSpaces = (value) => value.replace(/\s+/g, " ").trim();

/** Supplier names arrive padded and quoted: `" SMART PHARMA KOSOVA " SH.P.K. `. */
const cleanSupplier = (value) => collapseSpaces(text(value).replace(/"/g, " "));

/** Brands are inconsistently cased/spaced in the export; keep the wording. */
const cleanBrand = (value) => collapseSpaces(text(value));

function parsePrice(value) {
  const number = Number(text(value));
  // Prices arrive as raw floats (17.899999999999999) — cents are enough.
  return Number.isFinite(number) ? Math.round(number * 100) / 100 : null;
}

function countBy(items, pick) {
  const counts = {};
  for (const item of items) {
    const key = pick(item);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

function findDuplicates(values) {
  const seen = new Set();
  const duplicates = new Set();
  for (const value of values) {
    if (!value) continue;
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates];
}

/** Writes via a temp file so an interrupted run never truncates the old data. */
function writeAtomic(file, contents) {
  const temp = `${file}.tmp`;
  fs.writeFileSync(temp, contents, "utf8");
  fs.renameSync(temp, file);
}

const sizeMb = (file) => (fs.statSync(file).size / 1024 / 1024).toFixed(1);

main();
