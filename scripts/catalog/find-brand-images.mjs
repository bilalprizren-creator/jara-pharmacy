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
 * Matching here is by NAME, not barcode, because shop catalogs mostly do not
 * publish barcodes. That is a weaker claim, and the code says so out loud: a
 * photo found this way never gets "E lartë" confidence, no matter how good the
 * score. Measured on BIBS, 81 % of our articles find a plausible counterpart and
 * the colour/size wording lines up ("SIZE 2 6-18M BLACK/WHITE" → "Colour
 * Pacifiers 2 Pack - Black/White") — good enough to put in front of a reviewer,
 * never good enough to publish unseen.
 *
 * The exception is the shop that writes the barcode into its SKU field, or
 * declares it in its structured data — farma-city.al, mybaby.al and
 * bebetei.ro all do. There the pairing is exact, and it is graded like a
 * barcode lookup, because that is what it is.
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
 *   node scripts/catalog/find-brand-images.mjs --refresh   # read the shop again, not the cache
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import { hasValidCheckDigit } from "./lib/gs1.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..");
const DATA = path.join(HERE, "data", "albtrix-products.json");
const BRANDS = path.join(HERE, "brands.json");
const REPORT_DIR = path.join(HERE, "reports");
const STATE_DIR = path.join(HERE, "state");
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
/**
 * A general shop sells every brand, so its titles agree with ours by accident
 * more often than a single brand's catalogue does. Everything it offers below
 * this is left alone; between here and GOOD_SCORE the pairing still reaches the
 * reviewer, but marked as a mismatch rather than as a find.
 */
const GENERAL_FLOOR = Number(process.env.JARA_GENERAL_FLOOR ?? 0.5);

