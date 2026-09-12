/** True when the user has requested reduced motion at the OS level. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Scroll to an in-page anchor, honoring reduced motion. On a standalone page
 * (checkout, order status, info) the homepage sections do not exist, so the
 * same call sends the visitor to the homepage at that anchor instead.
 */
export function scrollToId(id: string): void {
  const el = document.getElementById(id);
  if (!el) {
    if (window.location.pathname !== "/") window.location.assign(`/#${id}`);
    return;
  }
  el.scrollIntoView({
    behavior: prefersReducedMotion() ? "auto" : "smooth",
    block: "start",
  });
}

/** DOM id of one branch's card in the locations section. */
export function branchElementId(id: string): string {
  return `branch-${id}`;
}
