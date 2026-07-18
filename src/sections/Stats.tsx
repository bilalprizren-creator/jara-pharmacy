import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useI18n } from "@/context/I18nContext";
import { stats } from "@/data/stats";
import type { Stat } from "@/types";
import { Container } from "@/components/ui/Container";
import { useCountUp } from "@/hooks/useCountUp";
import { fadeUp, staggerContainer } from "@/lib/motion";

export function Stats() {
  const { c } = useI18n();

  return (
    <section className="section bg-white" aria-labelledby="stats-heading">
      <Container>
        <div className="relative overflow-hidden rounded-3xl bg-brand-panel px-6 py-12 text-white shadow-card sm:px-10 sm:py-16">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-lime/15 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-24 -left-10 h-64 w-64 rounded-full bg-emerald2-400/25 blur-3xl" aria-hidden="true" />

          <div className="relative mx-auto max-w-2xl text-center">
            <h2 id="stats-heading" className="text-2xl font-extrabold sm:text-3xl">
              {c.stats_title}
            </h2>
            <p className="mt-2 text-white/70">{c.stats_subtitle}</p>
          </div>

          <motion.ul
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.4 }}
            className="relative mt-10 grid grid-cols-2 gap-6 lg:grid-cols-4"
          >
            {stats.map((stat) => (
              <StatCard key={stat.id} stat={stat} />
            ))}
          </motion.ul>
        </div>
      </Container>
    </section>
  );
}

function StatCard({ stat }: { stat: Stat }) {
  const { tr } = useI18n();
  const ref = useRef<HTMLLIElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const count = useCountUp({ end: stat.value, active: inView });
  const Icon = stat.icon;

  const display = stat.display ?? `${count.toLocaleString("de-DE")}${stat.suffix ?? ""}`;

  return (
    <motion.li ref={ref} variants={fadeUp} className="flex flex-col items-center text-center">
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-lime ring-1 ring-white/15">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <p className="mt-4 text-3xl font-extrabold tabular-nums sm:text-4xl">{display}</p>
      <p className="mt-1 text-sm text-white/70">{tr(stat.label)}</p>
    </motion.li>
  );
}
