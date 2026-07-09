/**
 * Hand-maintained homepage curation, applied on top of the machine-generated
 * SHEMO import store (`src/data/imported/shemo-products.json`). Kept separate
 * from that file so it survives re-running `scripts/import-shemo.mjs`, which
 * always resets `featured` to false for every scraped record.
 */

/** Imported products to feature on the homepage despite no curated counterpart. */
export const featuredOverrideCodes = new Set<string>([
  "4170", // Ivy Bear Boost Energy 60 Gummies — replaces "Swiss Energy Kids Gummies"
  "0157", // Nutrifactor Magnesium 500mg 60 tablets — replaces "Magnesium Supplement"
]);
