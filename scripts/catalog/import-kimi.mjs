#!/usr/bin/env node
/**
 * Fotografitë e gjetura nga agjenti Kimi.
 * ---------------------------------------
 * Një agjent i jashtëm (Kimi) i kërkoi fotografitë e 9.460 artikujve sipas
 * barkodit, markës dhe emrit, dhe i dorëzoi në dosjen
 * `9460 Produkte/Kimi_Agent_9460 Product Image Retrieval/`: një listë kryesore
 * (`JARA_Produktbilder_Masterliste.xlsx`, fleta `Gefundene_Bilder`), fotografitë
 * te `JARA_Bilder_gefunden/`, dhe të njëjtat fotografi të paketuara në tetë ZIP.
 *
 * Ky skript **nuk i beson listës**. Për secilin rresht kontrollohet:
 *
 *  - a ekziston vërtet ky artikull te lista jonë ALBTRIX,
 *  - a është mall tregtar (barnat nuk shkojnë në faqe),
 *  - a përputhet barkodi që ata shënuan me barkodin tonë,
 *  - a duket fotografia si fotografi produkti (`lib/packshot.mjs`).
 *
 * Dhe merren **vetëm artikujt që s'kanë ende fotografi te ne** — puna e bërë
 * nuk përsëritet. Nga 2.137 rreshtat e tyre, 456 janë barna dhe rreth 1.200 i
 * kemi tashmë; mbetet ajo pjesë që vërtet shton diçka.
 *
 * Përdorimi:
 *   node scripts/catalog/import-kimi.mjs --dry-run
 *   node scripts/catalog/import-kimi.mjs --label kimi-01
 *   node scripts/catalog/import-kimi.mjs --replace   # edhe atje ku kemi foto
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readWorkbook } from "./lib/xlsx.mjs";
import { openZip } from "./lib/zip.mjs";
import { packshotScore, verdictFor } from "./lib/packshot.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..");
const DATA = path.join(HERE, "data", "albtrix-products.json");
const REPORT_DIR = path.join(HERE, "reports");
const IMAGE_DIR = path.join(ROOT, ".image-cache", "kimi");
const SOURCE_DIR = path.join(ROOT, "9460 Produkte", "Kimi_Agent_9460 Product Image Retrieval");
const MASTER = path.join(SOURCE_DIR, "JARA_Produktbilder_Masterliste.xlsx");
const FOUND_DIR = path.join(SOURCE_DIR, "JARA_Bilder_gefunden");

const MIN_IMAGE_BYTES = 3000;

/** Konfidenca e tyre, e përkthyer në tonën — dhe kurrë më lart se ç'e mban. */
const CONFIDENCE = { hoch: "E lartë", mittel: "E mesme", niedrig: "E ulët" };

