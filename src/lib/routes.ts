// Relative, not "@/", on purpose: vite.config.ts imports this module to build
// the static pages and the sitemap, and the config is bundled by esbuild before
// Vite's `resolve.alias` exists — so a "@/" runtime import would not resolve
// there. Type-only imports are erased at build time and can stay aliased.
import { blogArticles } from "../data/blog";
import { publicBranches } from "../data/locations";
import type { BlogArticle, Locale, Location } from "@/types";

/**
 * Every address the site answers to.
 *
 * The app still renders as one scrolling page — these paths exist because the
 * article and branch content used to live behind a `#fragment`, and a fragment
 * is never sent to a server, so no search engine ever saw any of it. The build
 * reads this same table to write a static HTML file per path and to generate
 * the sitemap (see vite/seo-plugin.ts), which is what keeps the app, the
 * sitemap and the crawlable pages from drifting apart.
 */

/** Article path segment per locale — the old hash prefixes, promoted to real paths. */
export const ARTICLE_SEGMENT: Record<Locale, string> = { al: "keshilla", en: "tips" };
const ARTICLE_SEGMENTS: string[] = Object.values(ARTICLE_SEGMENT);

export const BRANCH_SEGMENT = "lokacionet";

/** The hub page aimed straight at the "barnatore në Prizren" search. */
export const BRANCHES_HUB_PATH = "/barnatore-ne-prizren";

export function articlePath(slug: string, locale: Locale = "al"): string {
  return `/${ARTICLE_SEGMENT[locale]}/${slug}`;
}

export function branchPath(id: string): string {
  return `/${BRANCH_SEGMENT}/${id}`;
}

/** Path segments, tolerating leading/trailing slashes. */
function segmentsOf(pathname: string): string[] {
  return pathname.split("/").filter(Boolean);
}

function knownSlug(slug: string): string | null {
  return blogArticles.some((a) => a.slug === slug) ? slug : null;
}

/**
 * Resolve an article slug from a real path (`/keshilla/<slug>`) or from the
 * legacy hash (`#keshilla/<slug>`) that already-shared links still carry.
 */
export function articleSlugFrom(pathname: string, hash: string): string | null {
  const parts = segmentsOf(pathname);
  if (parts.length === 2 && ARTICLE_SEGMENTS.includes(parts[0])) {
    return knownSlug(parts[1]);
  }
  const [prefix, slug] = hash.replace(/^#/, "").split("/");
  if (slug && ARTICLE_SEGMENTS.includes(prefix)) return knownSlug(slug);
  return null;
}

/** Resolve `/lokacionet/<id>` to a branch id we actually have. */
export function branchIdFrom(pathname: string): string | null {
  const parts = segmentsOf(pathname);
  if (parts.length !== 2 || parts[0] !== BRANCH_SEGMENT) return null;
  return publicBranches.some((b) => b.id === parts[1]) ? parts[1] : null;
}

/** True for the branches hub, tolerating a trailing slash. */
export function isHubPath(pathname: string): boolean {
  return `/${segmentsOf(pathname).join("/")}` === BRANCHES_HUB_PATH;
}

export type AppRoute =
  | { kind: "hub" }
  | { kind: "branch"; branch: Location };

/**
 * What the app should open on for a path. The hub and the branch pages render
 * their own content at the top of the page (see sections/RouteHero) — before
 * they did, every one of these addresses showed the homepage, so a search
 * engine that renders JavaScript saw nineteen copies of one page and indexed
 * three of them. Articles are not here: ArticleProvider opens those in their
 * dialog. Anything else is the homepage.
 */
export function resolveRoute(pathname: string): AppRoute | null {
  if (isHubPath(pathname)) return { kind: "hub" };
  const id = branchIdFrom(pathname);
  const branch = id ? publicBranches.find((b) => b.id === id) : undefined;
  return branch ? { kind: "branch", branch } : null;
}

export type SeoRoute =
  | { kind: "home"; path: "/" }
  | { kind: "hub"; path: string }
  | { kind: "article"; path: string; article: BlogArticle }
  | { kind: "branch"; path: string; branch: Location };

/**
 * The full set of addresses the build turns into real HTML files. Albanian
 * only for now: the English article paths would need an addressable locale to
 * pair with, and a half-wired hreflang is worse than none.
 */
export const seoRoutes: SeoRoute[] = [
  { kind: "home", path: "/" },
  { kind: "hub", path: BRANCHES_HUB_PATH },
  ...blogArticles.map((article) => ({
    kind: "article" as const,
    path: articlePath(article.slug),
    article,
  })),
  ...publicBranches.map((branch) => ({
    kind: "branch" as const,
    path: branchPath(branch.id),
    branch,
  })),
];
