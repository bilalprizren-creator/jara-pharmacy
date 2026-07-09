import { motion } from "framer-motion";
import { ArrowRight, Clock } from "lucide-react";
import { useI18n } from "@/context/I18nContext";
import { blogArticles } from "@/data/blog";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { accentChip } from "@/lib/accents";
import { staggerContainer, fadeUp, viewportOnce } from "@/lib/motion";

export function Blog() {
  const { c, tr } = useI18n();

  return (
    <section id="blog" className="section bg-surface-soft" aria-labelledby="blog-heading">
      <Container>
        <SectionHeading
          eyebrow="Blog"
          title={<span id="blog-heading">{c.section_blog}</span>}
          subtitle={c.blog_subtitle}
        />

        <motion.ul
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3"
        >
          {blogArticles.map(({ id, icon: Icon, title, excerpt, category, accent, readMinutes }) => (
            <motion.li key={id} variants={fadeUp}>
              <article className="group flex h-full flex-col rounded-2xl border border-line bg-white p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-card">
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex h-11 w-11 items-center justify-center rounded-xl transition-colors duration-300 ${accentChip[accent]}`}
                  >
                    <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-ink-muted">
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" /> {readMinutes} min
                  </span>
                </div>

                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-emerald2">
                  {tr(category)}
                </p>
                <h3 className="mt-1 text-lg font-bold leading-snug text-ink-strong">
                  {tr(title)}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">
                  {tr(excerpt)}
                </p>

                <button
                  type="button"
                  className="mt-4 inline-flex items-center gap-1.5 self-start text-sm font-semibold text-forest transition-colors hover:text-forest-600"
                >
                  {c.read_more}
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                </button>
              </article>
            </motion.li>
          ))}
        </motion.ul>
      </Container>
    </section>
  );
}