async function main() {
  const args = readArgs(process.argv.slice(2));
  const catalog = JSON.parse(fs.readFileSync(DATA, "utf8"));
  const registry = JSON.parse(fs.readFileSync(BRANDS, "utf8")).burimet;
  const already = knownCodes();

  const label = (entry) => entry.brand ?? entry.supplier ?? entry.store;
  const sources = args.brand
    ? registry.filter((entry) => (label(entry) ?? "").toUpperCase().includes(args.brand.toUpperCase()))
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
        // A source is keyed either by brand or by supplier. Supplier sources
        // are the local distributors, whose shop names the products exactly as
        // the ERP export does.
        // Three kinds of source. A brand catalogue is matched against that
        // brand's products; a supplier's shop against what it delivers; and a
        // general pharmacy wholesaler against everything, because it stocks the
        // same assortment under the same local names whether or not it happens
        // to be one of our own suppliers.
        (source.scope === "all"
          ? true
          : source.supplier
            ? product.supplier.toUpperCase().includes(source.supplier.toUpperCase())
            : product.brand.toUpperCase() === source.brand.toUpperCase()) &&
        // --replace looks for a better picture of a product that already has
        // one. The barcode pass identifies products exactly but the photo
        // attached to a barcode is usually a contributor's snapshot, so for
        // those the manufacturer's packshot is a straight upgrade.
        (args.replace || !already.has(product.code)),
    );
    if (!ours.length) {
      console.log(`  ${label(source).padEnd(16)} — të gjitha kanë tashmë fotografi`);
      continue;
    }

    const theirs = await loadStore(source, ours, args.refresh);
    if (!theirs.length) {
      console.log(`  ${label(source).padEnd(16)} — katalogu nuk u lexua dot (${source.store})`);
      continue;
    }

    // Some shops publish the article's barcode as its SKU. Where they do, the
    // guessing stops: a GTIN names one product worldwide, so that pairing is as
    // certain as the barcode databases and is treated as such.
    const byBarcode = new Map();
    for (const entry of theirs) {
      if (entry.barcode && !byBarcode.has(entry.barcode)) byBarcode.set(entry.barcode, entry);
    }

    let found = 0;
    let viaBarcode = 0;
    for (const product of ours) {
      const exact = product.barcodeUsable ? byBarcode.get(String(product.barcode).trim()) : null;
      const match = exact
        ? { ...exact, score: 1, viaBarcode: true }
        : // A brand's own catalogue may leave its name off its products, so the
          // brand is taken out of both sides before comparing. A general shop
          // is the opposite case: it sells every brand and writes the name into
          // every title, exactly as our own list does — and removing it there
          // was quietly fatal. Our names lead with the brand ("CHICCO VAJ 200
          // ML"), that leading word is the one a general shop must also carry,
          // and it had just been deleted from the shop's side, so every such
          // product was thrown away unmatched.
          bestMatch(product, theirs, source.scope === "all" ? "" : (source.brand ?? product.brand), source.scope === "all");
      if (!match) continue;
      candidates.push({ product, match, source });
      found += 1;
      if (exact) viaBarcode += 1;
    }
    console.log(
      `  ${label(source).padEnd(16)} ${String(found).padStart(4)} nga ${String(ours.length).padEnd(4)} produkte ` +
        `(katalogu: ${theirs.length} artikuj${byBarcode.size ? `, ${byBarcode.size} me barkod` : ""})` +
        (viaBarcode ? ` — ${viaBarcode} me barkod` : ""),
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
    // A local catalogue hands over a file path, not an address.
    const local = !/^https?:/i.test(item.match.image);
    const extension =
      (local ? path.extname(item.match.image) : path.extname(new URL(item.match.image).pathname)).toLowerCase() ||
      ".jpg";
    // Article codes are not safe file names: real ones contain slashes
    // ("SCY960/03"), which silently become directories and abort the run. The
    // same trap was fixed in find-images.mjs and belonged here from the start.
    const fileName = `${String(index + 1).padStart(4, "0")}_${safeName(item.product.code)}${extension}`;
    const target = path.join(IMAGE_DIR, fileName);

    let bytes;
    if (fs.existsSync(target) && fs.statSync(target).size >= MIN_IMAGE_BYTES) {
      bytes = fs.statSync(target).size;
    } else {
      const buffer = local ? readImage(item.match.image) : await fetchBuffer(item.match.image);
      if (!buffer || buffer.length < MIN_IMAGE_BYTES || !looksLikeImage(buffer)) {
        failed.push({ code: item.product.code, url: item.match.image });
        continue;
      }
      try {
        fs.writeFileSync(target, buffer);
      } catch (error) {
        failed.push({ code: item.product.code, url: item.match.image, error: String(error.message) });
        continue;
      }
      bytes = buffer.length;
      if (!local) await sleep(IMAGE_PAUSE_MS);
    }

    // A barcode match needs none of the hedging below: the GTIN identifies the
    // article, so pack size and age cannot disagree.
    const byBarcode = Boolean(item.match.viaBarcode);
    const strong = item.match.score >= GOOD_SCORE;
    const oursSize = packSize(item.product.name);
    const theirsSize = packSize(item.match.title);
    const oursAge = ageRange(item.product.name);
    const theirsAge = ageRange(item.match.title);
    const ageClash = oursAge && theirsAge && oursAge !== theirsAge;
    const sizeClash = (oursSize && theirsSize && oursSize !== theirsSize) || ageClash;
    photos.push({
      number: photos.length + 1,
      code: item.product.code,
      name: item.product.name,
      barcode: item.product.barcode,
      brand: item.product.brand,
      // "E lartë" only where the shop published the barcode; a name match never
      // earns it, however well the words line up.
      confidence: byBarcode ? "E lartë" : sizeClash ? "E ulët" : strong ? "E mesme" : "E ulët",
      status: !byBarcode && (sizeClash || !strong) ? "Mospërputhje" : "Për verifikim",
      note: byBarcode
        ? `Gjetur te ${item.source.brand ? "katalogu i markës" : "katalogu i depos " + item.source.store} si "${item.match.title}". ` +
          `Barkodi ${item.product.barcode} përputhet saktësisht — i njëjti artikull. Krahasoje me paketimin para publikimit.`
        : `Gjetur te ${item.source.brand ? "katalogu i markës" : "katalogu i depos " + item.source.store} si "${item.match.title}". Përputhja është sipas emrit, ` +
        `jo barkodit — krahasoje me paketimin para se ta pranosh.` +

        (ageClash
          ? ` KUJDES: ne kemi ${oursAge}, fotografia është e ${theirsAge} — moshë tjetër, produkt tjetër.`
          : sizeClash
          ? ` KUJDES: ne kemi ${oursSize}, fotografia është e ${theirsSize} — i njëjti produkt, paketim tjetër.`
          : oursSize && !theirsSize
            ? ` Katalogu nuk e shënon madhësinë; jona është ${oursSize} — kontrollo që të përputhet.`
            : ""),
      packSizeOurs: oursSize,
      packSizeFound: theirsSize,
      sourcePage: item.match.page,
      imageUrl: item.match.image,
      licence: `Katalogu i ${item.source.brand ?? item.source.supplier ?? item.source.store}`,
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

/**
 * A shop's catalogue, kept on disk after the first read.
 *
 * Reading plutoni.store means fetching four thousand product pages one at a
 * time — over an hour of someone else's bandwidth. Every later improvement to
 * the matching would ask for that hour again, so what the crawl learns (name,
 * picture, barcode) is written to `state/` and reused. `--refresh` goes back to
 * the shop; that is the only way the cache is ever replaced.
 */
async function loadStore(source, ours, refresh = false) {
  if (source.platform === "local") return loadFromLocalCatalogue(source);

  const cacheFile = path.join(STATE_DIR, `katalog-${safeName(source.store)}.json`);
  let partial = [];
  if (!refresh && fs.existsSync(cacheFile)) {
    try {
      const cached = JSON.parse(fs.readFileSync(cacheFile, "utf8"));
      if (cached.items?.length && cached.complete !== false) {
        console.log(`  ${(source.brand ?? source.supplier ?? source.store).padEnd(16)} — katalogu nga kujtesa (${cached.items.length} artikuj, ${cached.fetchedAt?.slice(0, 10)})`);
        return cached.items;
      }
      // A crawl that was cut short left behind what it had managed. That is not
      // the catalogue and is never used as one — but it is exactly the part that
      // does not need reading a second time.
      if (cached.items?.length) {
        partial = cached.items;
        console.log(`  ${(source.brand ?? source.supplier ?? source.store).padEnd(16)} — vazhdon leximin e ndërprerë (${partial.length} artikuj tashmë)`);
      }
    } catch {
      // an unreadable cache is simply re-fetched
    }
  }

  const items = await readStore(source, ours, cacheFile, partial);
  if (items.length) saveCatalogue(cacheFile, source, items, true);
  return items;
}

/** Writes the catalogue as it stands; `complete` says whether the crawl finished. */
function saveCatalogue(cacheFile, source, items, complete) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  const payload = {
    store: source.store,
    platform: source.platform,
    fetchedAt: new Date().toISOString(),
    complete,
    items,
  };
  fs.writeFileSync(cacheFile, `${JSON.stringify(payload, null, 2)}
`, "utf8");
}

async function readStore(source, ours, cacheFile, partial = []) {
  if (source.platform === "sitemap") return loadFromSitemap(source, ours, cacheFile, partial);
  if (source.platform === "woocommerce") return loadFromWooCommerce(source);
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
        barcode: eanIn(product.variants?.[0]?.sku),
      });
    }
    await sleep(PAGE_PAUSE_MS);
  }
  return items;
}

