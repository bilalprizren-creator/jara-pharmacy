import { motion } from "framer-motion";
import { useI18n } from "@/context/I18nContext";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { scrollToId } from "@/lib/dom";
import { cn } from "@/lib/cn";
import { staggerContainer, fadeUp, viewportOnce } from "@/lib/motion";

/** Real interior photos of the physical pharmacy — builds trust alongside the catalog. */
export function OurPharmacy() {
  const { c } = useI18n();
  const reduced = useReducedMotion();

  const photos = [
    {
      src: "/pharmacy/jara-pharmacy-interior-wide.webp",
      alt: c.pharmacy_interior_alt_1,
      span: "lg:col-span-3",
    },
    {
      src: "/pharmacy/jara-pharmacy-counter.webp",
      alt: c.pharmacy_interior_alt_2,
      span: "lg:col-span-2",
    },
  ];

  return (
    <section id="our-pharmacy" className="section bg-white" aria-labelledby="our-pharmacy-heading">
      <Container>
        <SectionHeading
          title={<span id="our-pharmacy-heading">{c.pharmacy_title}</span>}
          subtitle={c.pharmacy_subtitle}
        />

        <motion.ul
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mt-10 grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-5"
        >
          {photos.map((photo) => (
            <motion.li
              key={photo.src}
              variants={fadeUp}
              className={cn("group overflow-hidden rounded-2xl shadow-card", photo.span)}
            >
              <div className="h-[280px] sm:h-[340px] lg:h-[380px]">
                <img
                  src={photo.src}
                  alt={photo.alt}
                  loading="lazy"
                  decoding="async"
                  className={cn(
                    "h-full w-full object-cover",
                    !reduced && "transition-transform duration-500 group-hover:scale-[1.05]",
                  )}
                />
              </div>
            </motion.li>
          ))}
        </motion.ul>

        <div className="mt-10 flex justify-center">
          <Button variant="outline" onClick={() => scrollToId("locations")}>
            {c.pharmacy_visit_cta}
          </Button>
        </div>
      </Container>
    </section>
  );
}
