import { motion } from "framer-motion";
import { useI18n } from "@/context/I18nContext";
import { services } from "@/data/services";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { staggerContainer, fadeUp, viewportOnce } from "@/lib/motion";

export function Services() {
  const { c, tr } = useI18n();

  return (
    <section className="section bg-surface-soft" aria-labelledby="services-heading">
      <Container>
        <SectionHeading
          eyebrow={c.section_services}
          title={<span id="services-heading">{c.services_title}</span>}
          subtitle={c.services_subtitle}
        />

        <motion.ul
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {services.map(({ id, icon: Icon, title, text }) => (
            <motion.li
              key={id}
              variants={fadeUp}
              className="group relative overflow-hidden rounded-xl border border-line bg-white p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-card"
            >
              <span className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-lime transition-transform duration-300 group-hover:scale-x-100" aria-hidden="true" />
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-forest/5 text-forest transition-colors duration-300 group-hover:bg-forest group-hover:text-white">
                <Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-base font-bold text-ink-strong">{tr(title)}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{tr(text)}</p>
            </motion.li>
          ))}
        </motion.ul>
      </Container>
    </section>
  );
}
