#!/usr/bin/env node
/**
 * Second source of photos: the brands' own catalogs.
 * --------------------------------------------------
 * Barcode lookup (`find-images.mjs`) is exact but thin — whole categories of
 * this assortment are simply not in the open databases: Chicco, Avent, Swanson
 * and Wee Baby resolve at 0 %. Those brands do publish complete, photographed
 * catalogs on their own shops, which is also the cleanest imagery we can get
 * without asking anyone: the manufacturer's own pictures of its own products.
 *
 * Matching here is by NAME, not barcode, because shop catalogs do not publish
 * barcodes. That is a weaker claim, and the code says so out loud: a photo
 * found this way never gets "E lartë" confidence, no matter how good the score.
 * Measured on BIBS, 81 % of our articles find a plausible counterpart and the
 * colour/size wording lines up ("SIZE 2 6-18M BLACK/WHITE" → "Colour Pacifiers
 * 2 Pack - Black/White") — good enough to put in front of a reviewer, never
 * good enough to publish unseen.
 *
 * Stores are listed in `brands.json`. "shopify" means the shop exposes the
 * public `/products.json` endpoint, which is one request per 250 products
 * instead of crawling a whole site.
 *
 * Usage:
 *   node scripts/catalog/find-brand-images.mjs --dry-run
 *   node scripts/catalog/find-brand-images.mjs --brand BIBS
 *   node scripts/catalog/find-brand-images.mjs --label markat-01
 *   node scripts/catalog/find-brand-images.mjs --replace   # better photo for ones we have
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..");
const DATA = path.join(HERE, "data", "albtrix-products.json");
const BRANDS = path.join(HERE, "brands.json");
const REPORT_DIR = path.join(HERE, "reports");
const IMAGE_DIR = path.join(ROOT, ".image-cache", "brands");

const USER_AGENT = "JaraPharmacy-ImageBot/1.0 (+https://jara-pharmacy.com)";
const PAGE_PAUSE_MS = 700;
const IMAGE_PAUSE_MS = 250;
const MIN_IMAGE_BYTES = 3000;
const MAX_PAGES = 12; // 3.000 products per store is plenty

/** Below this the pairing is noise rather than a candidate. */
const MIN_SCORE = 0.4;
/** At or above this the wording lines up well enough to lead the batch. */
const GOOD_SCORE = 0.6;

