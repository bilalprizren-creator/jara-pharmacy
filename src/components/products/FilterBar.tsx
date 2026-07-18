import { Search, SlidersHorizontal, X } from "lucide-react";
import type { CategorySlug } from "@/types";
import { useI18n } from "@/context/I18nContext";
import { Chip } from "@/components/ui/Chip";

export interface CategoryOption {
  value: CategorySlug | "all";
  label: string;
}

export function FilterBar({
  query,
  onQueryChange,
  options,
  activeCategory,
  onCategoryChange,
  resultLabel,
  onClear,
  showClear,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  options: CategoryOption[];
  activeCategory: CategorySlug | "all";
  onCategoryChange: (value: CategorySlug | "all") => void;
  resultLabel: string;
  onClear: () => void;
  showClear: boolean;
}) {
  const { c } = useI18n();

  return (
    <div className="mt-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Search */}
        <div className="relative w-full lg:max-w-sm">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-ink-muted"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={c.products_search}
            aria-label={c.products_search}
            className="h-12 w-full rounded-full border border-line bg-white pl-11 pr-4 text-sm text-ink-strong shadow-soft outline-none transition placeholder:text-ink-muted focus:border-forest/40 focus:ring-2 focus:ring-lime/40"
          />
        </div>

        <div className="flex items-center justify-between gap-3 lg:justify-end">
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted">
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            {resultLabel}
          </span>
          {showClear && (
            <button
              type="button"
              onClick={onClear}
              className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium text-forest transition hover:bg-forest/5"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              {c.products_clear}
            </button>
          )}
        </div>
      </div>

      {/* Category chips */}
      <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
        {options.map((opt) => (
          <Chip
            key={opt.value}
            active={activeCategory === opt.value}
            onClick={() => onCategoryChange(opt.value)}
          >
            {opt.label}
          </Chip>
        ))}
      </div>
    </div>
  );
}
