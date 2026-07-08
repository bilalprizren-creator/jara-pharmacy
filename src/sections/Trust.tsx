import { motion } from "framer-motion";
import { useI18n } from "@/context/I18nContext";
import { trustFeatures } from "@/data/trust";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { staggerContainer, fadeUp, viewportOnce } from "@/lib/motion";

export function Trust() {
  const { c, tr } = useI18n();

  return (
    <section className="section bg-surface-soft" aria-labelledby="trust-heading">
      <Container>
        <SectionHeading
          eyebrow={c.trust_eyebrow}
          title={<span id="trust-heading">{c.trust_title}</span>}
          subtitle={c.trust_subtitle}
        />

        <motion.ul
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
        >
          {trustFeatures.map(({ id, icon: Icon, title, text }) => (
            <motion.li
              key={id}
              variants={fadeUp}
              className="card-surface group flex flex-col gap-3 p-6"
            >
              {/* Story-highlight style disc from the brand's Instagram profile. */}
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-panel text-lime ring-1 ring-lime/35 transition-all duration-300 group-hover:shadow-glow">
                <Icon className="h-6 w-6" strokeWidth={1.5} aria-hidden="true" />
              </span>
              <h3 className="text-base font-bold text-ink-strong">{tr(title)}</h3>
              <p className="text-sm leading-relaxed text-ink-muted">{tr(text)}</p>
            </motion.li>
          ))}
        </motion.ul>
      </Container>
    </section>
  );
}
