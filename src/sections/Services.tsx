import { useI18n } from "@/context/I18nContext";
import { services } from "@/data/services";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CardSlider } from "@/components/ui/CardSlider";

export function Services() {
  const { c, tr } = useI18n();

  return (
    <section className="section bg-white" aria-labelledby="services-heading">
      <Container>
        <SectionHeading
          eyebrow={c.section_services}
          title={<span id="services-heading">{c.services_title}</span>}
          subtitle={c.services_subtitle}
        />

        <CardSlider
          className="mt-12"
          ariaLabel={tr({ al: "Shërbimet tona", en: "Our services" })}
          prevLabel={tr({ al: "Shërbimet e mëparshme", en: "Previous services" })}
          nextLabel={tr({ al: "Shërbimet e radhës", en: "Next services" })}
        >
          {services.map(({ id, icon: Icon, title, text }) => (
            <div
              key={id}
              className="card-surface group flex h-full w-full flex-col gap-3 p-6"
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-panel text-lime ring-1 ring-lime/35 transition-all duration-300 group-hover:shadow-glow">
                <Icon className="h-6 w-6" strokeWidth={1.5} aria-hidden="true" />
              </span>
              <h3 className="text-base font-bold text-ink-strong">{tr(title)}</h3>
              <p className="text-sm leading-relaxed text-ink-muted">{tr(text)}</p>
            </div>
          ))}
        </CardSlider>
      </Container>
    </section>
  );
}
