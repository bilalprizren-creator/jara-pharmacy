import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { blogArticles } from "@/data/blog";
import { useI18n } from "@/context/I18nContext";
import { articlePath, articleSlugFrom } from "@/lib/routes";
import type { BlogArticle } from "@/types";

/**
 * Drives the article detail view (an accessible modal — this SPA has no router)
 * and keeps a shareable, deep-linkable URL in sync:
 *   Albanian  →  /keshilla/<slug>
 *   English   →  /tips/<slug>
 *
 * These used to be `#fragments`, which a browser never sends to a server: six
 * finished bilingual articles were invisible to every search engine. They are
 * real paths now, and the build writes a static HTML file for each one, so the
 * text is in the response before any JavaScript runs. Already-shared hash links
 * still resolve — see `articleSlugFrom`.
 *
 * Open/close use pushState so the back button walks in and out of an article.
 */

const BRAND = "Jara Pharmacy";

interface ArticleValue {
  article: BlogArticle | null;
  openArticle: (slug: string) => void;
  closeArticle: () => void;
}

const ArticleContext = createContext<ArticleValue | null>(null);

/** Current article slug from the path, falling back to the legacy hash. */
function slugFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  return articleSlugFrom(window.location.pathname, window.location.hash);
}

/**
 * A path with the current query string kept.
 *
 * Rewriting the address on open and close used to drop `window.location.search`:
 * someone arriving on `?utm_source=instagram`, opening a tip and closing it
 * again lost the campaign it came from for the rest of the visit. The canonical
 * link below deliberately does *not* get this — that one has to stay clean.
 */
function withQuery(path: string): string {
  return `${path}${window.location.search}`;
}

function setMeta(selector: string, attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export function ArticleProvider({ children }: { children: ReactNode }) {
  const { locale, tr } = useI18n();
  const [slug, setSlug] = useState<string | null>(() => slugFromUrl());

  const article = useMemo(() => blogArticles.find((a) => a.slug === slug) ?? null, [slug]);

  // External navigation: deep link, manual URL edit, and — now that open/close
  // push real entries — the browser's own back and forward buttons.
  useEffect(() => {
    const sync = () => setSlug(slugFromUrl());
    window.addEventListener("popstate", sync);
    window.addEventListener("hashchange", sync);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("hashchange", sync);
    };
  }, []);

  const openArticle = useCallback(
    (next: string) => {
      setSlug(next);
      window.history.pushState(null, "", withQuery(articlePath(next, locale)));
    },
    [locale],
  );

  const closeArticle = useCallback(() => {
    setSlug(null);
    window.history.pushState(null, "", withQuery("/"));
  }, []);

  // Reflect the open article in the document head, and put every value back on
  // close. The og:* pair used to be set but never restored, so once an article
  // had been opened the share preview stayed stuck on it for the rest of the
  // visit — including back on the homepage.
  useEffect(() => {
    if (!article) return;

    const head = document.head;
    const readMeta = (selector: string) =>
      head.querySelector<HTMLMetaElement>(selector)?.content ?? "";
    const canonical = head.querySelector<HTMLLinkElement>('link[rel="canonical"]');

    const previous = {
      title: document.title,
      desc: readMeta('meta[name="description"]'),
      ogTitle: readMeta('meta[property="og:title"]'),
      ogDesc: readMeta('meta[property="og:description"]'),
      canonical: canonical?.href ?? "",
    };

    const path = articlePath(article.slug, locale);
    const title = `${tr(article.seoTitle)} · ${BRAND}`;
    const desc = tr(article.seoDescription);

    document.title = title;
    setMeta('meta[name="description"]', "name", "description", desc);
    setMeta('meta[property="og:title"]', "property", "og:title", title);
    setMeta('meta[property="og:description"]', "property", "og:description", desc);
    if (canonical) canonical.href = new URL(path, window.location.origin).href;

    // Keep the path's language segment aligned while open — a correction of the
    // current entry, not a navigation, so replaceState rather than pushState.
    if (window.location.pathname !== path) {
      window.history.replaceState(null, "", withQuery(path));
    }

    return () => {
      document.title = previous.title;
      setMeta('meta[name="description"]', "name", "description", previous.desc);
      setMeta('meta[property="og:title"]', "property", "og:title", previous.ogTitle);
      setMeta('meta[property="og:description"]', "property", "og:description", previous.ogDesc);
      if (canonical) canonical.href = previous.canonical;
    };
  }, [article, locale, tr]);

  const value = useMemo<ArticleValue>(
    () => ({ article, openArticle, closeArticle }),
    [article, openArticle, closeArticle],
  );

  return <ArticleContext.Provider value={value}>{children}</ArticleContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useArticle(): ArticleValue {
  const ctx = useContext(ArticleContext);
  if (!ctx) throw new Error("useArticle must be used within <ArticleProvider>");
  return ctx;
}
