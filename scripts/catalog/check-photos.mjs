#!/usr/bin/env node
/**
 * A qëndron lista? — kontrolli i vetë punës.
 * ------------------------------------------
 * Fotografitë vijnë nga dhjetëra burime dhe bashkohen automatikisht. Sa më
 * shumë burime, aq më lehtë hyn një gabim i heshtur: i njëjti produkt dy herë,
 * një skedar që s'ekziston më, një barkod që nuk përputhet me atë që premton
 * shënimi, ose një produkt që s'duhej të ishte fare aty.
 *
 * Ky skript nuk ndryshon asgjë. Vetëm pyet, për listën e bashkuar:
 *
 *   1. A del secili produkt saktësisht një herë?
 *   2. A ekziston vërtet çdo skedar fotografie, dhe a është fotografi?
 *   3. A ekziston secila shifër te lista ALBTRIX, dhe a është mall tregtar?
 *   4. Kur shënimi thotë "barkodi përputhet", a përputhet vërtet?
 *   5. Sa produkte i solli secili burim, dhe sa prej tyre i kishim tashmë?
 *
 * Usage:
 *   node scripts/catalog/check-photos.mjs
 *   node scripts/catalog/check-photos.mjs --report reports/te-gjitha.json
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..");
const DATA = path.join(HERE, "data", "albtrix-products.json");
const REPORT_DIR = path.join(HERE, "reports");

const MIN_IMAGE_BYTES = 3000;

function main() {
  const args = readArgs(process.argv.slice(2));
  const merged = JSON.parse(fs.readFileSync(path.resolve(ROOT, args.report), "utf8"));
  const catalog = JSON.parse(fs.readFileSync(DATA, "utf8"));
  const byCode = new Map(catalog.products.map((product) => [String(product.code).trim(), product]));

  const problems = { duplicates: [], missingFile: [], notImage: [], unknown: [], medicine: [], barcode: [] };
  const seen = new Map();

  for (const photo of merged.photos) {
    const code = String(photo.code).trim();
    if (seen.has(code)) problems.duplicates.push(code);
    else seen.set(code, photo);

    const file = path.resolve(ROOT, photo.file ?? "");
    if (!photo.file || !fs.existsSync(file)) {
      problems.missingFile.push(code);
    } else {
      const image = readHead(file);
      if (!image || image.size < MIN_IMAGE_BYTES || !looksLikeImage(image.head)) problems.notImage.push(code);
    }

    const product = byCode.get(code);
    if (!product) {
      problems.unknown.push(code);
      continue;
    }
    if (product.kind !== "retail") problems.medicine.push(code);

    // Çdo shënim që premton një barkod duhet ta mbajë premtimin.
    const promised = /Barkodi (\d{8,14}) përputhet/.exec(photo.note ?? "")?.[1];
    if (promised && String(product.barcode ?? "").trim() !== promised) problems.barcode.push(code);
  }

  const retail = catalog.products.filter((product) => product.kind === "retail");
  console.log(`\n  Kontrolli i listës — ${path.basename(args.report)}`);
  console.log(`  ${"-".repeat(62)}`);
  console.log(`  Produkte në listë          ${merged.photos.length}`);
  console.log(`  Mall tregtar gjithsej      ${retail.length}  (mbulimi ${Math.round((merged.photos.length / retail.length) * 100)} %)`);
  console.log("");
  report("Produkte të dyfishuara", problems.duplicates);
  report("Skedarë që mungojnë", problems.missingFile);
  report("Skedarë që s'janë fotografi", problems.notImage);
  report("Shifra jashtë listës ALBTRIX", problems.unknown);
  report("Barna që s'duhej të ishin këtu", problems.medicine);
  report("Barkodi i premtuar nuk përputhet", problems.barcode);

  // Kush e solli fotografinë që fitoi, dhe sa kandidatë kishte gjithsej.
  const wins = {};
  for (const photo of merged.photos) {
    const key = photo.fromReport ?? "?";
    wins[key] = (wins[key] ?? 0) + 1;
  }
  console.log("\n  Fotografia fituese, sipas burimit:");
  for (const [source, count] of Object.entries(wins).sort((a, b) => b[1] - a[1]).slice(0, 12)) {
    console.log(`     ${String(count).padStart(4)}  ${source}`);
  }

  const alternatives = merged.photos.filter((photo) => (photo.alternatives ?? []).length).length;
  console.log(`\n  Me alternativë në rezervë   ${alternatives}`);

  const bad = Object.values(problems).some((list) => list.length);
  console.log(bad ? "\n  ⚠ Ka gjetje më lart.\n" : "\n  Asnjë problem.\n");
  process.exitCode = bad ? 1 : 0;
}

function report(title, codes) {
  if (!codes.length) {
    console.log(`  ✓ ${title.padEnd(36)} 0`);
    return;
  }
  console.log(`  ⚠ ${title.padEnd(36)} ${codes.length}`);
  console.log(`      ${[...new Set(codes)].slice(0, 12).join(", ")}${codes.length > 12 ? " …" : ""}`);
}

/**
 * Madhësia dhe kokëza e skedarit — të dyja veç e veç, sepse janë dy pyetje të
 * ndryshme: sa e madhe është, dhe a fillon si fotografi. (Leximi i katër mijë
 * skedarëve të plotë do të ishte i kotë; 64 bajtat e parë e thonë llojin.)
 */
function readHead(file) {
  try {
    const size = fs.statSync(file).size;
    const head = Buffer.alloc(Math.min(size, 64));
    const handle = fs.openSync(file, "r");
    fs.readSync(handle, head, 0, head.length, 0);
    fs.closeSync(handle);
    return { size, head };
  } catch {
    return null;
  }
}

function looksLikeImage(buffer) {
  const png = buffer.readUInt32BE(0) === 0x89504e47;
  const jpeg = buffer[0] === 0xff && buffer[1] === 0xd8;
  const webp = buffer.subarray(0, 4).toString("ascii") === "RIFF";
  const gif = buffer.subarray(0, 3).toString("ascii") === "GIF";
  // Një dyqan modern e shërben fotografinë si AVIF edhe kur emri mbaron me
  // .png. Kjo është fotografi njësoj — sharp e lexon pa problem.
  const avif = buffer.subarray(4, 8).toString("ascii") === "ftyp";
  return png || jpeg || webp || gif || avif;
}

function readArgs(argv) {
  const index = argv.indexOf("--report");
  return { report: index >= 0 && argv[index + 1] ? argv[index + 1] : path.join(REPORT_DIR, "te-gjitha.json") };
}

main();
