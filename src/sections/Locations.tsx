import { lazy, Suspense } from "react";
import { motion } from "framer-motion";
import { MapPin, Navigation, Phone, Clock, ArrowRight, Warehouse } from "lucide-react";
import { useI18n } from "@/context/I18nContext";
import { locations, publicBranches } from "@/data/locations";
import { brand } from "@/data/brand";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { CardSlider } from "@/components/ui/CardSlider";
import { LocationsMapSkeleton } from "@/components/locations/LocationsMapSkeleton";
import { formatHours } from "@/lib/hours";
import { mapsHref, telHref } from "@/lib/links";
import { branchPath } from "@/lib/routes";
import { trackInquiry } from "@/lib/track";
import { fadeUp, viewportOnce } from "@/lib/motion";

const LocationsMap = lazy(() =>
  import("@/components/locations/LocationsMap").then((mod) => ({ default: mod.LocationsMap })),
);

export function Locations() {
  const { c, tr } = useI18n();
  const featured = locations.find((l) => l.featured) ?? locations[0];
  const rest = locations.filter((l) => l.id !== featured.id);
  const cities = [...new Set(locations.map((l) => l.city.split(",")[0].trim()))];
  // The depot has no page of its own — it is not somewhere customers go.
  const hasOwnPage = new Set(publicBranches.map((l) => l.id));

  return (
    <section id="locations" className="section bg-surface-soft" aria-labelledby="locations-heading">
      <Container>
        <SectionHeading
          eyebrow={c.locations_eyebrow}
          title={<span id="locations-heading">{c.locations_title}</span>}
          subtitle={c.locations_subtitle}
        />

        {/* Featured branch — full-width brand hero with a live count panel. */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="relative mt-12 overflow-hidden rounded-3xl bg-brand-panel p-7 text-white shadow-card sm:p-9"
        >
          <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-lime/15 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-emerald2-400/25 blur-3xl" aria-hidden="true" />

          <div className="relative grid gap-8 lg:grid-cols-[1.4fr,1fr] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-lime-soft ring-1 ring-white/15">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                {featured.note ? tr(featured.note) : c.location_featured}
              </span>
              <h3 className="mt-4 text-2xl font-extrabold sm:text-3xl">{featured.name}</h3>
              <p className="mt-2 max-w-md text-white/75">{featured.address}</p>

              <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-lime" aria-hidden="true" />
                  <a
                    href={telHref(brand.phonePrimary.e164)}
                    onClick={() => trackInquiry("call", "locations")}
                    className="hover:text-lime"
                  >
                    {brand.phonePrimary.label}
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-lime" aria-hidden="true" />
                  <span className="text-white/80">
                    {formatHours(featured.hours, c) || c.contact_hours_value}
                  </span>
                </div>
              </dl>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  href={mapsHref(featured.mapsQuery)}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="lime"
                  leftIcon={<Navigation className="h-4 w-4" aria-hidden="true" />}
                >
                  {c.maps_open}
                </Button>
                <Button
                  href={brand.allLocationsMapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="glass"
                  rightIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
                >
                  {c.all_locations}
                </Button>
              </div>
            </div>

            {/* Count panel */}
            <div className="rounded-2xl bg-white/[0.07] p-6 ring-1 ring-white/15 backdrop-blur-sm">
              <p className="text-5xl font-extrabold leading-none text-lime">{locations.length}</p>
              <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-white/80">
                {c.locations_eyebrow}
              </p>
              <p className="mt-3 text-sm text-white/70">{cities.join(" · ")}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mt-6"
        >
          <Suspense fallback={<LocationsMapSkeleton label={c.locations_map_loading} />}>
            <LocationsMap />
          </Suspense>
        </motion.div>

        {/* All other branches — single-row horizontal slider (compact). */}
        <CardSlider
          className="mt-5"
          ariaLabel={c.locations_title}
          prevLabel={c.locations_prev}
          nextLabel={c.locations_next}
          itemClassName="w-[82%] sm:w-[46%] md:w-[300px] xl:w-[320px]"
        >
          {rest.map((location) => {
            const hours = formatHours(location.hours, c);
            return (
            <div
              key={location.id}
              className="group flex h-full w-full flex-col rounded-2xl border border-line bg-white p-5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-card"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg bg-forest/5 px-2 text-sm font-bold text-forest ring-1 ring-forest/10 transition-colors duration-300 group-hover:bg-forest group-hover:text-white">
                  {location.branch != null ? (
                    String(location.branch).padStart(2, "0")
                  ) : (
                    <Warehouse className="h-4 w-4" aria-hidden="true" />
                  )}
                </span>
                <MapPin
                  className="h-5 w-5 text-ink-muted transition-colors duration-300 group-hover:text-forest"
                  aria-hidden="true"
                />
              </div>

              <h4 className="mt-3 text-base font-bold leading-snug text-ink-strong">
                {hasOwnPage.has(location.id) ? (
                  <a href={branchPath(location.id)} className="transition-colors hover:text-forest">
                    {location.name}
                  </a>
                ) : (
                  location.name
                )}
              </h4>
              <p className="mt-1 text-sm leading-relaxed text-ink-muted">{location.address}</p>
              {hours && (
                <p className="mt-1.5 flex items-start gap-1.5 text-xs leading-relaxed text-ink-muted">
                  <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-forest/70" aria-hidden="true" />
                  {hours}
                </p>
              )}

              <div className="flex-1" />

              <a
                href={mapsHref(location.mapsQuery)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 self-start text-sm font-semibold text-forest transition-colors hover:text-forest-600"
              >
                <Navigation className="h-4 w-4" aria-hidden="true" />
                {c.location_directions}
              </a>
            </div>
            );
          })}
        </CardSlider>
      </Container>
    </section>
  );
}
