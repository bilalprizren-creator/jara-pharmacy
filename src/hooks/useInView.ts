import { useEffect, useState } from "react";

/**
 * Reports whether the section with the given id is currently on screen.
 * Used to get fixed overlays out of the way of the content they would cover.
 */
export function useInView(id: string): boolean {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = document.getElementById(id);
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [id]);

  return inView;
}
