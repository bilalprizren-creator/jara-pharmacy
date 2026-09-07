#!/usr/bin/env node
/**
 * Rescues product photos that are trapped inside review workbooks.
 * -----------------------------------------------------------------
 * The photo research done in ChatGPT arrives as .xlsx files with the pictures
 * embedded: one row per product, the photo anchored in column B, and the source
 * page and a confidence rating alongside. As long as they live inside a 6-12 MB
 * spreadsheet they cannot be reviewed on a phone, cannot be resized, and cannot
 * reach the website. This lifts them out into ordinary image files plus one
 * report per batch.
 *
 * The workbooks are not all shaped the same, so nothing about the layout is
 * assumed: the sheet is the one carrying a "Shifra" header, the header row is
 * found by looking for it, and columns are mapped by their heading rather than
 * by letter. Two further traps are handled in `lib/xlsx.mjs` — article codes
 * stored as formulas without cached values, and element names that may or may
 * not carry a namespace prefix depending on which tool wrote the file.
 *
 * Every rescued photo is checked back against the ALBTRIX data set, because a
 * photo is only useful if the article exists in the assortment and is destined
 * for the website (retail, not medicine).
 *
 * Safety: images are written into `.image-cache/` (kept out of git), never into
 * `public/`. Nothing reaches the website from here — that is the job of the
 * review page and the catalog build that follow.
 *
 * Usage:
 *   node scripts/catalog/rescue-gpt-photos.mjs --source "9460 Produkte/X.xlsx"
 *   node scripts/catalog/rescue-gpt-photos.mjs --match Seria_00 --label gpt-004-006
 *   node scripts/catalog/rescue-gpt-photos.mjs --dry-run
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { readWorkbook } from "./lib/xlsx.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..");
const SOURCE_DIR = path.join(ROOT, "9460 Produkte");
const ALBTRIX = path.join(HERE, "data", "albtrix-products.json");

/** Column headings as they appear in the workbooks, mapped to our field names. */
const HEADINGS = {
  "nr.": "number",
  shifra: "code",
  emërtimi: "name",
  barkodi: "barcode",
  brendi: "brand",
  besueshmëria: "confidence",
  statusi: "status",
  vendimi: "decision",
  "faqja burimore": "sourcePage",
  "url e fotografisë": "imageUrl",
  shënim: "note",
  "skedari i fotografisë": "fileName",
};

function main() {
  const args = readArgs(process.argv.slice(2));
  const sources = resolveSources(args);
  if (!sources.length) {
    console.error("\n  Asnjë skedar burimor nuk u gjet.\n");
    process.exit(1);
  }

  const assortment = loadAssortment();
  const imageDir = path.join(ROOT, ".image-cache", args.label);
  const photos = [];
  const problems = [];

  console.log(`\n  Fotografitë nga ${sources.length} skedarë`);
  console.log(`  ${"-".repeat(62)}`);

  for (const source of sources) {
    const workbook = readWorkbook(fs.readFileSync(source));
    const sheet = findDataSheet(workbook);
    if (sheet === null) {
      problems.push({ code: null, problem: `${path.basename(source)}: nuk u gjet fleta me të dhëna` });
      continue;
    }

    const rows = workbook.rows(sheet);
    const anchors = new Map(workbook.imageAnchors(sheet).map((anchor) => [anchor.row, anchor.part]));
    const layout = findHeader(rows);
    if (!layout) {
      problems.push({ code: null, problem: `${path.basename(source)}: nuk u gjet rreshti i kolonave` });
      continue;
    }

    let taken = 0;
    for (const [rowNumber, cells] of [...rows.entries()].sort((a, b) => a[0] - b[0])) {
      if (rowNumber <= layout.row) continue;
      const record = mapRow(cells, layout.columns);
      if (!record.code) continue;

      const part = anchors.get(rowNumber);
      if (!part) {
        problems.push({ code: record.code, problem: "Nuk ka fotografi në këtë rresht" });
        continue;
      }

      const bytes = workbook.part(part);
      const article = assortment.get(record.code);
      const fileName = safe(record.fileName || `${record.number || taken + 1}_${record.code}.png`);

      photos.push({
        number: photos.length + 1,
        code: record.code,
        name: record.name,
        barcode: record.barcode,
        brand: record.brand,
        confidence: record.confidence,
        status: record.status,
        decision: record.decision || "Pa kontrolluar",
        sourcePage: record.sourcePage,
        note: record.note,
        batch: path.basename(source),
        file: path.posix.join(".image-cache", args.label, fileName),
        bytes: bytes.length,
        ...probePng(bytes),
        sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
        inAssortment: Boolean(article),
        forWebsite: article?.forWebsite ?? false,
        barcodeMatches: article ? article.barcode === record.barcode : null,
      });

      if (!args.dryRun) writeImage(path.join(imageDir, fileName), bytes);
      taken += 1;
    }
    console.log(`  ${path.basename(source).slice(0, 46).padEnd(48)} ${String(taken).padStart(4)} fotografi`);
  }

  for (const photo of photos) {
    if (!photo.inAssortment) {
      problems.push({ code: photo.code, problem: "Artikulli nuk gjendet në listën ALBTRIX" });
    } else if (!photo.forWebsite) {
      problems.push({ code: photo.code, problem: "Nuk është mall tregtar — nuk shkon në faqe" });
    } else if (photo.barcodeMatches === false) {
      problems.push({ code: photo.code, problem: "Barkodi ndryshon nga ai i listës ALBTRIX" });
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    label: args.label,
    sources: sources.map((source) => path.basename(source)),
    totals: {
      photos: photos.length,
      inAssortment: photos.filter((photo) => photo.inAssortment).length,
      forWebsite: photos.filter((photo) => photo.forWebsite).length,
      byConfidence: countBy(photos, (photo) => photo.confidence || "—"),
      byStatus: countBy(photos, (photo) => photo.status || "—"),
      problems: problems.length,
    },
    problems,
    photos,
  };

  printSummary(report);
  if (args.dryRun) {
    console.log("  --dry-run: asgjë nuk u shkrua.\n");
    return;
  }

  const reportPath = path.join(HERE, "reports", `${args.label}.json`);
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`  Fotografitë: ${path.relative(ROOT, imageDir)}`);
  console.log(`  Raporti:     ${path.relative(ROOT, reportPath)}\n`);
}

