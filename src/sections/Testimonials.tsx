import { motion } from "framer-motion";
import { Quote, Star } from "lucide-react";
import { useI18n } from "@/context/I18nContext";
import { testimonials } from "@/data/testimonials";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { staggerContainer, fadeUp, viewportOnce } from "@/lib/motion";
import { cn } from "@/lib/cn";

export function Testimonials() {
  const { c, tr } = useI18n();

  return (
    <section className="section bg-white" aria-labelledby="testimonials-heading">
      <Container>
        <SectionHeading
          eyebrow={<span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-lime text-lime" /> 5.0</span>}
          title={<span id="testimonials-heading">{c.section_testimonials}</span>}
          subtitle={c.testimonials_subtitle}
        />

        <motion.ul
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {testimonials.map((t) => (
            <motion.li
              key={t.id}
              variants={fadeUp}
              className="flex flex-col gap-4 rounded-2xl border border-line bg-surface-soft p-6"
            >
              <Quote className="h-7 w-7 text-lime-600" aria-hidden="true" />
              <p className="flex-1 text-[15px] leading-relaxed text-ink-strong">
                “{tr(t.quote)}”
              </p>
              <div>
                <div className="flex gap-0.5" aria-label={`${t.rating} / 5`}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-3.5 w-3.5",
                        i < t.rating ? "fill-lime text-lime" : "text-line",
                      )}
                      aria-hidden="true"
                    />
                  ))}
                </div>
                {t.name && (
                  <p className="mt-2 text-sm font-bold text-ink-strong">
                    {t.name}
                    {t.role && (
                      <span className="font-normal text-ink-muted"> · {tr(t.role)}</span>
                    )}
                  </p>
                )}
              </div>
            </motion.li>
          ))}
        </motion.ul>
      </Container>
    </section>
  );
}
