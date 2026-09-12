import { ArrowLeft, FileText, ShieldCheck, Truck } from "lucide-react";
import { useI18n } from "@/context/I18nContext";
import { legalPages, type LegalPage as LegalPageData } from "@/data/legal";
import { shippingMethods } from "@/data/shipping";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/shop/PageHeader";
import { usePageMeta } from "@/hooks/usePageMeta";
import { formatEur } from "@/lib/money";
import { legalPath } from "@/lib/routes";
import { cn } from "@/lib/cn";

const ICONS: Record<string, typeof FileText> = {
  "kushtet-e-blerjes": FileText,
  privatesia: ShieldCheck,
  "dergesa-dhe-kthimi": Truck,
};

/** /info/<slug> — terms, privacy, delivery & returns, from src/data/legal.ts. */
export function LegalPage({ page }: { page: LegalPageData }) {
  const { c, tr, locale, fmt } = useI18n();
  usePageMeta({ title: tr(page.title) });
  const Icon = ICONS[page.slug] ?? FileText;

  return (
    <>
      <PageHeader
        eyebrow={c.legal_eyebrow}
        title={tr(page.title)}
        subtitle={tr(page.intro)}
        icon={<Icon className="h-4 w-4" aria-hidden="true" />}
      />

      <section className="bg-white py-14 sm:py-16">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[1fr,16rem]">
            <article className="max-w-prose2">
              {page.showShippingTable && <ShippingTable />}

              {page.sections.map((section) => (
                <section key={tr(section.title)} className="mt-10 first:mt-0">
                  <h2 className="text-lg font-bold text-ink-strong sm:text-xl">{tr(section.title)}</h2>
                  {section.paragraphs[locale].map((paragraph) => (
                    <p key={paragraph} className="mt-3 text-[15px] leading-relaxed text-ink-muted">
                      {paragraph}
                    </p>
                  ))}
                </section>
              ))}

              <p className="mt-10 text-xs text-ink-muted">
                {fmt("legal_updated", { date: page.updated })}
              </p>
            </article>

            <aside className="lg:sticky lg:top-24 lg:self-start">
              <nav
                aria-label={c.legal_eyebrow}
                className="rounded-xl border border-line bg-surface-soft p-4 shadow-soft"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  {c.legal_eyebrow}
                </p>
                <ul className="mt-3 space-y-1">
                  {legalPages.map((other) => {
                    const OtherIcon = ICONS[other.slug] ?? FileText;
                    const current = other.slug === page.slug;
                    return (
                      <li key={other.slug}>
                        <a
                          href={legalPath(other.slug)}
                          aria-current={current ? "page" : undefined}
                          className={cn(
                            "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                            current
                              ? "bg-forest text-white"
                              : "text-ink-strong hover:bg-white hover:text-forest",
                          )}
                        >
                          <OtherIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
                          {tr(other.title)}
                        </a>
                      </li>
                    );
                  })}
                </ul>
                <a
                  href="/"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-forest hover:text-forest-600"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  {c.legal_back}
                </a>
              </nav>
            </aside>
          </div>
        </Container>
      </section>
    </>
  );
}

/** The live fee table — the same numbers the checkout charges. */
function ShippingTable() {
  const { c, tr, locale, fmt } = useI18n();
  return (
    <div className="overflow-x-auto rounded-xl border border-line shadow-soft">
      <table className="w-full text-sm">
        <thead className="bg-surface-soft text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
          <tr>
            <th className="px-4 py-3">{c.legal_method}</th>
            <th className="px-4 py-3">{c.legal_fee}</th>
            <th className="px-4 py-3">{c.legal_eta}</th>
          </tr>
        </thead>
        <tbody>
          {shippingMethods
            .filter((m) => m.enabled)
            .map((m) => (
              <tr key={m.id} className="border-t border-line">
                <td className="px-4 py-3 font-semibold text-ink-strong">{tr(m.title)}</td>
                <td className="px-4 py-3 text-ink-strong">
                  {m.feeCents === 0 ? c.checkout_free : formatEur(m.feeCents, locale)}
                  {m.freeFromCents != null && (
                    <span className="block text-xs text-ink-muted">
                      {fmt("checkout_free_from", { amount: formatEur(m.freeFromCents, locale) })}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-ink-muted">{tr(m.eta)}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
