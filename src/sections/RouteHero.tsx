import { motion } from "framer-motion";
import {
  ArrowRight,
  ChevronDown,
  Clock,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
} from "lucide-react";
import { useI18n } from "@/context/I18nContext";
import { brand } from "@/data/brand";
import { branchIntro, hubFaq, hubIntro } from "@/data/seoPages";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { branchesByNumber, branchName, nearestBranches } from "@/lib/branches";
import { scrollToId } from "@/lib/dom";
import { formatHours } from "@/lib/hours";
import {
  branchInquiryMessage,
  generalInquiryMessage,
  mapsHref,
  telHref,
  whatsappHref,
} from "@/lib/links";
import { EASE } from "@/lib/motion";
import { BRANCHES_HUB_PATH, branchPath, type AppRoute } from "@/lib/routes";
import { trackInquiry } from "@/lib/track";
import type { Locale, Location } from "@/types";

/**
 * What a visitor — or a crawler — gets at the top of /barnatore-ne-prizren
 * and /lokacionet/<id> instead of the homepage hero.
 *
 * Every one of these addresses used to render the homepage and merely scroll,
 * so after JavaScript ran all nineteen pages were the same page; Google kept
 * three. The text here is the same copy the build writes into each page's
 * static HTML (src/data/seoPages.ts), which is what keeps the two in step.
 *
 * Deliberately no scroll-triggered reveals on the copy: it has to be in the
 * DOM, visible, the moment the page renders — for the crawler as much as for
 * a visitor who lands here from a search. The entrance animation is the same
 * mount-time fade the hero uses.
 */
export function RouteHero({ route }: { route: AppRoute }) {
  return route.kind === "hub" ? <HubPage /> : <BranchPage branch={route.branch} />;
}

/* ---- shared pieces ------------------------------------------------------ */

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: EASE, delay },
});

function Backdrop() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-lime/20 blur-3xl" />
      <div className="absolute right-0 top-1/3 h-80 w-80 rounded-full bg-emerald2-400/30 blur-3xl" />
      <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-lime/40 to-transparent" />
    </div>
  );
}

function BranchBadge({ branch }: { branch: Location }) {
  return (
    <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg bg-forest/5 px-2 text-sm font-bold text-forest ring-1 ring-forest/10 transition-colors duration-300 group-hover:bg-forest group-hover:text-white">
      {branch.branch != null ? String(branch.branch).padStart(2, "0") : "—"}
    </span>
  );
}

/** "0,7" in Albanian, "0.7" in English. */
function formatKm(km: number, locale: Locale): string {
  const value = km.toFixed(1);
  return locale === "al" ? value.replace(".", ",") : value;
}

/** Digits only, for a tel: link — "+383 49 500 763" → "38349500763". */
function e164(label: string): string {
  return label.replace(/\D/g, "");
}

