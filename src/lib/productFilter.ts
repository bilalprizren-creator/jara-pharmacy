import type { CategorySlug } from "@/types";
import { scrollToId } from "@/lib/dom";

/**
 * Lightweight, decoupled bridge from anywhere (e.g. an article CTA) to the
 * Products section: request a category filter, then scroll the existing
 * `#products` section into view. No fake routes, no new provider — the Products
 * section subscribes to this event and applies the filter.
 */
export const PRODUCT_FILTER_EVENT = "jara:filter-category";

export function showProductCategory(slug: CategorySlug): void {
  window.dispatchEvent(new CustomEvent<CategorySlug>(PRODUCT_FILTER_EVENT, { detail: slug }));
  scrollToId("products");
}