async function main() {
  const args = readArgs(process.argv.slice(2));
  const catalog = JSON.parse(fs.readFileSync(DATA, "utf8"));
  const registry = JSON.parse(fs.readFileSync(BRANDS, "utf8")).burimet;
  const already = knownCodes();

  const sources = args.brand
    ? registry.filter((entry) => entry.brand.toUpperCase() === args.brand.toUpperCase())
    : registry;
  if (!sources.length) {
    console.error(`\n  Marka "${args.brand}" nuk është në brands.json\n`);
    process.exit(1);
  }

  console.log(`\n  Fotografi nga katalogët e markave — ${sources.length} marka`);
  console.log(`  ${"-".repeat(62)}`);

  const candidates = [];
  for (const source of sources) {
    const ours = catalog.products.filter(
      (product) =>
        product.forWebsite &&
        product.brand.toUpperCase() === source.brand.toUpperCase() &&
        // --replace looks for a better picture of a product that already has
        // one. The barcode pass identifies products exactly but the photo
        // attached to a barcode is usually a contributor's snapshot, so for
        // those the manufacturer's packshot is a straight upgrade.
        (args.replace || !already.has(product.code)),
    );
    if (!ours.length) {
      console.log(`  ${source.brand.padEnd(16)} — të gjitha kanë tashmë fotografi`);
      continue;
    }

    const theirs = await loadStore(source);
    if (!theirs.length) {
      console.log(`  ${source.brand.padEnd(16)} — katalogu nuk u lexua dot (${source.store})`);
      continue;
    }

    let found = 0;
    for (const product of ours) {
      const match = bestMatch(product, theirs, source.brand);
      if (!match) continue;
      candidates.push({ product, match, source });
      found += 1;
    }
    console.log(
      `  ${source.brand.padEnd(16)} ${String(found).padStart(4)} nga ${String(ours.length).padEnd(4)} produkte ` +
        `(katalogu: ${theirs.length} artikuj)`,
    );
  }

  console.log(`\n  Gjithsej ${candidates.length} kandidatë`);
  if (args.dryRun) {
    console.log("\n  --dry-run: asgjë nuk u shkarkua. Shembuj:\n");
    for (const item of candidates.slice(0, 10)) {
      console.log(`     ${item.match.score.toFixed(2)}  ${item.product.name.slice(0, 42).padEnd(44)} → ${item.match.title.slice(0, 44)}`);
    }
    console.log("");
    return;
  }

  fs.mkdirSync(IMAGE_DIR, { recursive: true });
  const photos = [];
  const failed = [];

  for (const [index, item] of candidates.entries()) {
    const extension = path.extname(new URL(item.match.image).pathname).toLowerCase() || ".jpg";
    const fileName = `${String(index + 1).padStart(4, "0")}_${item.product.code}${extension}`;
    const target = path.join(IMAGE_DIR, fileName);

    let bytes;
    if (fs.existsSync(target) && fs.statSync(target).size >= MIN_IMAGE_BYTES) {
      bytes = fs.statSync(target).size;
    } else {
      const buffer = await fetchBuffer(item.match.image);
      if (!buffer || buffer.length < MIN_IMAGE_BYTES || !looksLikeImage(buffer)) {
        failed.push({ code: item.product.code, url: item.match.image });
        continue;
      }
      fs.writeFileSync(target, buffer);
      bytes = buffer.length;
      await sleep(IMAGE_PAUSE_MS);
    }

    const strong = item.match.score >= GOOD_SCORE;
    const oursSize = packSize(item.product.name);
    const theirsSize = packSize(item.match.title);
    const sizeClash = oursSize && theirsSize && oursSize !== theirsSize;
    photos.push({
      number: photos.length + 1,
      code: item.product.code,
      name: item.product.name,
      barcode: item.product.barcode,
      brand: item.product.brand,
      // Never "E lartë": this is a name match, not a barcode match.
      confidence: sizeClash ? "E ulët" : strong ? "E mesme" : "E ulët",
      status: sizeClash || !strong ? "Mospërputhje" : "Për verifikim",
      note:
        `Gjetur te katalogu i markës si "${item.match.title}". Përputhja është sipas emrit, ` +
        `jo barkodit — krahasoje me paketimin para se ta pranosh.` +
        (sizeClash
          ? ` KUJDES: ne kemi ${oursSize}, fotografia është e ${theirsSize} — i njëjti produkt, paketim tjetër.`
          : oursSize && !theirsSize
            ? ` Katalogu nuk e shënon madhësinë; jona është ${oursSize} — kontrollo që të përputhet.`
            : ""),
      packSizeOurs: oursSize,
      packSizeFound: theirsSize,
      sourcePage: item.match.page,
      imageUrl: item.match.image,
      licence: `Katalogu zyrtar i ${item.source.brand}`,
      matchScore: Number(item.match.score.toFixed(2)),
      file: path.posix.join(".image-cache/brands", fileName),
      bytes,
    });
    if ((index + 1) % 20 === 0) process.stdout.write(`     ${index + 1} të shkarkuara\r`);
  }

  const report = {
    generatedAt: new Date().toISOString(),
    label: args.label,
    source: "Katalogët zyrtarë të markave (përputhje sipas emrit)",
    totals: {
      candidates: candidates.length,
      downloaded: photos.length,
      failed: failed.length,
      byConfidence: countBy(photos, (photo) => photo.confidence),
      byBrand: countBy(photos, (photo) => photo.brand),
    },
    failed,
    photos,
  };
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const reportPath = path.join(REPORT_DIR, `${args.label}.json`);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log(`     ${photos.length} fotografi të shkarkuara${failed.length ? `, ${failed.length} dështuan` : ""}`);
  console.log(`\n  Raporti: ${path.relative(ROOT, reportPath)}\n`);
}

