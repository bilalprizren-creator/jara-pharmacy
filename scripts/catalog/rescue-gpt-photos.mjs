#!/usr/bin/env node
/**
 * Rescues the 150 product photos that are trapped inside a workbook.
 * ------------------------------------------------------------------
 * "JARA_Produkte_mit_gefundenen_Fotos_150-1.xlsx" holds real work: 150 product
 * photos found one by one, each with its source page, a confidence rating and a
 * reviewer note. As long as they live inside a 12 MB spreadsheet they cannot be
 * reviewed on a phone, cannot be resized, and cannot reach the website. This
 * script lifts them out into ordinary image files plus one report.
 *
 * Two things about that workbook made a naive reader fail (both handled in
 * `lib/xlsx.mjs`): the article codes of rows 51-150 are formulas without cached
 * values, and the pictures are anchored through the drawing part rather than
 * stored in cells. Picture N belongs to row N+4 — the anchor is what is trusted
 * here, not that arithmetic.
 *
 * Every rescued photo is checked back against the ALBTRIX data set, because a
 * photo is only useful if the article actually exists in the assortment and is
 * destined for the website (retail, not medicine).
 *
 * Safety: images are written into `.image-cache/` (kept out of git), never into
 * `public/`. Nothing reaches the website from here — that is the job of the
 * review page and the catalog build that follow.
 *
 * Usage:
 *   node scripts/catalog/rescue-gpt-photos.mjs
 *   node scripts/catalog/rescue-gpt-photos.mjs --dry-run
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { readWorkbook } from "./lib/xlsx.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..");
const SOURCE = path.join(ROOT, "9460 Produkte", "JARA_Produkte_mit_gefundenen_Fotos_150-1.xlsx");
const ALBTRIX = path.join(HERE, "data", "albtrix-products.json");
const IMAGE_DIR = path.join(ROOT, ".image-cache", "gpt-150");
const REPORT = path.join(HERE, "reports", "gpt-150.json");

const HEADER_ROW = 4;
const COLUMNS = {
  number: "A",
  code: "C",
  name: "D",
  barcode: "E",
  brand: "F",
  confidence: "G",
  status: "H",
  decision: "I",
  sourcePage: "J",
  imageUrl: "K",
  note: "L",
  file: "M",
};

function main() {
  const dryRun = process.argv.includes("--dry-run");
  if (!fs.existsSync(SOURCE)) {
    console.error(`\n  Quelldatei nicht gefunden:\n  ${SOURCE}\n`);
    process.exit(1);
  }

  const workbook = readWorkbook(fs.readFileSync(SOURCE));
  const rows = workbook.rows(0);
  const anchors = new Map(workbook.imageAnchors(0).map((a) => [a.row, a.part]));
  const assortment = loadAssortment();

  const photos = [];
  const problems = [];

  for (const [rowNumber, cells] of [...rows.entries()].sort((a, b) => a[0] - b[0])) {
    if (rowNumber <= HEADER_ROW) continue;
    const code = value(cells, "code");
    if (!code) continue;

    const part = anchors.get(rowNumber);
    if (!part) {
      problems.push({ row: rowNumber, code, problem: "Nuk ka fotografi në këtë rresht" });
      continue;
    }

    const bytes = workbook.part(part);
    const image = probePng(bytes);
    const article = assortment.get(code);
    const fileName = value(cells, "file") || `${String(photos.length + 1).padStart(3, "0")}_${code}.png`;

    photos.push({
      number: Number(value(cells, "number")) || photos.length + 1,
      code,
      name: value(cells, "name"),
      barcode: value(cells, "barcode"),
      brand: value(cells, "brand"),
      confidence: value(cells, "confidence"),
      status: value(cells, "status"),
      decision: value(cells, "decision") || "Pa kontrolluar",
      sourcePage: value(cells, "sourcePage"),
      imageUrl: value(cells, "imageUrl"),
      note: value(cells, "note"),
      file: path.posix.join(".image-cache/gpt-150", fileName),
      bytes: bytes.length,
      width: image?.width ?? null,
      height: image?.height ?? null,
      sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
      // Cross-check against the real assortment — a photo for an article that
      // is not in stock (or is a medicine) must not silently reach the catalog.
      inAssortment: Boolean(article),
      forWebsite: article?.forWebsite ?? false,
      assortmentName: article?.name ?? null,
      barcodeMatches: article ? article.barcode === value(cells, "barcode") : null,
    });

    if (!dryRun) writeImage(path.join(IMAGE_DIR, fileName), bytes);
  }

  for (const photo of photos) {
    if (!photo.inAssortment) {
      problems.push({ row: null, code: photo.code, problem: "Artikulli nuk gjendet në listën ALBTRIX" });
    } else if (!photo.forWebsite) {
      problems.push({ row: null, code: photo.code, problem: "Artikulli nuk është mall tregtar — nuk shkon në faqe" });
    } else if (photo.barcodeMatches === false) {
      problems.push({ row: null, code: photo.code, problem: "Barkodi ndryshon nga ai i listës ALBTRIX" });
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    source: path.basename(SOURCE),
    label: "gpt-150",
    totals: {
      photos: photos.length,
      inAssortment: photos.filter((p) => p.inAssortment).length,
      forWebsite: photos.filter((p) => p.forWebsite).length,
      byConfidence: countBy(photos, (p) => p.confidence || "—"),
      byStatus: countBy(photos, (p) => p.status || "—"),
      problems: problems.length,
    },
    problems,
    photos,
  };

  printSummary(report);
  if (dryRun) {
    console.log("  --dry-run: es wurden keine Dateien geschrieben.\n");
    return;
  }

  fs.mkdirSync(path.dirname(REPORT), { recursive: true });
  fs.writeFileSync(REPORT, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`  Bilder:  ${path.relative(ROOT, IMAGE_DIR)}`);
  console.log(`  Bericht: ${path.relative(ROOT, REPORT)}\n`);
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function loadAssortment() {
  if (!fs.existsSync(ALBTRIX)) {
    console.error("\n  Bitte zuerst `node scripts/catalog/import-albtrix.mjs` ausführen.\n");
    process.exit(1);
  }
  const data = JSON.parse(fs.readFileSync(ALBTRIX, "utf8"));
  return new Map(data.products.map((product) => [product.code, product]));
}

const value = (cells, key) => (cells[COLUMNS[key]] ?? "").toString().trim();

/** Reads width/height straight from the PNG header — no image library needed. */
function probePng(buffer) {
  const isPng = buffer.length > 24 && buffer.readUInt32BE(0) === 0x89504e47;
  if (!isPng) return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

/** Skips the write when an identical file is already there (resumable runs). */
function writeImage(target, bytes) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  if (fs.existsSync(target) && fs.readFileSync(target).equals(bytes)) return;
  fs.writeFileSync(target, bytes);
}

