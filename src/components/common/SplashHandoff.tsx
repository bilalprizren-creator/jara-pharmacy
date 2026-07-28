import { useEffect } from "react";
import { prefersReducedMotion } from "@/lib/dom";

/**
 * Lifts the brand splash that index.html paints before this bundle exists.
 *
 * Renders nothing. It is a component rather than a call after render() because
 * createRoot().render() is asynchronous and takes no callback — it schedules
 * through React's own scheduler, so the next statement would run before any
 * DOM exists. requestAnimationFrame is no better: its ordering against that
 * scheduler is not guaranteed. An effect in the same commit as <App /> is the
 * one hook that provably runs after App's DOM is in place.
 */

/**
 * How long the splash stays up, measured from the moment it first painted. A
 * splash that comes and goes within ~150ms on a warm cache reads as a glitch —
 * worse than showing none. This only ever bites on fast desktop loads; on a
 * phone the bundle takes longer than this anyway.
 */
const MIN_VISIBLE_MS = 700;

/** Must stay >= the opacity transition on #jara-splash in index.html. */
const FADE_OUT_MS = 400;

/** StrictMode double-invokes effects in dev, so the teardown must be once-only. */
let handedOff = false;

function hideSplash(): void {
  if (handedOff) return;
  handedOff = true;

  const el = document.getElementById("jara-splash");
  if (!el) return;

  // Anchor on first paint, not on navigation start: the HTML and the render-
  // blocking stylesheet are fetched in between, and the splash is not on
  // screen for any of that. Missing entry falls back to 0, which merely
  // shortens the hold — a safe direction to fail in.
  const fcp = performance.getEntriesByName("first-contentful-paint")[0];
  const shownAt = fcp ? fcp.startTime : 0;
  const wait = Math.max(0, shownAt + MIN_VISIBLE_MS - performance.now());
  const fade = prefersReducedMotion() ? 0 : FADE_OUT_MS;

  window.setTimeout(() => {
    // The fade overlaps the Hero's own entrance animation, so the two
    // cross-fade instead of the splash cutting away from empty content.
    el.setAttribute("data-hiding", "");
    window.setTimeout(() => el.remove(), fade);
  }, wait);
}

export function SplashHandoff(): null {
  useEffect(() => {
    hideSplash();
  }, []);

  return null;
}

export default SplashHandoff;
