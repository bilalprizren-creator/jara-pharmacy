import { ArrowRight } from "lucide-react";
import type { Product } from "@/types";
import { useI18n } from "@/context/I18nContext";
import { CardSlider } from "@/components/ui/CardSlider";
import { ProductCard } from "@/components/products/ProductCard";

/**
 * One curated homepage row: a heading + "view all" action, and a horizontal
 * CardSlider of a capped set of products. Generic over how the products were
 * chosen (offers, featured, combined categories) — the parent passes the
 * already-resolved slice and the "view all" handler.
 */
export function ProductRow({
  title,
  subtitle,
  items,
  onViewAll,
}: {
  title: string;
  subtitle?: string;
  items: Product[];
  onViewAll: () => void;
}) {
  const { c } = useI18n();

  // Sections with no matching products render nothing (no placeholders).
  if (items.length === 0) return null;

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-ink-strong sm:text-2xl">{title}</h3>
          {subtitle && <p className="mt-0.5 text-sm text-ink-muted">{subtitle}</p>}
        </div>
        <button
          type="button"
          onClick={onViewAll}
          aria-label={`${c.products_view_all} — ${title}`}
          className="inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold text-forest transition hover:bg-forest/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime/50"
        >
          {c.products_view_all}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <CardSlider
        className="mt-4"
        ariaLabel={title}
        prevLabel={c.products_prev}
        nextLabel={c.products_next}
        // ~1.3 cards (mobile) → ~2.2 (tablet) → ~4–5 full cards (desktop).
        itemClassName="w-[74%] sm:w-[45%] md:w-[31%] lg:w-[23.5%] xl:w-[22%]"
      >
        {items.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </CardSlider>
    </div>
  );
}
