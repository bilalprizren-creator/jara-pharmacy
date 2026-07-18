import { motion } from "framer-motion";
import { ShieldCheck, HeartHandshake, Sparkles, BadgeCheck } from "lucide-react";
import { useI18n } from "@/context/I18nContext";
import { brand } from "@/data/brand";
import { stats } from "@/data/stats";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { fadeUp, viewportOnce } from "@/lib/motion";

export function About() {
  const { c, tr } = useI18n();

  const values = [
    { icon: BadgeCheck, label: c.about_value_quality },
    { icon: ShieldCheck, label: c.about_value_trust },
    { icon: HeartHandshake, label: c.about_value_care },
    { icon: Sparkles, label: c.about_value_pro },
  ];

  return (
    <section id="about" className="section bg-white" aria-labelledby="about-heading">
      <Container>
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionHeading
              align="left"
              eyebrow={c.about_eyebrow}
              title={<span id="about-heading">{c.about_title}</span>}
            />
            <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-muted text-pretty sm:text-lg">
              {c.about_body}
            </p>

            <ul className="mt-8 grid grid-cols-2 gap-3 sm:max-w-md">
              {values.map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="flex items-center gap-3 rounded-xl border border-line bg-surface-soft px-4 py-3"
                >
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-lime-soft text-emerald2">
                    <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                  </span>
                  <span className="text-sm font-semibold text-ink-strong">{label}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Brand visual panel */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
            className="relative overflow-hidden rounded-3xl bg-hero-forest p-8 text-white shadow-card sm:p-12"
          >
            <div className="pointer-events-none absolute -left-12 bottom-0 h-48 w-48 rounded-full bg-lime/15 blur-3xl" aria-hidden="true" />
            <div className="relative flex flex-col items-center gap-6 text-center">
              <BrandLogo variant="full" disc markClassName="h-16 w-16" className="scale-125" />
              <p className="text-lg font-semibold uppercase tracking-[0.2em] text-lime">
                {tr(brand.slogan)}
              </p>
              {/* Authentic tagline lifted from the brand's social posts. */}
              <p className="max-w-xs text-sm italic leading-relaxed text-lime-soft/90">
                “{c.about_quote}”
              </p>
              <p className="max-w-xs text-sm text-white/70">
                {brand.address.full}
              </p>
              <div className="mt-2 grid w-full grid-cols-3 gap-3 border-t border-white/10 pt-6 text-center">
                {[stats[0], stats[1], stats[3]].map((s) => (
                  <Metric
                    key={s.id}
                    value={s.display ?? `${s.value}${s.suffix ?? ""}`}
                    label={tr(s.label)}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-xl font-extrabold text-white">{value}</p>
      <p className="mt-0.5 text-[11px] text-white/60">{label}</p>
    </div>
  );
}
