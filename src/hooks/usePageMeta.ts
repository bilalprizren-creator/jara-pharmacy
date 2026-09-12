import { useEffect } from "react";
import { brand } from "@/data/brand";

/**
 * Document title (and an optional `noindex`) for the standalone pages. The
 * checkout and order pages are personal and must never be indexed — the
 * robots.txt rule covers crawlers that read it, this covers the rest.
 */
export function usePageMeta({ title, noindex = false }: { title: string; noindex?: boolean }) {
  useEffect(() => {
    const previous = document.title;
    document.title = `${title} · ${brand.name}`;

    let meta: HTMLMetaElement | null = null;
    if (noindex) {
      meta = document.createElement("meta");
      meta.name = "robots";
      meta.content = "noindex, nofollow";
      document.head.appendChild(meta);
    }

    return () => {
      document.title = previous;
      meta?.remove();
    };
  }, [title, noindex]);
}
