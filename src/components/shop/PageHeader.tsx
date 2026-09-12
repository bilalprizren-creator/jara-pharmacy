import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { EASE } from "@/lib/motion";

/**
 * The dark band at the top of every standalone page (checkout, order status,
 * info pages). It exists as much for the navbar as for the title: the header
 * starts transparent over a dark hero and only turns white on scroll, so a
 * page that opened straight on a white surface would show white nav text on
 * white. Same gradient and rhythm as the branch pages' hero.
 */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  icon,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section id="home" className="relative overflow-hidden bg-hero-forest text-white">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-lime/20 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-80 w-80 rounded-full bg-emerald2-400/30 blur-3xl" />
      </div>
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="relative max-w-3xl pb-12 pt-28 sm:pt-32 lg:pb-14 lg:pt-36"
        >
          <p className="inline-flex items-center gap-2 text-label uppercase text-lime">
            {icon}
            {eyebrow}
          </p>
          <h1 className="mt-3 text-display-l text-white sm:text-display-xl">{title}</h1>
          {subtitle && (
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">
              {subtitle}
            </p>
          )}
          {children}
        </motion.div>
      </Container>
    </section>
  );
}
