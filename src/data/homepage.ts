import type { CategorySlug, Product, ProductFilter } from "@/types";
import type { CopyKey } from "@/data/copy";
import { products } from "@/data/products";

/**
 * Homepage product presentation config.
 *
 * The homepage shows only a handful of curated rows (not the whole catalog).
 * Every section resolves its products from the shared `products` array — no
 * product objects are duplicated here, only referenced. Edit this file to
 * change what the homepage highlights; the full catalog is untouched.
 */

/**
 * Curated "Oferta" promo selection, referenced by product id. These are the
 * products shown (and filtered to) under Offers. Edit this list to change the
 * promo row — ids that no longer exist are simply skipped.
 */
export const OFFER_IDS: string[] = [
  "shemo-7367", // Collagen Beauty (effervescent)
  "shemo-0477", // Nature Collagen Powder 240g
  "shemo-7603", // Gummy monsters Vitamin C
  "shemo-2070C", // Vaseline Advanced Repair Body Lotion
  "shemo-3093", // Labello SPF 15 Hydro Care
  "shemo-7765", // Anti-spot cream with Vitamin C SPF15
  "shemo-7656", // Oral-B Brush Pro Extra Soft
  "shemo-5208", // Black Cumin Seed Oil (Balen)
  "shemo-5172", // Extra-virgin olive oil
];

type SectionSelect =
  | { by: "ids"; ids: string[] }
  | { by: "featured" }
  | { by: "categories"; slugs: CategorySlug[] };

export interface HomeSection {
  /** Stable id (React key + analytics). */
  id: string;
  /** Localized title / subtitle copy keys. */
  titleKey: CopyKey;
  subtitleKey: CopyKey;
  /** How this row picks its products from the shared catalog. */
  select: SectionSelect;
  /** What "Shiko të gjitha / View all" applies in the Products section. */
  filter: ProductFilter;
  /** Max cards mounted on the homepage for this row. */
  limit: number;
}

/**
 * The (max five) rows shown on the homepage, in display order. Combined rows
 * pull from several catalog categories; Offers/Most-popular use a curated id
 * list / the `featured` flag that already exists on products.
 */
export const homeSections: HomeSection[] = [
  {
    id: "offers",
    titleKey: "home_offers",
    subtitleKey: "home_offers_sub",
    select: { by: "ids", ids: OFFER_IDS },
    filter: { kind: "offers" },
    limit: 10,
  },
  {
    id: "popular",
    titleKey: "home_popular",
    subtitleKey: "home_popular_sub",
    select: { by: "featured" },
    filter: { kind: "featured" },
    limit: 10,
  },
  {
    id: "skin-hair",
    titleKey: "home_skin_hair",
    subtitleKey: "home_skin_hair_sub",
    select: { by: "categories", slugs: ["skincare", "haircare"] },
    filter: { kind: "group", id: "skin-hair", slugs: ["skincare", "haircare"] },
    limit: 10,
  },
  {
    id: "vitamins-health",
    titleKey: "home_vitamins_health",
    subtitleKey: "home_vitamins_health_sub",
    select: { by: "categories", slugs: ["vitamins", "natural", "health-care"] },
    filter: {
      kind: "group",
      id: "vitamins-health",
      slugs: ["vitamins", "natural", "health-care"],
    },
    limit: 10,
  },
  {
    id: "mother-baby",
    titleKey: "home_mother_baby",
    subtitleKey: "home_mother_baby_sub",
    select: { by: "categories", slugs: ["mother-baby"] },
    filter: { kind: "category", slug: "mother-baby" },
    limit: 10,
  },
];

/**
 * Resolve each homepage row's products from the shared catalog, deduped in
 * display order so the same product never appears in two homepage rows.
 */
export function resolveHomeSections(
  all: Product[] = products,
): { section: HomeSection; items: Product[] }[] {
  const byId = new Map(all.map((p) => [p.id, p]));
  const used = new Set<string>();

  return homeSections.map((section) => {
    let pool: Product[];
    if (section.select.by === "ids") {
      pool = section.select.ids
        .map((id) => byId.get(id))
        .filter((p): p is Product => Boolean(p));
    } else if (section.select.by === "featured") {
      pool = all.filter((p) => p.featured);
    } else {
      const slugs = section.select.slugs;
      pool = all.filter((p) => slugs.includes(p.category));
    }

    const items: Product[] = [];
    for (const p of pool) {
      if (items.length >= section.limit) break;
      if (used.has(p.id)) continue;
      items.push(p);
      used.add(p.id);
    }
    return { section, items };
  });
}

/**
 * Compact category overview shown above the homepage rows. A curated subset of
 * the full 13 catalog categories; "All categories" is appended by the UI.
 */
export const overviewCategories: CategorySlug[] = [
  "skincare",
  "haircare",
  "vitamins",
  "mother-baby",
  "oral-care",
  "natural",
  "health-care",
];
