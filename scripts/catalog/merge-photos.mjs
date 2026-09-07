#!/usr/bin/env node
/**
 * One list, one photo per product — the best one we have.
 * -------------------------------------------------------
 * Photos arrive from several passes: the research done in ChatGPT, the barcode
 * databases, the manufacturers' own catalogues, and the pass that hunts for a
 * better upload of a barcode hit. They overlap heavily on purpose — the same
 * BIOKAP box turned up as a snapshot on a bed sheet from one source and as a
 * clean packshot from another. Five separate review pages made the team look at
 * the same product more than once and gave no way to see the better version.
 *
 * This merges every report into one entry per article, keeping the best picture
 * and remembering where it came from. "Best" is decided in this order:
 *
 *   1. how much it looks like a packshot (lib/packshot.mjs) — this dominates,
 *      because that is exactly the difference the site's visual standard hangs
 *      on, and it is measured rather than assumed,
 *   2. on a near-tie, the more trustworthy origin: a manufacturer's own
 *      catalogue beats curated research, which beats a community upload.
 *
 * The photos that lose are not deleted; the report keeps them as alternatives,
 * so a reviewer rejecting the chosen one leaves something to fall back on.
 *
 * Usage:
 *   node scripts/catalog/merge-photos.mjs
 *   node scripts/catalog/merge-photos.mjs --label te-gjitha
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { packshotScore } from "./lib/packshot.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..");
const REPORT_DIR = path.join(HERE, "reports");

/** Higher wins when two photos score within TIE of each other. */
const ORIGIN_RANK = {
  marka: 3, // the manufacturer's own catalogue
  kerkim: 2, // researched product by product
  bazë: 1, // community upload against a barcode
};
const TIE = 0.08;

function main() {
  const args = readArgs(process.argv.slice(2));
  const reports = fs
    .readdirSync(REPORT_DIR)
    .filter((file) => file.endsWith(".json") && file !== `${args.label}.json`)
    .sort();

  /** code → candidates */
  const byCode = new Map();
  const sources = [];

  for (const file of reports) {
    const report = JSON.parse(fs.readFileSync(path.join(REPORT_DIR, file), "utf8"));
    const entries = photosFrom(report);
    if (!entries.length) continue;
    sources.push({ file, photos: entries.length });

    for (const photo of entries) {
      if (!photo.code || !photo.file) continue;
      if (!byCode.has(photo.code)) byCode.set(photo.code, []);
      byCode.get(photo.code).push({ ...photo, origin: originOf(file), report: report.label ?? file });
    }
  }

  console.log(`\n  Bashkimi i fotografive nga ${sources.length} raporte`);
  console.log(`  ${"-".repeat(62)}`);
  for (const source of sources) console.log(`     ${String(source.photos).padStart(4)}  ${source.file}`);
  console.log(`\n  Produkte të ndryshme: ${byCode.size}`);

  return byCode;
}

/* Reports come in two shapes: the normal one carries `photos`, the
   better-photo pass carries `improved` with a different field naming. */
function photosFrom(report) {
  if (Array.isArray(report.photos)) return report.photos;
  if (Array.isArray(report.improved)) {
    return report.improved.map((item) => ({
      code: item.code,
      name: item.name,
      file: item.file,
      sourcePage: item.url,
      confidence: "E mesme",
      status: "Për verifikim",
      note: "Fotografi më e mirë e të njëjtit produkt nga e njëjta bazë.",
    }));
  }
  return [];
}

function originOf(file) {
  if (file.startsWith("markat")) return "marka";
  if (file.startsWith("gpt")) return "kerkim";
  return "bazë";
}

const byCode = main();

/* ------------------------------------------------------------------ */
/*  Choosing, which needs the scores and therefore async               */
/* ------------------------------------------------------------------ */

const args = readArgs(process.argv.slice(2));
const chosen = [];
const missing = [];
let index = 0;

for (const [code, candidates] of byCode) {
  index += 1;
  const scored = [];
  for (const candidate of candidates) {
    const file = path.join(ROOT, candidate.file);
    if (!fs.existsSync(file)) continue;
    const score = await packshotScore(file);
    if (!score) continue;
    scored.push({ ...candidate, score: score.score, verdict: score.verdict });
  }
  if (!scored.length) {
    missing.push(code);
    continue;
  }

  scored.sort((a, b) => {
    if (Math.abs(a.score - b.score) > TIE) return b.score - a.score;
    return (ORIGIN_RANK[b.origin] ?? 0) - (ORIGIN_RANK[a.origin] ?? 0);
  });

  const best = scored[0];
  chosen.push({
    number: chosen.length + 1,
    code,
    name: best.name,
    barcode: best.barcode ?? "",
    brand: best.brand ?? "",
    confidence: best.confidence,
    status: best.status,
    note: best.note,
    sourcePage: best.sourcePage,
    file: best.file,
    origin: best.origin,
    fromReport: best.report,
    quality: best.score,
    verdict: best.verdict,
    alternatives: scored.slice(1).map((other) => ({
      file: other.file,
      origin: other.origin,
      quality: other.score,
    })),
  });

  if (index % 200 === 0) process.stdout.write(`     ${index}/${byCode.size} të vlerësuara\r`);
}

chosen.sort((a, b) => a.name.localeCompare(b.name, "sq"));
chosen.forEach((item, position) => {
  item.number = position + 1;
});

const withAlternatives = chosen.filter((item) => item.alternatives.length).length;
const report = {
  generatedAt: new Date().toISOString(),
  label: args.label,
  source: "Bashkim i të gjitha kërkimeve — një fotografi për produkt",
  totals: {
    products: chosen.length,
    withAlternatives,
    withoutUsableFile: missing.length,
    byVerdict: countBy(chosen, (item) => item.verdict),
    byOrigin: countBy(chosen, (item) => item.origin),
  },
  photos: chosen,
};

fs.writeFileSync(path.join(REPORT_DIR, `${args.label}.json`), `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(`     ${chosen.length} produkte me fotografinë më të mirë                `);
console.log(`     ${withAlternatives} kanë edhe një alternativë në rezervë`);
console.log("\n  Cilësia e pamjes:");
for (const [verdict, count] of Object.entries(report.totals.byVerdict)) {
  console.log(`     ${String(count).padStart(4)}  ${verdict}  (${Math.round((count / chosen.length) * 100)} %)`);
}
console.log("  Burimi i zgjedhur:");
for (const [origin, count] of Object.entries(report.totals.byOrigin)) {
  console.log(`     ${String(count).padStart(4)}  ${origin}`);
}
console.log(`\n  Raporti: ${path.relative(ROOT, path.join(REPORT_DIR, `${args.label}.json`))}\n`);

function readArgs(argv) {
  const index = argv.indexOf("--label");
  return { label: index >= 0 && argv[index + 1] ? argv[index + 1] : "te-gjitha" };
}

function countBy(items, pick) {
  const counts = {};
  for (const item of items) {
    const key = pick(item);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}
