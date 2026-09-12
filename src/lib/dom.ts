/** True when the user has requested reduced motion at the OS level. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Scroll to an in-page anchor, honoring reduced motion. */
export function scrollToId(id: string): void {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({
    behavior: prefersReducedMotion() ? "auto" : "smooth",
    block: "start",
  });
}

/** DOM id of one branch's card in the locations section. */
export function branchElementId(id: string): string {
  return `branch-${id}`;
}
