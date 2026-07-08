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
  | "collagen";

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
  shortDescription: Bilingual;
  benefits: BilingualList;
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
}

export interface Location {
  id: string;
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
  slug: string;
  icon: LucideIcon;
  category: Bilingual;
  title: Bilingual;
  excerpt: Bilingual;
  readMinutes: number;
  accent: CategoryAccent;
}

export interface SocialPost {
  id: string;
  handle: string;
  caption: Bilingual;
  category: Bilingual;
  visual: ProductVisual;
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