/* ------------------------------------------------------------------ */
/*  Stores                                                             */
/* ------------------------------------------------------------------ */

async function loadStore(source) {
  if (source.platform !== "shopify") return [];
  const items = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const url = `https://${source.store}/products.json?limit=250&page=${page}`;
    const payload = await fetchJson(url);
    const products = payload?.products ?? [];
    if (!products.length) break;
    for (const product of products) {
      const image = product.images?.[0]?.src;
      if (!image) continue;
      items.push({
        title: product.title,
        image,
        page: `https://${source.store}/products/${product.handle}`,
      });
    }
    await sleep(PAGE_PAUSE_MS);
  }
  return items;
}

/* ------------------------------------------------------------------ */
/*  Matching                                                           */
/* ------------------------------------------------------------------ */

/**
 * Scores our article name against a shop title by shared distinctive words.
 * The brand name itself is stripped from both sides first — every item in a
 * brand's shop shares it, so it carries no information and would only inflate
 * every score equally.
 */
function bestMatch(product, catalogue, brand) {
  const ours = tokens(product.name, brand);
  if (ours.size < 2) return null;

  let best = null;
  let bestScore = 0;
  for (const entry of catalogue) {
    const theirs = tokens(entry.title, brand);
    let shared = 0;
    for (const token of ours) {
      for (const other of theirs) {
        if (sameWord(token, other)) {
          shared += 1;
          break;
        }
      }
    }
    const score = shared / ours.size;
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }
  return bestScore >= MIN_SCORE ? { ...best, score: bestScore } : null;
}

const STOPWORDS = new Set([
  "ML", "MG", "TAB", "TABS", "CAPS", "CAP", "GR", "KOM", "SIR", "PACK", "SET",
  "DHE", "ME", "PER", "THE", "AND", "FOR", "WITH", "NEW", "DE", "DI", "DU",
]);

/**
 * The article names in the ERP export are whatever the supplier printed on the
 * invoice, so one assortment mixes French, Italian, Albanian and English —
 * while a brand's own shop is usually English only. "MUSTELA SHAMPOOING DOUX
 * 500ML" and Mustela's own "Gentle Shampoo" are the same bottle and share not
 * one word, so a photo that was sitting right there went unfound.
 *
 * These are the words that actually recur in this catalogue, mapped to the
 * English form the shops use. It is deliberately small: guessing translations
 * wholesale would invent matches, and every match still has to convince a
 * reviewer.
 */
const SYNONYMS = new Map(Object.entries({
  SHAMPOOING: "SHAMPOO", SHAMPON: "SHAMPOO", SHAMPO: "SHAMPOO", SHAMPOING: "SHAMPOO",
  DOUX: "GENTLE", DOLCE: "GENTLE", SUAVE: "GENTLE", BUTE: "GENTLE", MITE: "GENTLE",
  LAVANT: "WASH", LAVANTE: "WASH", LAVANDO: "WASH", NETTOYANT: "CLEANSER",
  CREME: "CREAM", CREMA: "CREAM", KREM: "CREAM", KREME: "CREAM",
  HUILE: "OIL", OLIO: "OIL", VAJ: "OIL",
  LAIT: "MILK", LATTE: "MILK", QUMESHT: "MILK",
  BAIN: "BATH", BAGNO: "BATH", BANJO: "BATH",
  EAU: "WATER", ACQUA: "WATER", UJE: "WATER", UJI: "WATER",
  BEBE: "BABY", BEBI: "BABY", ENFANT: "KIDS", BAMBINO: "KIDS", FEMIJE: "KIDS",
  CORPS: "BODY", CORPO: "BODY", TRUPI: "BODY", TRUP: "BODY",
  VISAGE: "FACE", VISO: "FACE", FYTYRE: "FACE", FYTYRA: "FACE",
  CHEVEUX: "HAIR", CAPELLI: "HAIR", FLOKE: "HAIR", FLOK: "HAIR",
  MAINS: "HAND", MANI: "HAND", DUAR: "HAND",
  DENTIFRICE: "TOOTHPASTE", DENTI: "TEETH", DHEMBE: "TEETH",
  SOLAIRE: "SUN", SOLARE: "SUN", DIELL: "SUN",
  HYDRATANT: "MOISTURIZING", IDRATANTE: "MOISTURIZING",
  MOUSSE: "FOAM", SCHIUMA: "FOAM", SHKUME: "FOAM",
  SPRAJ: "SPRAY", POMATA: "OINTMENT", POMADE: "OINTMENT",
}));