/**
 * The big brands do not run Shopify — Eucerin, Nivea, Dermedic and Wee Baby
 * answer 404 to `/products.json`, which is why the first sweep found nothing
 * for them and 335 of their products stayed without a picture. They do publish
 * a sitemap, and their product pages carry a proper packshot in `og:image`:
 * Eucerin's came back 1200x1200 and scored a clean 1,00.
 *
 * So the catalogue is read the slow way here — one request per product page —
 * which is why the sitemap is filtered down to product URLs first and the pages
 * are fetched with a pause between them. It costs a few dozen requests per
 * brand, not thousands.
 */
async function loadFromSitemap(source, ours = [], cacheFile = null, partial = []) {
  const roots = [];
  for (const entry of await sitemapEntries(source)) {
    // Appended one by one on purpose: a spread passes every address as a
    // separate argument, and foleja's sitemap holds a quarter of a million of
    // them — enough to overflow the call stack before a single page is read.
    for (const url of await sitemapUrls(entry)) roots.push(url);
  }
  const hint = source.pathHint ? new RegExp(source.pathHint, "i") : /\/(products?|produkt[ye]?|urun|proizvod)\//i;
  // A product page needs a segment below the hint, or every category landing
  // page gets fetched. Depth 5 is "https://host/products/name" — anything
  // shallower is a section, and requiring more than that quietly excluded every
  // shop that keeps products one level down.
  let candidates = [...new Set(roots.filter((url) => hint.test(url) && url.split("/").length >= 5))];

  // A ten-thousand-page catalogue cannot be crawled politely, and does not need
  // to be: these URLs carry the product name in the slug, so the shortlist is
  // built by reading the addresses — free — and only the pages that could
  // actually match are ever fetched.
  if (candidates.length > (source.maxPages ?? 150) && ours.length) {
    const wanted = new Set();
    for (const product of ours) {
      const lead = [...tokens(product.name, "")].find((t) => t.length >= 5 && !GENERIC.has(t) && !/^[0-9]/.test(t));
      if (lead) wanted.add(lead.toLowerCase());
      // In a foreign shop the leading word never appears — our names are
      // Albanian and theirs are not. The brand is the one word both sides
      // write the same way, and these slugs end with it
      // ("...-baby-nova-p382275"), so it is the way in.
      const brand = (product.brand ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
      if (brand.length >= 5) wanted.add(brand);
    }
    candidates = candidates.filter((url) => {
      const slug = url.split("/").pop().replace(/[^a-z0-9]+/gi, " ").toLowerCase();
      return [...wanted].some((word) => slug.includes(word));
    });
  }
  candidates = candidates.slice(0, source.maxPages ?? 150);

  const items = [...partial];
  const done = new Set(partial.map((item) => item.page));
  let read = 0;
  for (const url of candidates) {
    if (done.has(url)) continue;
    const html = await fetchText(url);
    read += 1;
    // An hour-long crawl that saves only at the end has an hour to lose. Every
    // hundred pages the catalogue so far is written out, marked unfinished so
    // that half a shop is never mistaken for the whole one.
    if (cacheFile && read % 100 === 0) {
      saveCatalogue(cacheFile, source, items, false);
      process.stdout.write(`     ${read} faqe të lexuara nga ${candidates.length}\r`);
    }
    if (!html) continue;
    // These pages carry several JSON-LD blocks and the first "name" in the file
    // usually belongs to the FAQ schema, not the product — reading it naively
    // turned every Eucerin title into a support question. So the Product block
    // is looked up properly, with the social tags as the fallback.
    const product = productSchema(html);
    const image =
      product?.image ??
      html.match(/property="og:image"[^>]*content="([^"]+)"/)?.[1] ??
      html.match(/content="([^"]+)"[^>]*property="og:image"/)?.[1] ??
      // Headless Shopify storefronts declare no og:image, but the packshot is
      // still in the markup on the shop's CDN under a /products/ path.
      html.match(/https?:\/\/cdn\.shopify\.com\/s\/files\/[^"'\s\)]+\/products\/[^"'\s\)]+\.(?:jpg|jpeg|png|webp)/i)?.[0];
    const title =
      product?.name ??
      html.match(/property="og:title"[^>]*content="([^"]+)"/)?.[1] ??
      html.match(/<title[^>]*>([^<]+)/)?.[1];
    if (!image || !title) continue;
    items.push({ title: decodeHtml(title.trim()), image, page: url, barcode: product?.barcode ?? null });
    await sleep(PAGE_PAUSE_MS);
  }
  return items;
}