async function main() {
  const args = readArgs(process.argv.slice(2));
  if (!fs.existsSync(MASTER)) {
    console.error(`\n  Nuk gjendet lista: ${path.relative(ROOT, MASTER)}\n`);
    process.exit(1);
  }

  const catalog = JSON.parse(fs.readFileSync(DATA, "utf8"));
  const byCode = new Map(catalog.products.map((product) => [String(product.code).trim(), product]));
  const already = knownCodes();

  const workbook = readWorkbook(fs.readFileSync(MASTER));
  const rows = [...workbook.rows("Gefundene_Bilder").values()].filter((row) => row.A && row.A !== "Artikelcode");

  const skipped = { unknown: 0, medicine: 0, have: 0, noFile: 0, tooSmall: 0 };
  const wanted = [];
  for (const row of rows) {
    const product = byCode.get(String(row.A).trim());
    if (!product) {
      skipped.unknown += 1;
      continue;
    }
    if (product.kind !== "retail") {
      skipped.medicine += 1;
      continue;
    }
    if (!args.replace && already.has(product.code)) {
      skipped.have += 1;
      continue;
    }
    wanted.push({ product, row });
  }

  console.log(`\n  Fotografitë e agjentit Kimi`);
  console.log(`  ${"-".repeat(62)}`);
  console.log(`  Rreshta në listën e tyre     ${rows.length}`);
  console.log(`  Jashtë listës sonë           ${skipped.unknown}`);
  console.log(`  Barna (nuk shkojnë në faqe)  ${skipped.medicine}`);
  console.log(`  I kemi tashmë                ${skipped.have}`);
  console.log(`  Mbeten për t'u marrë         ${wanted.length}\n`);

  if (args.dryRun) {
    for (const { product, row } of wanted.slice(0, 10)) {
      console.log(`     ${String(product.code).padEnd(8)} ${product.name.slice(0, 44).padEnd(46)} ${row.E ?? ""}`);
    }
    console.log("\n  --dry-run: asgjë nuk u kopjua.\n");
    return;
  }

  fs.mkdirSync(IMAGE_DIR, { recursive: true });
  const zips = new Map();
  const photos = [];
  const failed = [];

  for (const [index, { product, row }] of wanted.entries()) {
    const buffer = readPhoto(row, zips);
    if (!buffer || buffer.length < MIN_IMAGE_BYTES) {
      failed.push({ code: product.code, file: row.F, reason: buffer ? "shumë e vogël" : "skedari nuk u gjet" });
      skipped[buffer ? "tooSmall" : "noFile"] += 1;
      continue;
    }

    const extension = path.extname(row.F ?? "").toLowerCase() || ".png";
    const fileName = `${String(index + 1).padStart(4, "0")}_${safeName(product.code)}${extension}`;
    fs.writeFileSync(path.join(IMAGE_DIR, fileName), buffer);

    const score = await packshotScore(buffer);
    // Barkodi është e vetmja gjë që e provon artikullin. Kur ata shënojnë një
    // barkod tjetër nga yni, fotografia mund të jetë e saktë ose jo — vendimin
    // e merr njeriu, por e nis si mospërputhje.
    const theirBarcode = String(row.C ?? "").trim();
    const ourBarcode = String(product.barcode ?? "").trim();
    const barcodeClash = Boolean(theirBarcode && ourBarcode && theirBarcode !== ourBarcode);
    const barcodeSame = Boolean(theirBarcode && ourBarcode && theirBarcode === ourBarcode);
    const theirs = CONFIDENCE[String(row.E ?? "").trim()] ?? "E ulët";

    photos.push({
      number: photos.length + 1,
      code: product.code,
      name: product.name,
      barcode: product.barcode,
      brand: product.brand,
      // "E lartë" vetëm kur barkodi e provon; përndryshe kurrë më lart se ç'e
      // dha vetë agjenti.
      confidence: barcodeClash ? "E ulët" : barcodeSame && theirs === "E lartë" ? "E lartë" : theirs === "E lartë" ? "E mesme" : theirs,
      status: barcodeClash ? "Mospërputhje" : "Për verifikim",
      note:
        `Gjetur nga agjenti Kimi si "${(row.B ?? "").slice(0, 80)}".` +
        (barcodeSame
          ? ` Barkodi ${ourBarcode} përputhet me tonin.`
          : barcodeClash
            ? ` KUJDES: ata shënuan barkodin ${theirBarcode}, ne kemi ${ourBarcode} — kontrollo cili artikull është.`
            : " Barkodi nuk u krahasua dot.") +
        " Krahasoje me paketimin para publikimit.",
      sourcePage: row.I || row.H || "",
      imageUrl: row.H || "",
      licence: "Kërkim i agjentit Kimi",
      file: path.posix.join(".image-cache/kimi", fileName),
      bytes: buffer.length,
      quality: score?.score ?? 0,
      verdict: verdictFor(score?.score ?? 0),
    });

    if ((index + 1) % 50 === 0) process.stdout.write(`     ${index + 1}/${wanted.length} të marra\r`);
  }

  const report = {
    generatedAt: new Date().toISOString(),
    label: args.label,
    source: "Kërkimi i agjentit Kimi (JARA_Produktbilder_Masterliste.xlsx)",
    totals: {
      rows: rows.length,
      taken: photos.length,
      skipped,
      byConfidence: countBy(photos, (photo) => photo.confidence),
      byVerdict: countBy(photos, (photo) => photo.verdict),
    },
    failed,
    photos,
  };
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  fs.writeFileSync(path.join(REPORT_DIR, `${args.label}.json`), `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log(`     ${photos.length} fotografi të marra${failed.length ? `, ${failed.length} dështuan` : ""}          `);
  console.log("\n  Cilësia e pamjes:");
  for (const [verdict, count] of Object.entries(report.totals.byVerdict)) {
    console.log(`     ${String(count).padStart(4)}  ${verdict}`);
  }
  console.log(`\n  Raporti: ${path.relative(ROOT, path.join(REPORT_DIR, `${args.label}.json`))}\n`);
}

/**
 * Fotografia ndodhet te dosja e shpaketuar; kur mungon aty, merret nga ZIP-i që
 * lista e shënon. Të tetë ZIP-at janë 580 MB, prandaj hapen vetëm kur duhen dhe
 * mbahen hapur për rreshtat e tjerë.
 */
function readPhoto(row, zips) {
  const name = String(row.F ?? "").trim();
  if (!name) return null;

  const direct = path.join(FOUND_DIR, name);
  if (fs.existsSync(direct)) return fs.readFileSync(direct);

  const zipName = String(row.G ?? "").trim();
  if (!zipName) return null;
  if (!zips.has(zipName)) {
    const zipPath = path.join(SOURCE_DIR, zipName);
    zips.set(zipName, fs.existsSync(zipPath) ? openZip(fs.readFileSync(zipPath)) : null);
  }
  const zip = zips.get(zipName);
  if (!zip) return null;
  for (const candidate of [name, `JARA_Bilder_gefunden/${name}`, `bilder/${name}`]) {
    try {
      return zip.read(candidate);
    } catch {
      // provohet emri tjetër
    }
  }
  return null;
}

function knownCodes() {
  const codes = new Set();
  if (!fs.existsSync(REPORT_DIR)) return codes;
  for (const file of fs.readdirSync(REPORT_DIR)) {
    if (!file.endsWith(".json") || file === "te-gjitha.json") continue;
    try {
      const report = JSON.parse(fs.readFileSync(path.join(REPORT_DIR, file), "utf8"));
      for (const photo of report.photos ?? []) if (photo.code) codes.add(photo.code);
    } catch {
      // raport i palexueshëm — thjesht kalohet
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
    replace: argv.includes("--replace"),
    label: flag("label", "kimi-01"),
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

const safeName = (value) => String(value ?? "").replace(/[^A-Za-z0-9._-]+/g, "-");

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
