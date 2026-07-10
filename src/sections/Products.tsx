import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { PackageSearch } from "lucide-react";
import type { CategorySlug, ProductFilter } from "@/types";
import { products } from "@/data/products";
import { categories } from "@/data/categories";
import { resolveHomeSections } from "@/data/homepage";
import { useI18n } from "@/context/I18nContext";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductRow } from "@/components/products/ProductRow";
import { FilterBar, type CategoryOption } from "@/components/products/FilterBar";
import { staggerContainer } from "@/lib/motion";
import { scrollToId } from "@/lib/dom";
import { PRODUCT_FILTER_EVENT, matchesFilter, filterKey } from "@/lib/productFilter";

// Featured items first for the full-catalog grid; order is otherwise stable.
const orderedProducts = [...products].sort((a, b) => Number(b.featured) - Number(a.featured));

// Paginated grid: how many cards the full-catalog / search view shows per page.
const PAGE_SIZE = 24;

export function Products() {
  const { c, tr, fmt } = useI18n();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ProductFilter>({ kind: "home" });
  const [visible, setVisible] = useState(PAGE_SIZE);

  // Homepage rows, resolved once from the shared catalog (deduped in order).
  const homeRows = useMemo(() => resolveHomeSections(), []);

  // Let the category overview / article CTAs preselect a filter, then scroll here.
  useEffect(() => {
    const onFilter = (e: Event) => {
      setQuery("");
      setFilter((e as CustomEvent<ProductFilter>).detail);
    };
    window.addEventListener(PRODUCT_FILTER_EVENT, onFilter);
    return () => window.removeEventListener(PRODUCT_FILTER_EVENT, onFilter);
  }, []);

  // Reset pagination whenever the filter or query changes.
  useEffect(() => setVisible(PAGE_SIZE), [filter, query]);

  const options: CategoryOption[] = useMemo(() => {
    const present = new Set(products.map((p) => p.category));
    return [
      { value: "all" as const, label: c.products_filter_all },
      ...categories
        .filter((cat) => present.has(cat.slug))
        .map((cat) => ({ value: cat.slug, label: tr(cat.title) })),
    ];
  }, [c.products_filter_all, tr]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orderedProducts.filter((p) => {
      if (!matchesFilter(p, filter)) return false;
      if (!q) return true;
      const haystack = [
        p.name,
        p.brand ?? "",
        p.productCode ?? "",
        p.sku ?? "",
        tr(p.categoryLabel),
        p.shortDescription ? tr(p.shortDescription) : "",
        ...p.tags,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [query, filter, tr]);

  const isBrowse = filter.kind === "home" && query.trim() === "";
  const hasFilters = filter.kind !== "home" || query.trim() !== "";
  const count = filtered.length;
  const resultLabel = fmt(count === 1 ? "products_results_one" : "products_results_many", { count });

  // Highlighted chip: none when a non-category filter (offers/featured/group) is active.
  const activeCategory: CategorySlug | "all" | null =
    filter.kind === "category"
      ? filter.slug
      : filter.kind === "all" || filter.kind === "home"
        ? "all"
        : null;

  const listTitle = (): string => {
    switch (filter.kind) {
      case "featured":
        return c.home_popular;
      case "offers":
        return c.home_offers;
      case "group":
        return filter.id === "skin-hair" ? c.home_skin_hair : c.home_vitamins_health;
      case "category": {
        const cat = categories.find((x) => x.slug === filter.slug);
        return cat ? tr(cat.title) : c.products_all_label;
      }
      default:
        return c.products_all_label;
    }
  };

  const onCategoryChange = (value: CategorySlug | "all") =>
    setFilter(value === "all" ? { kind: "all" } : { kind: "category", slug: value });

  const clear = () => {
    setQuery("");
    setFilter({ kind: "home" });
  };

  return (
    <section id="products" className="section bg-surface-soft" aria-labelledby="products-heading">
      <Container>
        <SectionHeading
          eyebrow={c.products_eyebrow}
          title={<span id="products-heading">{c.products_title}</span>}
          subtitle={c.products_subtitle}
        />

        <FilterBar
          query={query}
          onQueryChange={setQuery}
          options={options}
          activeCategory={activeCategory}
          onCategoryChange={onCategoryChange}
          resultLabel={resultLabel}
          onClear={clear}
          showClear={hasFilters}
          showChips={!isBrowse}
        />

        {isBrowse ? (
          <div className="mt-8 flex flex-col gap-12">
            {homeRows.map(({ section, items }) => (
              <ProductRow
                key={section.id}
                title={c[section.titleKey]}
                subtitle={c[section.subtitleKey]}
                items={items}
                onViewAll={() => setFilter(section.filter)}
              />
            ))}
          </div>
        ) : count > 0 ? (
          <>
            <h3 className="mt-8 text-lg font-bold text-ink-strong">{listTitle()}</h3>
            <motion.div
              key={`${filterKey(filter)}-${query}`}
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="mt-4 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4"
            >
              {filtered.slice(0, visible).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </motion.div>

            {visible < count && (
              <div className="mt-10 flex justify-center">
                <Button variant="outline" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                  {c.products_show_more}
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="mt-10 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-line bg-white py-16 text-center">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-surface-soft text-ink-muted">
              <PackageSearch className="h-7 w-7" aria-hidden="true" />
            </span>
            <div>
              <p className="text-lg font-bold text-ink-strong">{c.products_empty_title}</p>
              <p className="mt-1 text-sm text-ink-muted">{c.products_empty}</p>
            </div>
            <Button variant="outline" size="sm" onClick={clear}>
              {c.products_clear}
            </Button>
          </div>
        )}

        <div className="mt-10 flex justify-center">
          <Button variant="ghost" onClick={() => scrollToId("contact")}>
            {c.cta_contact}
          </Button>
        </div>
      </Container>
    </section>
  );
}
