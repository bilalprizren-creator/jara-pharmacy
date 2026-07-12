import { Children, useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { fadeUp, viewportOnce } from "@/lib/motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/**
 * Reusable single-row horizontal card carousel. Each child becomes one snap
 * slide; the track scrolls natively (touch swipe / trackpad) with a hidden
 * scrollbar, and desktop/tablet get arrow buttons that page through the cards.
 *
 * Cards never wrap to a second row, and all horizontal scrolling is contained
 * inside the track — the page itself never scrolls sideways. The reveal
 * animation is applied once to the whole track (not per card) so slides that
 * start off-screen to the right are not stuck at opacity:0.
 */
interface CardSliderProps {
  /** One node per slide (the existing card markup). */
  children: ReactNode;
  /** Accessible label for the scroll region. */
  ariaLabel: string;
  /** aria-label for the previous-cards button. */
  prevLabel: string;
  /** aria-label for the next-cards button. */
  nextLabel: string;
  /** Responsive width classes applied to each slide. */
  itemClassName?: string;
  className?: string;
}

/** ~1 card + peek on mobile, ~2 on small, fixed premium widths on md+. */
const DEFAULT_ITEM_WIDTH = "w-[85%] sm:w-[46%] md:w-[300px] xl:w-[320px]";

/**
 * Soft edge fade for the scroll track. Opaque through the middle, fading to
 * transparent at each edge so cards trail off gently instead of hitting a hard
 * line. Each side is toggled via `--edge-l` / `--edge-r` (1 = fade, 0 = crisp):
 * `calc(len * 0)` collapses that side, so an edge only fades when there is more
 * content behind it. `--edge-fade` (set responsively in the class list) controls
 * the fade width.
 */
const EDGE_MASK =
  "linear-gradient(to right," +
  " transparent 0," +
  " #000 calc(var(--edge-fade) * var(--edge-l))," +
  " #000 calc(100% - var(--edge-fade) * var(--edge-r))," +
  " transparent 100%)";

export function CardSlider({
  children,
  ariaLabel,
  prevLabel,
  nextLabel,
  itemClassName,
  className,
}: CardSliderProps) {
  const trackRef = useRef<HTMLUListElement>(null);
  const reduced = useReducedMotion();
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [scrollable, setScrollable] = useState(false);

  const update = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setScrollable(max > 4);
    setAtStart(el.scrollLeft <= 2);
    setAtEnd(el.scrollLeft >= max - 2);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [update]);

  const scrollByDir = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: reduced ? "auto" : "smooth" });
  };

  const arrowBase =
    "absolute top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white text-forest shadow-card transition-all duration-300 hover:border-lime hover:text-emerald2 hover:shadow-glow disabled:pointer-events-none disabled:opacity-0 md:inline-flex";

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        aria-label={prevLabel}
        onClick={() => scrollByDir(-1)}
        disabled={atStart}
        className={cn(arrowBase, "left-0", !scrollable && "md:hidden")}
      >
        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
      </button>

      <motion.ul
        ref={trackRef}
        role="group"
        aria-label={ariaLabel}
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={viewportOnce}
        style={{
          WebkitOverflowScrolling: "touch",
          ["--edge-l"]: atStart ? 0 : 1,
          ["--edge-r"]: !scrollable || atEnd ? 0 : 1,
          WebkitMaskImage: EDGE_MASK,
          maskImage: EDGE_MASK,
        } as CSSProperties}
        className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain scroll-smooth py-4 [--edge-fade:2rem] md:scroll-px-12 md:px-12 md:[--edge-fade:3rem]"
      >
        {Children.toArray(children).map((child, i) => (
          <li key={i} className={cn("flex snap-start shrink-0", itemClassName ?? DEFAULT_ITEM_WIDTH)}>
            {child}
          </li>
        ))}
      </motion.ul>

      <button
        type="button"
        aria-label={nextLabel}
        onClick={() => scrollByDir(1)}
        disabled={atEnd}
        className={cn(arrowBase, "right-0", !scrollable && "md:hidden")}
      >
        <ChevronRight className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  );
}