/** One branch as a light card — used by the hub grid and the "nearby" strip. */
function BranchCard({ branch, km }: { branch: Location; km?: number }) {
  const { c, fmt, locale } = useI18n();
  const hours = formatHours(branch.hours, c);
  return (
    <li className="group flex h-full flex-col rounded-2xl border border-line bg-white p-5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-card">
      <div className="flex items-center justify-between">
        <BranchBadge branch={branch} />
        {km !== undefined ? (
          <span className="rounded-full bg-forest/5 px-2.5 py-1 text-xs font-semibold text-forest">
            {fmt("route_distance", { km: formatKm(km, locale) })}
          </span>
        ) : (
          <MapPin
            className="h-5 w-5 text-ink-muted transition-colors duration-300 group-hover:text-forest"
            aria-hidden="true"
          />
        )}
      </div>

      <h3 className="mt-3 text-base font-bold leading-snug text-ink-strong">
        <a href={branchPath(branch.id)} className="transition-colors hover:text-forest">
          {branchName(branch)}
        </a>
      </h3>
      <p className="mt-1 text-sm leading-relaxed text-ink-muted">{branch.address}</p>
      {hours && (
        <p className="mt-1.5 flex items-start gap-1.5 text-xs leading-relaxed text-ink-muted">
          <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-forest/70" aria-hidden="true" />
          {hours}
        </p>
      )}

      <div className="flex-1" />

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold text-forest">
        <a
          href={branchPath(branch.id)}
          className="inline-flex items-center gap-1.5 transition-colors hover:text-forest-600"
        >
          {c.route_view_branch}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </a>
        <a
          href={mapsHref(branch.mapsQuery)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 transition-colors hover:text-forest-600"
        >
          <Navigation className="h-4 w-4" aria-hidden="true" />
          {c.location_directions}
        </a>
      </div>
    </li>
  );
}

/* ---- /lokacionet/<id> --------------------------------------------------- */

function BranchPage({ branch }: { branch: Location }) {
  const { c, tr, fmt, locale } = useI18n();
  const hours = formatHours(branch.hours, c);
  const phone = branch.phone ?? brand.phonePrimary.label;
  const nearby = nearestBranches(branch, 3);
  const name = branchName(branch);

  const facts = [
    { icon: MapPin, label: c.contact_address, value: branch.address, href: undefined },
    ...(hours ? [{ icon: Clock, label: c.contact_hours, value: hours, href: undefined }] : []),
    { icon: Phone, label: c.contact_phone, value: phone, href: telHref(e164(phone)) },
  ];

  return (
    <>
      <section id="home" className="relative overflow-hidden bg-hero-forest text-white">
        <Backdrop />
        <Container className="relative">
          <div className="grid items-center gap-10 pb-16 pt-28 sm:pt-32 lg:grid-cols-[1.1fr,0.9fr] lg:gap-8 lg:pb-20 lg:pt-36">
            <div className="max-w-2xl">
              <motion.span
                {...rise(0)}
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-lime-soft ring-1 ring-white/15"
              >
                <MapPin className="h-3.5 w-3.5 text-lime" aria-hidden="true" />
                {fmt("route_branch_eyebrow", { city: branch.city })}
              </motion.span>

              <motion.h1
                {...rise(0.05)}
                className="mt-5 text-3xl font-extrabold leading-[1.1] tracking-tight text-balance sm:text-4xl lg:text-5xl"
              >
                {name}
              </motion.h1>

              <motion.p
                {...rise(0.12)}
                className="mt-5 max-w-xl text-base leading-relaxed text-white/75 text-pretty sm:text-lg"
              >
                {branch.note ? `${tr(branch.note)}. ` : ""}
                {branchIntro(branch, locale)}
              </motion.p>

              <motion.dl {...rise(0.19)} className="mt-8 grid gap-3 sm:grid-cols-3">
                {facts.map(({ icon: Icon, label, value, href }) => (
                  <div
                    key={label}
                    className="rounded-2xl bg-white/[0.07] p-4 ring-1 ring-white/15 backdrop-blur-sm"
                  >
                    <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-lime-soft">
                      <Icon className="h-4 w-4 text-lime" aria-hidden="true" />
                      {label}
                    </dt>
                    <dd className="mt-1.5 text-sm leading-relaxed text-white/85">
                      {href ? (
                        <a
                          href={href}
                          onClick={() => trackInquiry("call", "branch_page")}
                          className="hover:text-lime"
                        >
                          {value}
                        </a>
                      ) : (
                        value
                      )}
                    </dd>
                  </div>
                ))}
              </motion.dl>

              <motion.div {...rise(0.26)} className="mt-8 flex flex-wrap gap-3">
                <Button
                  href={whatsappHref(branchInquiryMessage(locale, name))}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="whatsapp"
                  size="lg"
                  onClick={() => trackInquiry("whatsapp", "branch_page")}
                  leftIcon={<MessageCircle className="h-4 w-4" aria-hidden="true" />}
                >
                  {c.route_whatsapp}
                </Button>
                <Button
                  href={mapsHref(branch.mapsQuery)}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="lime"
                  size="lg"
                  leftIcon={<Navigation className="h-4 w-4" aria-hidden="true" />}
                >
                  {c.maps_open}
                </Button>
                <Button
                  href={telHref(e164(phone))}
                  variant="glass"
                  size="lg"
                  onClick={() => trackInquiry("call", "branch_page")}
                  leftIcon={<Phone className="h-4 w-4" aria-hidden="true" />}
                >
                  {c.route_call}
                </Button>
              </motion.div>
            </div>

            {/* Same storefront photo as the homepage hero — the visitor should
                recognise the place they searched for as the one they know. */}
            <div className="relative hidden w-full lg:block">
              <div className="h-[400px] w-full overflow-hidden rounded-3xl shadow-card">
                <img
                  src="/pharmacy/jara-pharmacy-exterior.webp"
                  alt={c.pharmacy_exterior_alt}
                  loading="eager"
                  className="h-full w-full object-cover object-top"
                />
              </div>
              <div
                aria-hidden="true"
                className="absolute -bottom-4 right-4 rounded-2xl bg-deep/80 px-4 py-3 shadow-glow ring-1 ring-lime/40 backdrop-blur"
              >
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-lime">
                  {tr(brand.slogan)}
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {nearby.length > 0 && (
        <section className="bg-surface-soft py-14 sm:py-16" aria-labelledby="nearby-heading">
          <Container>
            <SectionHeading
              align="left"
              eyebrow={c.route_nearby_eyebrow}
              title={<span id="nearby-heading">{c.route_nearby_title}</span>}
            />
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {nearby.map(({ branch: other, km }) => (
                <BranchCard key={other.id} branch={other} km={km} />
              ))}
            </ul>
            <div className="mt-8">
              <Button
                href={BRANCHES_HUB_PATH}
                variant="outline"
                rightIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
              >
                {c.route_all_branches}
              </Button>
            </div>
          </Container>
        </section>
      )}
    </>
  );
}

/* ---- /barnatore-ne-prizren ---------------------------------------------- */

function HubPage() {
  const { c, tr, locale } = useI18n();

  return (
    <>
      <section id="home" className="relative overflow-hidden bg-hero-forest text-white">
        <Backdrop />
        <Container className="relative">
          <div className="max-w-3xl pb-16 pt-28 sm:pt-32 lg:pb-20 lg:pt-36">
            <motion.span
              {...rise(0)}
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-lime-soft ring-1 ring-white/15"
            >
              <MapPin className="h-3.5 w-3.5 text-lime" aria-hidden="true" />
              {c.route_branches_eyebrow} · {branchesByNumber.length}
            </motion.span>

            <motion.h1
              {...rise(0.05)}
              className="mt-5 text-4xl font-extrabold leading-[1.06] tracking-tight text-balance sm:text-5xl lg:text-[3.5rem]"
            >
              {c.route_hub_title}
            </motion.h1>

            {hubIntro.map((paragraph, index) => (
              <motion.p
                key={paragraph.al}
                {...rise(0.12 + index * 0.05)}
                className="mt-5 text-base leading-relaxed text-white/75 text-pretty sm:text-lg"
              >
                {tr(paragraph)}
              </motion.p>
            ))}

            <motion.div {...rise(0.26)} className="mt-8 flex flex-wrap gap-3">
              <Button
                variant="lime"
                size="lg"
                onClick={() => scrollToId("locations")}
                leftIcon={<Navigation className="h-4 w-4" aria-hidden="true" />}
              >
                {c.route_map_cta}
              </Button>
              <Button
                href={whatsappHref(generalInquiryMessage(locale))}
                target="_blank"
                rel="noopener noreferrer"
                variant="glass"
                size="lg"
                onClick={() => trackInquiry("whatsapp", "hub_page")}
                leftIcon={<MessageCircle className="h-4 w-4" aria-hidden="true" />}
              >
                {c.route_whatsapp}
              </Button>
            </motion.div>
          </div>
        </Container>
      </section>

      <section className="bg-surface-soft py-16 sm:py-20" aria-labelledby="branches-heading">
        <Container>
          <SectionHeading
            align="left"
            eyebrow={c.route_branches_eyebrow}
            title={<span id="branches-heading">{c.route_branches_title}</span>}
            subtitle={c.route_branches_subtitle}
          />
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {branchesByNumber.map((branch) => (
              <BranchCard key={branch.id} branch={branch} />
            ))}
          </ul>
        </Container>
      </section>

      <section className="bg-white py-16 sm:py-20" aria-labelledby="faq-heading">
        <Container>
          <SectionHeading
            align="left"
            eyebrow={c.route_faq_eyebrow}
            title={<span id="faq-heading">{c.route_faq_title}</span>}
          />
          <div className="mt-10 grid gap-3 lg:max-w-4xl">
            {hubFaq.map((item) => (
              <details
                key={item.q.al}
                className="group rounded-2xl border border-line bg-white shadow-soft open:shadow-card"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-2xl px-5 py-4 text-base font-bold text-ink-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime [&::-webkit-details-marker]:hidden">
                  {tr(item.q)}
                  <ChevronDown
                    className="h-5 w-5 shrink-0 text-forest transition-transform duration-300 group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>
                <p className="px-5 pb-5 text-sm leading-relaxed text-ink-muted sm:text-base">
                  {tr(item.a)}
                </p>
              </details>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
