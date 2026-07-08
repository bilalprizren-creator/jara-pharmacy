import { motion } from "framer-motion";
import { Heart, Instagram, MessageCircle, Send } from "lucide-react";
import { useI18n } from "@/context/I18nContext";
import { socialPosts } from "@/data/socials";
import { brand } from "@/data/brand";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { ProductVisual } from "@/components/ui/ProductVisual";
import { instagramHref } from "@/lib/links";
import { staggerContainer, fadeUp, viewportOnce } from "@/lib/motion";

export function Social() {
  const { c, tr } = useI18n();

  return (
    <section className="section bg-white" aria-labelledby="social-heading">
      <Container>
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <SectionHeading
            align="left"
            eyebrow={`@${brand.instagramHandle}`}
            title={<span id="social-heading">{c.section_instagram}</span>}
            subtitle={c.social_subtitle}
          />
          <Button
            href={instagramHref()}
            target="_blank"
            rel="noopener noreferrer"
            variant="outline"
            leftIcon={<Instagram className="h-4 w-4" aria-hidden="true" />}
            className="shrink-0"
          >
            {c.instagram_follow}
          </Button>
        </div>

        <motion.ul
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {socialPosts.map((post) => (
            <motion.li
              key={post.id}
              variants={fadeUp}
              className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-soft transition-shadow duration-300 hover:shadow-card"
            >
              <div className="flex items-center gap-2.5 px-4 py-3">
                <BrandLogo variant="mark" disc markClassName="h-8 w-8" />
                <div className="leading-tight">
                  <p className="text-[13px] font-bold text-ink-strong">{brand.instagramHandle}</p>
                  <p className="text-[11px] text-ink-muted">{tr(post.category)} · Prizren</p>
                </div>
              </div>

              <div className="relative aspect-square overflow-hidden">
                {post.image ? (
                  // Real Instagram post — already brand-composed, so no overlay.
                  <img
                    src={post.image}
                    alt={tr(post.caption)}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                  />
                ) : (
                  <>
                    <ProductVisual
                      visual={post.visual}
                      rounded="rounded-none"
                      className="transition-transform duration-500 group-hover:scale-[1.05]"
                    />
                    {/* Curved deep-green band with the brand logo — the signature
                        footer of the real Instagram posts. */}
                    <div className="pointer-events-none absolute inset-x-0 bottom-0" aria-hidden="true">
                      <svg
                        viewBox="0 0 400 64"
                        preserveAspectRatio="none"
                        className="block h-12 w-full sm:h-14"
                      >
                        <path d="M0 30 Q 100 -6 220 16 Q 320 34 400 8 L400 64 L0 64 Z" fill="#0A5C44" />
                        <path
                          d="M0 30 Q 100 -6 220 16 Q 320 34 400 8"
                          fill="none"
                          stroke="#B7E532"
                          strokeWidth="2.5"
                          opacity="0.85"
                        />
                      </svg>
                      <div className="absolute bottom-1.5 left-4 origin-bottom-left scale-[0.8]">
                        <BrandLogo variant="footer" markClassName="h-7 w-7" />
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="flex flex-1 flex-col px-4 py-3">
                <div className="flex items-center gap-4 text-ink-muted">
                  <span className="inline-flex items-center gap-1 text-xs font-medium">
                    <Heart className="h-4 w-4" aria-hidden="true" /> {post.likes}
                  </span>
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  <Send className="h-4 w-4" aria-hidden="true" />
                </div>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-strong/90">
                  <span className="font-semibold">{brand.instagramHandle}</span>{" "}
                  {tr(post.caption)}
                </p>
                <a
                  href={instagramHref()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 text-sm font-semibold text-forest hover:text-forest-600"
                >
                  {c.see_more}
                </a>
              </div>
            </motion.li>
          ))}
        </motion.ul>
      </Container>
    </section>
  );
}
