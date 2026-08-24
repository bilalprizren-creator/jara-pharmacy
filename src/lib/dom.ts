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

/** DOM id of one branch's card. Written by Locations, read by `revealBranch`. */
export function branchElementId(id: string): string {
  return `branch-${id}`;
}

/**
 * How long to wait before ringing the card, and how long to leave the ring on.
 *
 * The splash painted by index.html covers the page for ~1.6s and then fades for
 * another 0.7s (see SplashHandoff), so a highlight applied on mount would burn
 * out behind it and never be seen. The scroll itself stays immediate — running
 * it behind the splash is precisely what makes it invisible, so the app is
 * already in the right place when the splash lifts instead of jumping there.
 */
const HIGHLIGHT_DELAY_MS = 2000;
const HIGHLIGHT_HOLD_MS = 3200;

/**
 * Bring one branch's card into view and mark it, for a visitor arriving on
 * /lokacionet/<id>.
 *
 * `scrollIntoView` moves *every* scrollable ancestor, so this one call takes the
 * page down to the locations section and the CardSlider track sideways to the
 * right card. `scrollToId` can only do the first, which left someone who had
 * searched for one specific pharmacy looking at whichever eleventh of the
 * carousel happened to be on screen, with nothing marking the one they asked
 * for.
 */
export function revealBranch(id: string): void {
  const el = document.getElementById(branchElementId(id));
  if (!el) return;

  const bring = () => el.scrollIntoView({ behavior: "auto", block: "center", inline: "center" });

  bring();

  window.setTimeout(() => {
    // Once more before the ring shows. The splash is still up, so this is
    // invisible, and it absorbs anything that changed height in between —
    // web fonts swapping in, or the lazy map chunk replacing its placeholder.
    bring();
    el.setAttribute("data-highlight", "");
    window.setTimeout(() => el.removeAttribute("data-highlight"), HIGHLIGHT_HOLD_MS);
  }, HIGHLIGHT_DELAY_MS);
}
