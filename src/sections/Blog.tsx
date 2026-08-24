import type { MouseEvent } from "react";
import { ArrowRight, Clock } from "lucide-react";
import { useI18n } from "@/context/I18nContext";
import { useArticle } from "@/context/ArticleContext";
import { blogArticles } from "@/data/blog";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CardSlider } from "@/components/ui/CardSlider";
import { accentChip } from "@/lib/accents";
import { articlePath } from "@/lib/routes";

export function Blog() {
  const { c, locale, tr } = useI18n();
  const { openArticle } = useArticle();

  /**
   * Real links, opened in place. These were buttons, which meant six finished
   * articles had no href for a crawler to follow. The href is the article's own
   * address now; a plain click still opens the modal instead of reloading, and
   * ctrl/cmd-click keeps working like any other link.
   */
  const openInPlace = (event: MouseEvent<HTMLAnchorElement>, slug: string) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    openArticle(slug);
  };

  return (
    <section id="blog" className="section bg-surface-soft" aria-labelledby="blog-heading">
      <Container>
        <SectionHeading
          eyebrow="Blog"
          title={<span id="blog-heading">{c.section_blog}</span>}
          subtitle={c.blog_subtitle}
        />

        <CardSlider
          className="mt-10"
          ariaLabel={c.section_blog}
          prevLabel={c.blog_prev}
          nextLabel={c.blog_next}
          itemClassName="w-[86%] sm:w-[47%] md:w-[46%] lg:w-[300px] xl:w-[360px]"
        >
          {blogArticles.map(({ id, icon: Icon, slug, title, excerpt, category, accent, readMinutes }) => (
            <article
              key={id}
              className="group flex h-full flex-col rounded-2xl border border-line bg-white p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-card"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-xl transition-colors duration-300 ${accentChip[accent]}`}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-ink-muted">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" /> {readMinutes} {c.min_read}
                </span>
              </div>

              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-emerald2">
                {tr(category)}
              </p>
              <h3 className="mt-1 text-lg font-bold leading-snug text-ink-strong">
                <a
                  href={articlePath(slug, locale)}
                  onClick={(event) => openInPlace(event, slug)}
                  className="text-left transition-colors hover:text-forest"
                >
                  {tr(title)}
                </a>
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">{tr(excerpt)}</p>

              <a
                href={articlePath(slug, locale)}
                onClick={(event) => openInPlace(event, slug)}
                className="mt-4 inline-flex items-center gap-1.5 self-start text-sm font-semibold text-forest transition-colors hover:text-forest-600"
              >
                {c.read_more}
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </a>
            </article>
          ))}
        </CardSlider>
      </Container>
    </section>
  );
}