function tokens(value, brand) {
  const brandWords = new Set(
    String(brand ?? "")
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, " ")
      .split(" ")
      .filter(Boolean),
  );
  return new Set(
    String(value ?? "")
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, " ")
      .split(" ")
      .filter((token) => token.length > 2 && !STOPWORDS.has(token) && !brandWords.has(token))
      .map((token) => SYNONYMS.get(token) ?? token),
  );
}

/**
 * Pack size as printed in the name: "500ML", "40 G", "A60".
 * A shop lists one product page per formula and often names no size at all, so
 * the absence of a size means nothing — but when both sides state one and they
 * disagree, the reviewer is looking at the right product in the wrong bottle,
 * which is worth saying out loud rather than hiding behind a score.
 */
function packSize(value) {
  const match = String(value ?? "")
    .toUpperCase()
    .match(/(\d+(?:[.,]\d+)?)\s*(ML|CL|L|MG|G|GR|KG|CAPS|CAP|TAB|TABS|PCS)\b/);
  if (!match) return null;
  const amount = Number(match[1].replace(",", "."));
  const unit = { GR: "G", CAP: "CAPS", TAB: "TABS", CL: "ML" }[match[2]] ?? match[2];
  return `${unit === "ML" && match[2] === "CL" ? amount * 10 : amount}${unit}`;
}

/**
 * Two words count as the same when one is a prefix of the other from five
 * characters on. That is what connects "MOISTURIZING" to "MOISTURIZER" and
 * "NOURISHING" to "NOURISH" without a stemmer, and five is long enough that
 * unrelated words do not start colliding.
 */
function sameWord(a, b) {
  if (a === b) return true;
  const shorter = a.length <= b.length ? a : b;
  const longer = shorter === a ? b : a;
  return shorter.length >= 5 && longer.startsWith(shorter);
}

/* ------------------------------------------------------------------ */
/*  Network + helpers                                                  */
/* ------------------------------------------------------------------ */

async function fetchJson(url, attempt = 1) {
  try {
    const response = await fetch(url, {
      headers: { "user-agent": USER_AGENT, accept: "application/json" },
      redirect: "follow",
      signal: AbortSignal.timeout(30000),
    });
    if (response.status === 429 || response.status >= 500) throw new Error(`HTTP ${response.status}`);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    if (attempt >= 3) return null;
    await sleep(attempt * 2000);
    return fetchJson(url, attempt + 1);
  }
}

async function fetchBuffer(url, attempt = 1) {
  try {
    const response = await fetch(url, {
      headers: { "user-agent": USER_AGENT },
      signal: AbortSignal.timeout(40000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return Buffer.from(await response.arrayBuffer());
  } catch {
    if (attempt >= 2) return null;
    await sleep(1500);
    return fetchBuffer(url, attempt + 1);
  }
}

function looksLikeImage(buffer) {
  const png = buffer.readUInt32BE(0) === 0x89504e47;
  const jpeg = buffer[0] === 0xff && buffer[1] === 0xd8;
  const webp = buffer.subarray(0, 4).toString("ascii") === "RIFF";
  return png || jpeg || webp;
}

function knownCodes() {
  const codes = new Set();
  if (!fs.existsSync(REPORT_DIR)) return codes;
  for (const file of fs.readdirSync(REPORT_DIR)) {
    if (!file.endsWith(".json")) continue;
    try {
      const report = JSON.parse(fs.readFileSync(path.join(REPORT_DIR, file), "utf8"));
      for (const photo of report.photos ?? []) if (photo.code) codes.add(photo.code);
    } catch {
      // ignore an unreadable report
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
    brand: flag("brand", ""),
    label: flag("label", `markat-${new Date().toISOString().slice(0, 10)}`),
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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
