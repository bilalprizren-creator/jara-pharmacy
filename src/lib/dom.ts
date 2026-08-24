/** True when the user has requested reduced motion at the OS level. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Scroll to an in-page anchor, honoring reduced motion.
 *
 * `instant` is for arriving from outside — a deep link into a branch, say —
 * where gliding through the whole page would be noise rather than orientation.
 */
export function scrollToId(id: string, instant = false): void {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({
    behavior: instant || prefersReducedMotion() ? "auto" : "smooth",
    block: "start",
  });
}
