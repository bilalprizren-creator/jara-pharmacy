import type { Variants } from "framer-motion";

/**
 * Shared, restrained motion presets. Durations stay in the 0.25s–0.7s range
 * and springs are gentle, per the brand's "luxury-clean" motion principles.
 * Reduced-motion is honored globally (CSS) and via the Reveal component.
 */

export const EASE = [0.22, 1, 0.36, 1] as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.5, ease: EASE } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 12 },
  show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
};

export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

/** Consistent in-view configuration for scroll-triggered reveals. */
export const viewportOnce = { once: true, amount: 0.2 } as const;
