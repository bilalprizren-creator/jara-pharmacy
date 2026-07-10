import type { CategorySlug, Product, ProductFilter } from "@/types";
import { scrollToId } from "@/lib/dom";
import { OFFER_IDS } from "@/data/homepage";

/**
 * Lightweight, decoupled bridge from anywhere (homepage rows, the category
 * overview, article CTAs) to the Products section: request a filter, then
 * scroll `#products` into view. No fake routes, no new provider — the Products
 * section subscribes to this event and applies the filter.
 */
export const PRODUCT_FILTER_EVENT = "jara:filter-products";

export function showProductFilter(filter: ProductFilter): void {
  window.dispatchEvent(new CustomEvent<ProductFilter>(PRODUCT_FILTER_EVENT, { detail: filter }));
  scrollToId("products");
}

/** Convenience wrapper used by article CTAs and the category overview cards. */
export function showProductCategory(slug: CategorySlug): void {
  showProductFilter({ kind: "category", slug });
}

/** Whether a product belongs in the given filter (query matching is separate). */
export function matchesFilter(p: Product, f: ProductFilter): boolean {
  switch (f.kind) {
    case "home":
    case "all":
      return true;
    case "category":
      return p.category === f.slug;
    case "group":
      return f.slugs.includes(p.category);
    case "featured":
      return p.featured;
    case "offers":
      return OFFER_IDS.includes(p.id);
  }
}

/** Stable string identity for a filter (React keys, effect deps). */
export function filterKey(f: ProductFilter): string {
  switch (f.kind) {
    case "category":
      return `category:${f.slug}`;
    case "group":
      return `group:${f.id}`;
    default:
      return f.kind;
  }
}