function countBy(items, pick) {
  const counts = {};
  for (const item of items) {
    const key = pick(item);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

function printSummary(report) {
  const t = report.totals;
  console.log(`\n  Fotos aus ${report.source}`);
  console.log(`  ${"-".repeat(60)}`);
  console.log(`  Gerettete Fotos        ${t.photos}`);
  console.log(`  im Warenbestand        ${t.inAssortment}`);
  console.log(`  davon für die Website  ${t.forWebsite}`);
  console.log(`\n  Sicherheit laut Vorarbeit:`);
  for (const [label, count] of Object.entries(t.byConfidence)) {
    console.log(`     ${label.padEnd(22)} ${String(count).padStart(4)}`);
  }
  console.log(`  Status:`);
  for (const [label, count] of Object.entries(t.byStatus)) {
    console.log(`     ${label.padEnd(22)} ${String(count).padStart(4)}`);
  }
  if (report.problems.length) {
    console.log(`\n  Zu klären (${report.problems.length}):`);
    for (const problem of report.problems.slice(0, 8)) {
      console.log(`     ${String(problem.code).padEnd(10)} ${problem.problem}`);
    }
    if (report.problems.length > 8) console.log(`     … und ${report.problems.length - 8} weitere`);
  }
  console.log("");
}

main();
