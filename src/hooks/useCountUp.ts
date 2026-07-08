import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "./useReducedMotion";

interface Options {
  end: number;
  duration?: number;
  /** Start the count only when this becomes true (e.g. in view). */
  active?: boolean;
}

/** Animated integer counter that respects reduced-motion. */
export function useCountUp({ end, duration = 1600, active = true }: Options): number {
  const [value, setValue] = useState(0);
  const reduced = useReducedMotion();
  const started = useRef(false);

  useEffect(() => {
    if (!active || started.current) return;
    started.current = true;

    if (reduced) {
      setValue(end);
      return;
    }

    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      // easeOutCubic for a natural deceleration
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(end * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, end, duration, reduced]);

  return value;
}