/** The `Product` entry among a page's JSON-LD blocks, if it has one. */
function productSchema(html) {
  const blocks = html.match(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi) ?? [];
  for (const block of blocks) {
    const json = block.replace(/^[\s\S]*?>/, "").replace(/<\/script>$/i, "");
    let parsed;
    try {
      parsed = JSON.parse(json);
    } catch {
      continue;
    }
    // A block may be a single object, an array, or a @graph wrapper.
    const nodes = [parsed, ...(Array.isArray(parsed) ? parsed : []), ...(parsed["@graph"] ?? [])];
    for (const node of nodes) {
      if (!node || typeof node !== "object") continue;
      const types = [node["@type"]].flat();
      if (!types.includes("Product")) continue;
      const image = [node.image].flat().find((value) => typeof value === "string") ?? node.image?.url;
      if (typeof node.name === "string" && image) {
        // Shops that fill in structured data properly also declare the article's
        // barcode there. It is the one field that identifies the product beyond
        // doubt, so it is carried along wherever a page offers it.
        const gtin = [node.gtin13, node.gtin, node.gtin12, node.gtin14, node.gtin8]
          .map((value) => String(value ?? "").trim())
          .find((value) => hasValidCheckDigit(value));
        return { name: node.name, image, barcode: gtin ?? null };
      }
    }
  }
  return null;
}