/* ------------------------------------------------------------------ */
/*  Finding the data inside a workbook                                 */
/* ------------------------------------------------------------------ */

/** The data sheet is the one with a "Shifra" heading; layouts differ per file. */
function findDataSheet(workbook) {
  for (let index = 0; index < workbook.sheets.length; index += 1) {
    const rows = workbook.rows(index);
    if (findHeader(rows)) return index;
  }
  return null;
}

/** Locates the header row and maps column letters onto our field names. */
function findHeader(rows) {
  for (const [rowNumber, cells] of [...rows.entries()].sort((a, b) => a[0] - b[0])) {
    const columns = {};
    let hits = 0;
    for (const [letter, value] of Object.entries(cells)) {
      const field = HEADINGS[String(value).trim().toLowerCase()];
      if (field) {
        columns[field] = letter;
        hits += 1;
      }
    }
    // "Shifra" alone could be a stray label; three known headings is a table.
    if (columns.code && hits >= 3) return { row: rowNumber, columns };
  }
  return null;
}

const mapRow = (cells, columns) =>
  Object.fromEntries(
    Object.entries(columns).map(([field, letter]) => [field, (cells[letter] ?? "").toString().trim()]),
  );

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function resolveSources(args) {
  if (args.source) return [path.resolve(ROOT, args.source)].filter((file) => fs.existsSync(file));
  if (!fs.existsSync(SOURCE_DIR)) return [];
  return fs
    .readdirSync(SOURCE_DIR)
    .filter((file) => file.endsWith(".xlsx") && file.includes(args.match))
    .sort()
    .map((file) => path.join(SOURCE_DIR, file));
}

function loadAssortment() {
  if (!fs.existsSync(ALBTRIX)) {
    console.error("\n  Ekzekuto së pari: node scripts/catalog/import-albtrix.mjs\n");
    process.exit(1);
  }
  const data = JSON.parse(fs.readFileSync(ALBTRIX, "utf8"));
  return new Map(data.products.map((product) => [product.code, product]));
}

/** Reads width/height straight from the PNG header — no image library needed. */
function probePng(buffer) {
  const isPng = buffer.length > 24 && buffer.readUInt32BE(0) === 0x89504e47;
  if (!isPng) return { width: null, height: null };
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

/** Skips the write when an identical file is already there (resumable runs). */
function writeImage(target, bytes) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  if (fs.existsSync(target) && fs.readFileSync(target).equals(bytes)) return;
  fs.writeFileSync(target, bytes);
}

function readArgs(argv) {
  const flag = (name, fallback) => {
    const index = argv.indexOf(`--${name}`);
    return index >= 0 && argv[index + 1] ? argv[index + 1] : fallback;
  };
  return {
    dryRun: argv.includes("--dry-run"),
    source: flag("source", ""),
    match: flag("match", "Fotografite_e_Produkteve_Seria"),
    label: flag("label", "gpt-seria"),
  };
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
  const totals = report.totals;
  console.log(`  ${"-".repeat(62)}`);
  console.log(`  Gjithsej fotografi     ${totals.photos}`);
  console.log(`  Në listën e produkteve ${totals.inAssortment}`);
  console.log(`  Për faqen              ${totals.forWebsite}`);
  console.log(`  Besueshmëria:`);
  for (const [label, count] of Object.entries(totals.byConfidence)) {
    console.log(`     ${label.padEnd(22)} ${String(count).padStart(4)}`);
  }
  console.log(`  Statusi:`);
  for (const [label, count] of Object.entries(totals.byStatus)) {
    console.log(`     ${label.padEnd(22)} ${String(count).padStart(4)}`);
  }
  if (report.problems.length) {
    console.log(`\n  Për t'u sqaruar (${report.problems.length}):`);
    for (const problem of report.problems.slice(0, 8)) {
      console.log(`     ${String(problem.code ?? "—").padEnd(10)} ${problem.problem}`);
    }
    if (report.problems.length > 8) console.log(`     … edhe ${report.problems.length - 8} të tjera`);
  }
  console.log("");
}

const safe = (value) => String(value ?? "").replace(/[^A-Za-z0-9._-]+/g, "-");

main();
