import { ArrowUpRight, LayoutGrid, type LucideIcon } from "lucide-react";
import type { CategoryAccent } from "@/types";
import { useI18n } from "@/context/I18nContext";
import { categories } from "@/data/categories";
import { overviewCategories } from "@/data/homepage";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CardSlider } from "@/components/ui/CardSlider";
import { accentChip, accentBar } from "@/lib/accents";
import { showProductCategory, showProductFilter } from "@/lib/productFilter";

interface OverviewItem {
  key: string;
  icon: LucideIcon;
  accent: CategoryAccent;
  title: string;
  description: string;
  onClick: () => void;
}

export function Categories() {
  const { c, tr } = useI18n();

  // Curated subset of the full catalog categories + an "All categories" card.
  const items: OverviewItem[] = [
    ...overviewCategories
      .map((slug) => categories.find((cat) => cat.slug === slug))
      .filter((cat): cat is (typeof categories)[number] => Boolean(cat))
      .map((cat) => ({
        key: cat.slug,
        icon: cat.icon,
        accent: cat.accent,
        title: tr(cat.title),
        description: tr(cat.description),
        onClick: () => showProductCategory(cat.slug),
      })),
    {
      key: "all",
      icon: LayoutGrid,
      accent: "green" as CategoryAccent,
      title: c.cat_all,
      description: c.cat_all_sub,
      onClick: () => showProductFilter({ kind: "all" }),
    },
  ];

  return (
    <section id="categories" className="section bg-white" aria-labelledby="categories-heading">
      <Container>
        <SectionHeading
          eyebrow={c.categories_eyebrow}
          title={<span id="categories-heading">{c.categories_title}</span>}
          subtitle={c.categories_subtitle}
        />

        <CardSlider
          className="mt-12"
          ariaLabel={tr({ al: "Kategoritë", en: "Categories" })}
          prevLabel={tr({ al: "Kategoritë e mëparshme", en: "Previous categories" })}
          nextLabel={tr({ al: "Kategoritë e radhës", en: "Next categories" })}
        >
          {items.map(({ key, icon: Icon, title, description, accent, onClick }) => (
            <button
              key={key}
              type="button"
              onClick={onClick}
              aria-label={title}
              className="group relative flex h-full w-full flex-col gap-3 overflow-hidden rounded-xl border border-line bg-white p-5 text-left shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-card focus-visible:-translate-y-1"
            >
              {/* Accent bar in the category's own color, revealed on hover. */}
              <span
                aria-hidden="true"
                className={`absolute inset-x-0 top-0 h-1 origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100 group-focus-visible:scale-x-100 ${accentBar[accent]}`}
              />
              <span
                className={`inline-flex h-12 w-12 items-center justify-center rounded-xl transition-colors duration-300 ${accentChip[accent]}`}
              >
                <Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />
              </span>
              <span className="flex items-start justify-between gap-2">
                <span className="text-[15px] font-bold leading-snug text-ink-strong">{title}</span>
                <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted opacity-0 transition-opacity duration-300 group-hover:opacity-100" aria-hidden="true" />
              </span>
              <span className="text-xs leading-relaxed text-ink-muted">{description}</span>
            </button>
          ))}
        </CardSlider>
      </Container>
    </section>
  );
}
