#!/usr/bin/env node
/**
 * One step of the catalog work, resumable and safe to repeat.
 * -----------------------------------------------------------
 * What is left after the barcode pass is brand work: 299 brands of the
 * assortment have no known catalogue, together some 3.400 products. That is not
 * one job, it is three hundred small ones — which makes it exactly the shape
 * that can be picked up, dropped and picked up again.
 *
 * Each run takes the next few brands (largest first, because that is where the
 * products are), tries to find an open shop for each, and pulls photos for the
 * ones that have one. Everything it learns is written to `state/`, including
 * the failures: a brand that has no shop, or that refuses automated access, is
 * recorded as such and never tried again. So running this ten times in a row
 * does ten batches of new work rather than the same batch ten times, and an
 * interruption costs nothing.
 *
 * At the end of every run the merged page is rebuilt, so whatever has been
 * found so far is always ready for the team — the work is never left in a
 * half-finished state that needs someone to come back and assemble it.
 *
 * Usage:
 *   node scripts/catalog/next-batch.mjs            # one batch
 *   node scripts/catalog/next-batch.mjs --brands 20
 *   node scripts/catalog/next-batch.mjs --status   # what is left, changes nothing
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..");
const DATA = path.join(HERE, "data", "albtrix-products.json");
const BRANDS = path.join(HERE, "brands.json");
const MERGED = path.join(HERE, "reports", "te-gjitha.json");
const STATE = path.join(HERE, "state", "brand-discovery.json");

const USER_AGENT = "JaraPharmacy-ImageBot/1.0 (+https://jara-pharmacy.com)";
const PAUSE_MS = 500;
const DEFAULT_BRANDS_PER_RUN = 12;

async function main() {
  const args = readArgs(process.argv.slice(2));
  const catalog = JSON.parse(fs.readFileSync(DATA, "utf8"));
  const registry = JSON.parse(fs.readFileSync(BRANDS, "utf8"));
  const state = readState();

  const photographed = new Set(
    fs.existsSync(MERGED) ? JSON.parse(fs.readFileSync(MERGED, "utf8")).photos.map((p) => p.code) : [],
  );

  const known = new Set(registry.burimet.map((entry) => entry.brand.toUpperCase()));
  const pending = rankBrands(catalog, photographed).filter(
    (entry) => !known.has(entry.brand) && !state.tried[entry.brand],
  );

  console.log(`\n  Hapi tjetër i katalogut`);
  console.log(`  ${"-".repeat(62)}`);
  console.log(`  Produkte pa fotografi   ${countMissing(catalog, photographed)}`);
  console.log(`  Marka të provuara       ${Object.keys(state.tried).length}`);
  console.log(`  Marka me dyqan të gjetur ${Object.values(state.tried).filter((v) => v.store).length}`);
  console.log(`  Marka që presin          ${pending.length}\n`);

  if (args.status) return;
  if (!pending.length) {
    console.log("  Të gjitha markat janë provuar. S'ka më punë të këtij lloji.\n");
    return;
  }

  const batch = pending.slice(0, args.brands);
  const discovered = [];

  for (const entry of batch) {
    const found = await findStore(entry.brand);
    state.tried[entry.brand] = {
      checkedAt: new Date().toISOString(),
      products: entry.products,
      store: found?.store ?? null,
      note: found ? "dyqan i hapur" : "pa dyqan të hapur ose me qasje të bllokuar",
    };
    if (found) discovered.push({ brand: entry.brand, store: found.store, platform: "shopify" });
    console.log(
      `     ${entry.brand.slice(0, 24).padEnd(26)} ${String(entry.products).padStart(4)} produkte  ` +
        (found ? `→ ${found.store}` : "→ —"),
    );
  }

  writeState(state);

  if (!discovered.length) {
    console.log("\n  Asnjë dyqan i ri në këtë grup. Gjendja u ruajt; hapi tjetër vazhdon më tej.\n");
    return;
  }

  registry.burimet.push(...discovered);
  fs.writeFileSync(BRANDS, `${JSON.stringify(registry, null, 2)}\n`, "utf8");
  console.log(`\n  ${discovered.length} dyqane të reja u shtuan te brands.json`);

  for (const entry of discovered) {
    console.log(`\n  Fotografi për ${entry.brand}:`);
    run(["find-brand-images.mjs", "--brand", entry.brand, "--replace", "--label", labelFor(entry.brand)]);
  }

  console.log("\n  Rifreskimi i listës së përbashkët:");
  run(["merge-photos.mjs"]);
  run([
    "build-review-page.mjs",
    "--report", "reports/te-gjitha.json",
    "--seria", "Të gjitha produktet me fotografi",
    "--title", "Fotografitë Jara",
  ]);
  console.log("\n  Gati. Faqja u rindërtua me çka u gjet.\n");
}

/* ------------------------------------------------------------------ */

