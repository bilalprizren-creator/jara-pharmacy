import { motion } from "framer-motion";
import { ShieldCheck, Stethoscope, MapPin, HeartHandshake, ArrowRight, Sparkles } from "lucide-react";
import { useI18n } from "@/context/I18nContext";
import { brand } from "@/data/brand";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { scrollToId } from "@/lib/dom";
import { EASE } from "@/lib/motion";

const badgeIcons = [ShieldCheck, Stethoscope, MapPin, HeartHandshake];

export function Hero() {
  const { c, tr } = useI18n();

  const badges = [c.trust_original, c.trust_advice, c.trust_locations, c.trust_family];

  return (
    <section id="home" className="relative overflow-hidden bg-hero-forest text-white">
      {/* ambient glow + subtle grid */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-lime/20 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-80 w-80 rounded-full bg-emerald2-400/30 blur-3xl" />
        <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-lime/40 to-transparent" />
      </div>

      <Container className="relative">
        <div className="grid items-center gap-12 pb-16 pt-28 sm:pt-32 lg:grid-cols-[1.05fr,0.95fr] lg:gap-8 lg:pb-24 lg:pt-36">
          {/* Copy column */}
          <div className="max-w-xl">
            <motion.span
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE }}
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-lime-soft ring-1 ring-white/15"
            >
              <Sparkles className="h-3.5 w-3.5 text-lime" aria-hidden="true" />
              {c.hero_eyebrow}
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE, delay: 0.05 }}
              className="mt-5 text-4xl font-extrabold leading-[1.06] tracking-tight text-balance sm:text-5xl lg:text-[3.5rem]"
            >
              {c.hero_title}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE, delay: 0.12 }}
              className="mt-5 max-w-lg text-base leading-relaxed text-white/75 text-pretty sm:text-lg"
            >
              {c.hero_subtitle}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE, delay: 0.19 }}
              className="mt-8 flex flex-wrap gap-3"
            >
              <Button
                variant="lime"
                size="lg"
                onClick={() => scrollToId("products")}
                rightIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
              >
                {c.cta_products}
              </Button>
              <Button variant="glass" size="lg" onClick={() => scrollToId("contact")}>
                {c.cta_contact}
              </Button>
            </motion.div>

            {/* Trust badges */}
            <motion.ul
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-10 grid grid-cols-2 gap-x-6 gap-y-3 sm:flex sm:flex-wrap sm:gap-x-6"
            >
              {badges.map((label, i) => {
                const Icon = badgeIcons[i];
                return (
                  <li key={label} className="flex items-center gap-2 text-sm text-white/80">
                    <Icon className="h-4 w-4 shrink-0 text-lime" aria-hidden="true" />
                    {label}
                  </li>
                );
              })}
            </motion.ul>
          </div>

          {/* Visual column — real storefront photo */}
          <div className="relative w-full">
            <div className="h-[220px] w-full overflow-hidden rounded-3xl shadow-card sm:h-[280px] lg:h-[440px]">
              {/* Only above-the-fold, LCP-relevant image on the site — deliberately not lazy. */}
              <img
                src="/pharmacy/jara-pharmacy-exterior.webp"
                alt={c.pharmacy_exterior_alt}
                loading="eager"
                className="h-full w-full object-cover object-top"
              />
            </div>

            {/* slogan chip — lime neon ring echoing the glowing storefront sign */}
            <div
              aria-hidden="true"
              className="absolute -bottom-4 right-4 rounded-2xl bg-deep/80 px-4 py-3 shadow-glow ring-1 ring-lime/40 backdrop-blur"
            >
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-lime">
                {tr(brand.slogan)}
              </p>
            </div>
          </div>
        </div>
      </Container>

      {/* soft transition into the light page */}
      <div className="h-10 bg-gradient-to-b from-transparent to-surface-soft/0" />
    </section>
  );
}
