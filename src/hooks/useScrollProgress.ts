import { useEffect } from "react";
import { useMotionValue, type MotionValue } from "framer-motion";

/**
 * Page scroll progress as a 0→1 MotionValue. Updated from a passive scroll
 * listener straight into the MotionValue, so bound elements repaint without
 * re-rendering React on every scroll frame.
 */
export function useScrollProgress(): MotionValue<number> {
  const progress = useMotionValue(0);

  useEffect(() => {
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.set(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [progress]);

  return progress;
}
