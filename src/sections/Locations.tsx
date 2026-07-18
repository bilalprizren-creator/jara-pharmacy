import { motion } from "framer-motion";
import { MapPin, Navigation, Phone, Clock, ArrowRight } from "lucide-react";
import { useI18n } from "@/context/I18nContext";
import { locations } from "@/data/locations";
import { brand } from "@/data/brand";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { mapsHref, telHref } from "@/lib/links";
import { staggerContainer, fadeUp, viewportOnce } from "@/lib/motion";

export function Locations() {
  const { c, tr } = useI18n();
  const featured = locations.find((l) => l.featured) ?? locations[0];
  const rest = locations.filter((l) => l.id !== featured.id);

  return (
    <section id="locations" className="section bg-surface-soft" aria-labelledby="locations-heading">
      <Container>
        <SectionHeading
          eyebrow={c.locations_eyebrow}
          title={<span id="locations-heading">{c.locations_title}</span>}
          subtitle={c.locations_subtitle}
        />

        <div className="mt-12 grid gap-5 lg:grid-cols-[1.1fr,1fr]">
          {/* Featured location */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
            className="relative flex flex-col justify-between overflow-hidden rounded-2xl bg-brand-panel p-7 text-white shadow-card sm:p-9"
          >
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-lime/15 blur-2xl" aria-hidden="true" />
            <div className="relative">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-lime-soft ring-1 ring-white/15">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> {c.location_featured}
              </span>
              <h3 className="mt-4 text-2xl font-extrabold sm:text-3xl">{featured.name}</h3>
              <p className="mt-2 max-w-sm text-white/75">{featured.address}</p>

              <dl className="mt-6 space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-lime" aria-hidden="true" />
                  <a href={telHref(brand.phonePrimary.e164)} className="hover:text-lime">
                    {brand.phonePrimary.label}
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-lime" aria-hidden="true" />
                  <span className="text-white/80">{c.contact_hours_value}</span>
                </div>
              </dl>
            </div>

            <div className="relative mt-8 flex flex-wrap gap-3">
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
          </motion.div>

          {/* Other locations */}
          <motion.ul
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
            className="grid gap-3 sm:grid-cols-2"
          >
            {rest.map((location, i) => (
              <motion.li
                key={location.id}
                variants={fadeUp}
                className="card-surface flex flex-col justify-between gap-4 p-5"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-forest/5 text-forest">
                      <MapPin className="h-4.5 w-4.5" aria-hidden="true" />
                    </span>
                    <span className="text-xs font-semibold text-ink-muted">
                      {String(i + 2).padStart(2, "0")}
                    </span>
                  </div>
                  <h4 className="mt-3 text-base font-bold text-ink-strong">{location.name}</h4>
                  <p className="mt-0.5 text-sm text-ink-muted">
                    {location.note ? tr(location.note) : location.city}
                  </p>
                </div>
                <a
                  href={mapsHref(location.mapsQuery)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest hover:text-forest-600"
                >
                  <Navigation className="h-4 w-4" aria-hidden="true" />
                  {c.location_directions}
                </a>
              </motion.li>
            ))}
          </motion.ul>
        </div>
      </Container>
    </section>
  );
}
