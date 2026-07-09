import { useRef } from "react";
import { ArrowLeft, ArrowRight, Clock, Info } from "lucide-react";
import type { BlogArticle } from "@/types";
import { blogArticles } from "@/data/blog";
import { useI18n } from "@/context/I18nContext";
import { useArticle } from "@/context/ArticleContext";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { accentChip } from "@/lib/accents";
import { scrollToId } from "@/lib/dom";
import { showProductCategory } from "@/lib/productFilter";

/**
 * Accessible article "page" rendered as a dialog (this SPA has no router).
 * Content is generated from the shared blog data — never duplicated. The
 * article title is the single H1; everything else is a paragraph or a semantic
 * button/link, so there are no nested interactive elements.
 */
export function ArticleModal() {
  const { locale, c, tr } = useI18n();
  const { article, closeArticle, openArticle } = useArticle();

  // Keep the last article mounted during the modal's exit animation.
  const lastRef = useRef<BlogArticle | null>(null);
  if (article) lastRef.current = article;
  const a = article ?? lastRef.current;

  const titleId = "article-modal-title";
  const Icon = a?.icon;
  const related = a ? blogArticles.filter((x) => x.id !== a.id).slice(0, 3) : [];

  const backToTips = () => {
    closeArticle();
    scrollToId("blog");
  };
  const goToProducts = () => {
    if (!a) return;
    closeArticle();
    showProductCategory(a.relatedCategory);
  };

  return (
    <Modal
      open={!!article}
      onClose={closeArticle}
      labelledBy={titleId}
      closeLabel={c.nav_close}
      className="sm:max-w-2xl"
    >
      {a && Icon && (
        <article className="p-6 sm:p-8">
          <header className="flex items-center gap-3 pr-10">
            <span
              className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${accentChip[a.accent]}`}
            >
              <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald2">
                {tr(a.category)}
              </p>
              <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-ink-muted">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" /> {a.readMinutes} {c.min_read}
              </p>
            </div>
          </header>

          <h1
            id={titleId}
            className="mt-5 text-2xl font-extrabold leading-tight text-ink-strong sm:text-[1.75rem]"
          >
            {tr(a.title)}
          </h1>

          <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-ink-muted">
            {a.paragraphs[locale].map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>

          {/* Medical information disclaimer — subtle info box, not an error. */}
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-line bg-surface-soft p-4">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-emerald2" aria-hidden="true" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald2">
                {c.article_disclaimer_title}
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">
                {c.article_disclaimer}
              </p>
            </div>
          </div>

          {/* Related product CTA — links to a real, existing product category. */}
          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald2">
              {c.article_related}
            </p>
            <div className="mt-2">
              <Button
                variant="primary"
                onClick={goToProducts}
                rightIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
              >
                {tr(a.relatedProductLabel)}
              </Button>
            </div>
          </div>

          {related.length > 0 && (
            <div className="mt-8 border-t border-line pt-6">
              <p className="text-sm font-bold text-ink-strong">{c.article_more}</p>
              <ul className="mt-3 grid gap-2 sm:grid-cols-3">
                {related.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => openArticle(r.slug)}
                      className="group flex h-full w-full flex-col rounded-xl border border-line bg-white p-3 text-left transition-colors duration-300 hover:border-forest/30 hover:bg-surface-soft"
                    >
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-emerald2">
                        {tr(r.category)}
                      </span>
                      <span className="mt-1 line-clamp-2 text-sm font-semibold text-ink-strong group-hover:text-forest">
                        {tr(r.title)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6">
            <button
              type="button"
              onClick={backToTips}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest transition-colors hover:text-forest-600"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              {c.article_back}
            </button>
          </div>
        </article>
      )}
    </Modal>
  );
}
