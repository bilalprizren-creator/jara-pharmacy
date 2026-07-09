import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PackageSearch } from "lucide-react";
import type { CategorySlug } from "@/types";
import { products } from "@/data/products";
import { categories } from "@/data/categories";
import { useI18n } from "@/context/I18nContext";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { ProductCard } from "@/components/products/ProductCard";
import { FilterBar, type CategoryOption } from "@/components/products/FilterBar";
import { staggerContainer } from "@/lib/motion";
import { scrollToId } from "@/lib/dom";

// Featured items first for the default view; order is otherwise stable.
const orderedProducts = [...products].sort(
  (a, b) => Number(b.featured) - Number(a.featured),
);

export function Products() {
  const { c, tr, fmt } = useI18n();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategorySlug | "all">("all");

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
      const matchesCategory = category === "all" || p.category === category;
      if (!matchesCategory) return false;
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
  }, [query, category, tr]);

  const hasFilters = query.trim() !== "" || category !== "all";
  const count = filtered.length;
  const resultLabel = fmt(count === 1 ? "products_results_one" : "products_results_many", { count });

  const clear = () => {
    setQuery("");
    setCategory("all");
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
          activeCategory={category}
          onCategoryChange={setCategory}
          resultLabel={resultLabel}
          onClear={clear}
          showClear={hasFilters}
        />

        {count > 0 ? (
          <motion.div
            key={`${category}-${query}`}
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4"
          >
            <AnimatePresence mode="popLayout">
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </AnimatePresence>
          </motion.div>
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