/**
 * A catalogue that is already in this repository.
 *
 * The website was built from SHEMO's own catalogue — 1.569 products whose
 * photos sit in `public/products/` and have been on the live site for months.
 * The article codes differ from the ERP's, so nothing lined them up
 * automatically, but the names come from the same distributor as the names in
 * the ERP export: this is the source that finally speaks Albanian about
 * "MASHTRUESE" and "SHISHE", which is exactly where the foreign brand
 * catalogues gave up.
 *
 * No network, no politeness pause, and the picture is a file rather than an
 * address — everything downstream treats it the same way.
 */
function loadFromLocalCatalogue(source) {
  const entries = JSON.parse(fs.readFileSync(path.resolve(ROOT, source.file), "utf8"));
  const items = [];
  for (const entry of entries) {
    if (!entry.name || !entry.image) continue;
    // The catalogue stores web paths ("/products/x.png"); on disk they live
    // under public/.
    const file = path.join(ROOT, "public", entry.image.replace(/^\//, ""));
    if (!fs.existsSync(file)) continue;
    // The slug goes into the address even though the catalogue is a file: it is
    // what tells one entry from another, and the merge reads "same page" as
    // "same photo for several articles".
    const home = entry.sourceUrl ?? `https://${source.store}`;
    items.push({ title: entry.name, image: file, page: `${home}#${entry.slug ?? entry.productCode ?? entry.id}` });
  }
  return items;
}

/**
 * WooCommerce shops expose their catalogue through the public Store API, the
 * same way Shopify does — one request per hundred products, names and pictures
 * included.
 *
 * This is how the local distributors are read, and they are worth reading for a
 * reason the brand catalogues never had: the article names in the ERP export
 * come off these companies' own invoices, so their shop lists the products
 * under the very same names. The Albanian-versus-Italian gap that made Chicco
 * unmatchable simply does not exist here.
 */
async function loadFromWooCommerce(source) {
  const items = [];
  // A general wholesaler can hold thousands, so the ceiling is per source.
  for (let page = 1; page <= (source.maxPages ?? MAX_PAGES); page += 1) {
    const url = `https://${source.store}/wp-json/wc/store/products?per_page=100&page=${page}`;
    const payload = await fetchJson(url);
    if (!Array.isArray(payload) || !payload.length) break;
    for (const product of payload) {
      const image = product.images?.[0]?.src;
      if (!image || !product.name) continue;
      items.push({
        title: decodeHtml(product.name),
        image,
        page: product.permalink ?? `https://${source.store}`,
        barcode: eanIn(product.sku),
      });
    }
    await sleep(PAGE_PAUSE_MS);
  }
  return items;
}

/**
 * Where a site actually keeps its sitemap. Guessing `/sitemap.xml` wrote off
 * Chicco, Avent, NUK, MAM and Suavinex — 502 products — because every one of
 * them keeps it somewhere else (`/sitemap_index.xml`, `/media/sitemap_de.xml`,
 * `/sitemap_all.xml`). robots.txt is where a site declares that, so it is asked
 * rather than guessed.
 */
async function sitemapEntries(source) {
  if (source.sitemap) return [new URL(source.sitemap, `https://${source.store}`).href];

  const robots = await fetchText(`https://${source.store}/robots.txt`);
  const declared = robots
    ? [...robots.matchAll(/^\s*Sitemap:\s*(\S+)/gim)].map((match) => match[1].trim())
    : [];
  // Several locales often share one robots.txt; the hint keeps us on ours.
  const wanted = source.sitemapHint
    ? declared.filter((url) => url.includes(source.sitemapHint))
    : declared;
  const chosen = (wanted.length ? wanted : declared).slice(0, 4);
  return chosen.length ? chosen : [`https://${source.store}/sitemap.xml`];
}

/** Reads a sitemap, following one level of sitemap-index nesting. */
async function sitemapUrls(url, depth = 0) {
  const xml = /\.gz($|\?)/i.test(url) ? await fetchGzippedText(url) : await fetchText(url);
  if (!xml) return [];
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1].trim());
  if (depth === 0 && /<sitemapindex/i.test(xml)) {
    const nested = [];
    for (const child of locs.slice(0, 8)) {
      for (const url of await sitemapUrls(child, 1)) nested.push(url);
      await sleep(PAGE_PAUSE_MS);
    }
    return nested;
  }
  return locs;
}

