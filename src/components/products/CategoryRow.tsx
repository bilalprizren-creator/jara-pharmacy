import { ArrowRight } from "lucide-react";
import type { Category, Product } from "@/types";
import { useI18n } from "@/context/I18nContext";
import { CardSlider } from "@/components/ui/CardSlider";
import { ProductCard } from "@/components/products/ProductCard";

/**
 * One catalog category shown as a heading + a horizontal CardSlider of a few
 * products. "View all" hands control back to the parent so it can switch to the
 * full, paginated grid for this category. Only a capped slice of products is
 * passed in, so the browse view never mounts the whole catalog at once.
 */
export function CategoryRow({
  category,
  items,
  total,
  onViewAll,
}: {
  category: Category;
  items: Product[];
  total: number;
  onViewAll: () => void;
}) {
  const { c, tr, fmt } = useI18n();
  const title = tr(category.title);

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-ink-strong sm:text-2xl">{title}</h3>
          <p className="mt-0.5 text-sm text-ink-muted">
            {fmt(total === 1 ? "products_results_one" : "products_results_many", { count: total })}
          </p>
        </div>
        <button
          type="button"
          onClick={onViewAll}
          className="inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold text-forest transition hover:bg-forest/5"
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
      >
        {items.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </CardSlider>
    </div>
  );
}
