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
import type { BlogArticle, Locale } from "@/types";

/**
 * Drives the article detail view (an accessible modal — this SPA has no router)
 * and keeps a shareable, deep-linkable URL hash in sync:
 *   Albanian  →  #keshilla/<slug>
 *   English   →  #tips/<slug>
 *
 * The hash is the source of truth for *external* navigation (deep links, manual
 * edits, in-page nav anchors), while open/close update it via replaceState so
 * we never spam the history stack. Document title + meta description are updated
 * while an article is open (best-effort SEO for a client-rendered app).
 */

const HASH_PREFIX: Record<Locale, string> = { al: "keshilla", en: "tips" };
const KNOWN_PREFIXES = Object.values(HASH_PREFIX);
const BRAND = "Jara Pharmacy";

interface ArticleValue {
  article: BlogArticle | null;
  openArticle: (slug: string) => void;
  closeArticle: () => void;
}

const ArticleContext = createContext<ArticleValue | null>(null);

/** Read a `#keshilla/<slug>` / `#tips/<slug>` fragment into a known article slug. */
function slugFromHash(): string | null {
  if (typeof window === "undefined") return null;
  const raw = window.location.hash.replace(/^#/, "");
  const [prefix, slug] = raw.split("/");
  if (!slug || !KNOWN_PREFIXES.includes(prefix)) return null;
  return blogArticles.some((a) => a.slug === slug) ? slug : null;
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
  const [slug, setSlug] = useState<string | null>(() => slugFromHash());

  const article = useMemo(() => blogArticles.find((a) => a.slug === slug) ?? null, [slug]);

  // External navigation (deep link, manual URL edit, clicking a nav anchor).
  useEffect(() => {
    const sync = () => setSlug(slugFromHash());
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const openArticle = useCallback(
    (next: string) => {
      setSlug(next);
      window.history.replaceState(null, "", `#${HASH_PREFIX[locale]}/${next}`);
    },
    [locale],
  );

  const closeArticle = useCallback(() => {
    setSlug(null);
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
  }, []);

  // Best-effort SEO: reflect the open article in the document head; restore on close.
  useEffect(() => {
    if (!article) return;
    const prevTitle = document.title;
    const prevDesc =
      document.head.querySelector<HTMLMetaElement>('meta[name="description"]')?.content ?? "";

    const title = `${tr(article.seoTitle)} · ${BRAND}`;
    const desc = tr(article.seoDescription);
    document.title = title;
    setMeta('meta[name="description"]', "name", "description", desc);
    setMeta('meta[property="og:title"]', "property", "og:title", title);
    setMeta('meta[property="og:description"]', "property", "og:description", desc);

    // Keep the hash prefix aligned with the active language while open.
    window.history.replaceState(null, "", `#${HASH_PREFIX[locale]}/${article.slug}`);

    return () => {
      document.title = prevTitle;
      setMeta('meta[name="description"]', "name", "description", prevDesc);
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