/** Brands still missing photos, biggest first — that is where the work pays. */
function rankBrands(catalog, photographed) {
  const counts = new Map();
  for (const product of catalog.products) {
    if (!product.forWebsite || photographed.has(product.code)) continue;
    const brand = product.brand.trim().toUpperCase();
    if (!brand) continue;
    counts.set(brand, (counts.get(brand) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([brand, products]) => ({ brand, products }))
    .sort((a, b) => b.products - a.products);
}

const countMissing = (catalog, photographed) =>
  catalog.products.filter((product) => product.forWebsite && !photographed.has(product.code)).length;

/**
 * Guesses where a brand's shop might live and checks whether it publishes an
 * open catalogue. Only a handful of guesses per brand: this is a cheap probe,
 * not a hunt, and a brand that answers 403 is refusing automated access — which
 * is recorded as a final answer, never worked around.
 */
async function findStore(brand) {
  const slug = brand.toLowerCase().replace(/[^a-z0-9]+/g, "");
  const dashed = brand.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const hosts = [
    `www.${slug}.com`,
    `${slug}.com`,
    `www.${dashed}.com`,
    `${slug}.de`,
    `${slug}.it`,
  ];

  for (const host of [...new Set(hosts)]) {
    try {
      const response = await fetch(`https://${host}/products.json?limit=2`, {
        headers: { "user-agent": USER_AGENT, accept: "application/json" },
        redirect: "follow",
        signal: AbortSignal.timeout(9000),
      });
      if (response.ok) {
        const payload = await response.json().catch(() => null);
        const products = payload?.products;
        // A real catalogue has titled products with pictures; anything else is
        // a coincidence, a parked domain or a different site's API.
        if (Array.isArray(products) && products.length && products[0]?.title && products[0]?.images) {
          return { store: host };
        }
      }
    } catch {
      // unreachable host, timeout, or not JSON — simply not a usable shop
    }
    await sleep(PAUSE_MS);
  }
  return null;
}

function run(argv) {
  const result = spawnSync(process.execPath, [path.join(HERE, argv[0]), ...argv.slice(1)], {
    stdio: "inherit",
    cwd: ROOT,
  });
  if (result.status !== 0) console.log(`     (${argv[0]} përfundoi me kod ${result.status})`);
}

const labelFor = (brand) => `markat-${brand.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

function readState() {
  if (!fs.existsSync(STATE)) return { tried: {} };
  try {
    return JSON.parse(fs.readFileSync(STATE, "utf8"));
  } catch {
    return { tried: {} };
  }
}

function writeState(state) {
  fs.mkdirSync(path.dirname(STATE), { recursive: true });
  fs.writeFileSync(STATE, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

function readArgs(argv) {
  const index = argv.indexOf("--brands");
  return {
    status: argv.includes("--status"),
    brands: index >= 0 && argv[index + 1] ? Number(argv[index + 1]) : DEFAULT_BRANDS_PER_RUN,
  };
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
