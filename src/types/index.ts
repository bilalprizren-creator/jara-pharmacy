import type { LucideIcon } from "lucide-react";

/** Supported UI languages. Albanian is the brand-first default. */
export type Locale = "al" | "en";

/** A single string available in both languages. */
export interface Bilingual {
  al: string;
  en: string;
}

/** A list of strings available in both languages (e.g. benefit bullets). */
export interface BilingualList {
  al: string[];
  en: string[];
}

/* ------------------------------------------------------------------ */
/*  Visual system for in-app generated (placeholder) product artwork.  */
/* ------------------------------------------------------------------ */

export type ProductForm =
  | "bottle"
  | "spray"
  | "jar"
  | "tube"
  | "sachet"
  | "box"
  | "dropper"
  | "gummies";

export type VisualPalette =
  | "rose"
  | "green"
  | "teal"
  | "amber"
  | "violet"
  | "cream"
  | "orange";

export interface ProductVisual {
  form: ProductForm;
  palette: VisualPalette;
  /** Short label rendered on the mock pack (e.g. "SERUM"). */
  label?: string;
}

/* ------------------------------------------------------------------ */
/*  Content models                                                     */
/* ------------------------------------------------------------------ */

export type CategorySlug =
  | "skincare"
  | "haircare"
  | "vitamins"
  | "beauty"
  | "mother-baby"
  | "natural"
  | "oral-care"
  | "health-care"
  | "foot-care"
  | "collagen"
  | "insect-care";

export type CategoryAccent = "green" | "rose" | "lime" | "cream" | "teal";

export interface Category {
  slug: CategorySlug;
  icon: LucideIcon;
  title: Bilingual;
  description: Bilingual;
  accent: CategoryAccent;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand?: string;
  category: CategorySlug;
  categoryLabel: Bilingual;
  badge?: Bilingual;
  /**
   * Optional: curated products always provide it; imported catalog products
   * (e.g. SHEMO) may not, in which case the UI simply omits the line.
   */
  shortDescription?: Bilingual;
  /** Optional benefit bullets; hidden entirely when absent/empty. */
  benefits?: BilingualList;
  usage?: Bilingual;
  visual: ProductVisual;
  /**
   * Real product photo, served from `public` (e.g. "/products/<slug>.jpg").
   * Drop a file named after the product slug into `public/products/` to
   * replace the interim crop — no code change needed. When absent, the
   * generated `visual` scene is rendered instead.
   */
  image?: string;
  featured: boolean;
  tags: string[];
  /** Optional pre-composed inquiry message; falls back to a generated one. */
  contactMessage?: Bilingual;

  /* ---------------------------------------------------------------- */
  /*  Import metadata — populated for catalog-imported products only.  */
  /*  All optional so hand-authored products remain valid unchanged.   */
  /* ---------------------------------------------------------------- */
  /** Stock-keeping unit (SHEMO reuses the product code here). */
  sku?: string;
  /** Original catalog product code (SHEMO `nrserik`, e.g. "5112"). */
  productCode?: string;
  barcode?: string;
  /** Pack size parsed from the source name, e.g. "100ml". */
  packageSize?: string;
  manufacturer?: string;
  countryOfOrigin?: string;
  ingredients?: Bilingual;
  warnings?: Bilingual;
  /** Extra product photos, served from `public` like `image`. */
  additionalImages?: string[];
  /** Original category/section label from the source catalog (e.g. "Autan"). */
  sourceCategory?: string;
  /** Public source the record was imported from. */
  sourceUrl?: string;
  /** Origin site identifier, e.g. "shemo-katalog.com". */
  importSource?: string;
  /** ISO timestamp when this record was first imported (stable across re-runs). */
  importedAt?: string;
  /** ISO timestamp of the first import (alias of importedAt for record-keeping). */
  createdAt?: string;
  /** ISO timestamp of the last import run that changed this record's content. */
  updatedAt?: string;
  /** Whether the product is shown; defaults to true when omitted. */
  isActive?: boolean;
}

export interface Location {
  id: string;
  /** Official branch number (JARA PHARMACY <n>), shown as a badge. */
  branch?: number;
  name: string;
  city: string;
  address: string;
  /** Alternative spelling / historical name (e.g. William Walker). */
  alias?: string;
  mapsQuery: string;
  phone?: string;
  featured?: boolean;
  note?: Bilingual;
}

export interface Testimonial {
  id: string;
  quote: Bilingual;
  name?: string;
  role?: Bilingual;
  rating: number;
}

export interface BlogArticle {
  id: string;
  /** URL-safe slug used for hash deep-linking (#keshilla/<slug> · #tips/<slug>). */
  slug: string;
  icon: LucideIcon;
  category: Bilingual;
  title: Bilingual;
  excerpt: Bilingual;
  readMinutes: number;
  accent: CategoryAccent;
  /** Full article body, one string per paragraph, per language. */
  paragraphs: BilingualList;
  /** Existing product category this article's CTA filters to (never a fake URL). */
  relatedCategory: CategorySlug;
  /** Localized label for the related-product CTA button. */
  relatedProductLabel: Bilingual;
  /** Localized document title + meta description for the detail view. */
  seoTitle: Bilingual;
  seoDescription: Bilingual;
}

export interface SocialPost {
  id: string;
  handle: string;
  caption: Bilingual;
  category: Bilingual;
  visual: ProductVisual;
  /**
   * Real Instagram-post image, served from `public` (e.g. "/social/s-x.jpg").
   * When present it replaces the generated `visual` scene in the feed card.
   */
  image?: string;
  likes: number;
}

export interface NavLink {
  id: string;
  label: Bilingual;
  href: string;
}

export interface IconFeature {
  id: string;
  icon: LucideIcon;
  title: Bilingual;
  text: Bilingual;
}

export interface Stat {
  id: string;
  icon: LucideIcon;
  value: number;
  suffix?: string;
  /** Non-numeric display value (e.g. "24/7"). Overrides the counter. */
  display?: string;
  label: Bilingual;
}