const decodeHtml = (value) =>
  value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    // WordPress shops write their dashes as numeric entities, and the reviewer
    // should read "Chicco – Dezinfektues", not "Chicco &#8211; Dezinfektues".
    .replace(/&#(\d{2,5});/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/\s*\|.*$/, ""); // page titles trail the brand after a pipe

async function fetchText(url) {
  try {
    const response = await fetch(url, {
      headers: { "user-agent": USER_AGENT, accept: "text/html,application/xml" },
      redirect: "follow",
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
}

/**
 * A big shop compresses its sitemaps — foleja.com serves six `.xml.gz` files of
 * fifty thousand addresses each. The file is gzip *content*, not a gzip
 * *transfer*, so nothing unpacks it on the way in and reading it as text yields
 * binary noise.
 */
async function fetchGzippedText(url) {
  try {
    const response = await fetch(url, {
      headers: { "user-agent": USER_AGENT },
      redirect: "follow",
      signal: AbortSignal.timeout(40000),
    });
    if (!response.ok) return null;
    const buffer = Buffer.from(await response.arrayBuffer());
    // Some servers unpack it for us; then it is already plain XML.
    if (buffer[0] !== 0x1f || buffer[1] !== 0x8b) return buffer.toString("utf8");
    return zlib.gunzipSync(buffer).toString("utf8");
  } catch {
    return null;
  }
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
/**
 * Words that describe a form or a claim rather than a product. Two items can
 * share every one of these and still be unrelated — "CALAMINE LOTION 100ML"
 * paired with "BITE FREE INSECT LOTION 100ML" on nothing but LOTION and the
 * size. A general wholesaler's catalogue covers the whole assortment, so
 * without this guard it produces confident-looking nonsense.
 */
const GENERIC = new Set([
  "CREAM", "LOTION", "SPRAY", "SYRUP", "GEL", "OIL", "MILK", "FOAM", "WASH",
  "CLEANSER", "SERUM", "BALM", "POWDER", "DROPS", "BUSTINA", "COMPRESSE",
  "BABY", "KIDS", "PLUS", "FORTE", "DIRECT", "ACTIVE", "NATURA", "NATURAL",
  "COMPLEX", "EXTRA", "ULTRA", "SOFT", "CARE", "DAILY", "FREE", "PURE",
]);

function bestMatch(product, catalogue, brand, requireIdentity = false) {
  const ours = tokens(product.name, brand);
  if (ours.size < 2) return null;
  const lead = [...tokens(product.name, "")].find(
    (token) => token.length >= 4 && !GENERIC.has(token) && !/^[0-9]/.test(token),
  );

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
    // A general catalogue must agree on a word that actually names the product,
    // not only on its form and size.
    // These names lead with what the product IS — "FRESUBIN VANILLE 200ML",
    // "ALGEM MANUKA SED JUNIOR". So the leading word has to appear on both
    // sides. Accepting any shared word instead paired Fresubin with a shower
    // gel because both said VANILLE.
    if (requireIdentity) {
      if (!lead) continue;
      if (![...theirs].some((other) => sameWord(lead, other))) continue;
    }
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }
  const floor = requireIdentity ? GENERAL_FLOOR : MIN_SCORE;
  return bestScore >= floor ? { ...best, score: bestScore } : null;
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
  // Day and night creams are different products in the same line, so these
  // matter more than most: without them a night cream can win the day cream's
  // photo purely on the pack size matching.
  DITES: "DAY", DITE: "DAY", GIORNO: "DAY", JOUR: "DAY",
  NATES: "NIGHT", NATE: "NIGHT", NOTTE: "NIGHT", NUIT: "NIGHT",
  SYVE: "EYE", BUZE: "LIP", DIELLIT: "SUN", DIELLI: "SUN",
  LARES: "WASH", PASTRUES: "CLEANSER", LAGESHTUES: "MOISTURIZING",
  MBROJTES: "PROTECTION", NDJESHME: "SENSITIVE", THATE: "DRY",
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
/**
 * Age range as printed on baby products: "0m+", "6M+", "+12 Muajsh", "3-36M".
 * Without it every Tommee Tippee 260 ml bottle looks alike — one run paired six
 * different bottles, from newborn to twelve months and in singles, twos and
 * threes, with the same photo.
 */
function ageRange(value) {
  const text = String(value ?? "").toUpperCase();
  const span = text.match(/(\d{1,2})\s*[-–]\s*(\d{1,2})\s*M/);
  if (span) return `${span[1]}-${span[2]}M`;
  const from = text.match(/(?:\+\s*)?(\d{1,2})\s*M(?:UAJSH)?\s*\+|\+\s*(\d{1,2})\s*MUAJSH/);
  if (from) return `${from[1] ?? from[2]}M+`;
  return null;
}

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
  if (shorter.length >= 5 && longer.startsWith(shorter)) return true;
  // Albanian spelling wanders: the same dummy is "MASHTRUESE" on our shelf and
  // "Mashtruse" in the shop, and that one letter cost a whole baby catalogue.
  // Long all-letter words may differ by one edit; a word with a digit in it
  // (200ML, 1000MG) must still match exactly, because there the digit carries
  // the meaning.
  if (shorter.length >= 6 && !/\d/.test(a) && !/\d/.test(b)) return withinOneEdit(shorter, longer);
  return false;
}

/** True when one word becomes the other by adding, dropping or changing a single letter. */
function withinOneEdit(shorter, longer) {
  if (longer.length - shorter.length > 1) return false;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < shorter.length && j < longer.length) {
    if (shorter[i] === longer[j]) {
      i += 1;
      j += 1;
      continue;
    }
    edits += 1;
    if (edits > 1) return false;
    // Same length means a swapped letter; different lengths mean the longer
    // word has one letter extra at this point.
    if (shorter.length === longer.length) i += 1;
    j += 1;
  }
  return edits + (longer.length - j) + (shorter.length - i) <= 1;
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

/**
 * A shop's SKU is its own article number — except where the shop simply reuses
 * the barcode (farma-city and mybaby.al both do, one of them writing two of
 * them joined by a dash). Only a run of digits that passes the GS1 check digit
 * is accepted, so an in-house number is never mistaken for a GTIN.
 */
function eanIn(sku) {
  for (const run of String(sku ?? "").match(/\d{8,14}/g) ?? []) {
    if (hasValidCheckDigit(run)) return run;
  }
  return null;
}

/** The local counterpart of fetchBuffer: a missing file is a miss, not a crash. */
function readImage(file) {
  try {
    return fs.readFileSync(file);
  } catch {
    return null;
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
    refresh: argv.includes("--refresh"),
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

const safeName = (value) => String(value ?? "").replace(/[^A-Za-z0-9._-]+/g, "-");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
