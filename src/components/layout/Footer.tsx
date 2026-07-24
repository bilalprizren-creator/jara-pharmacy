import { Phone, Mail, MapPin, Instagram, Facebook, ArrowUp } from "lucide-react";
import { useI18n } from "@/context/I18nContext";
import { brand } from "@/data/brand";
import { navLinks } from "@/data/nav";
import { categories } from "@/data/categories";
import { Container } from "@/components/ui/Container";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { telHref, mailtoHref, instagramHref } from "@/lib/links";
import { trackInquiry } from "@/lib/track";
import { scrollToId } from "@/lib/dom";

export function Footer() {
  const { c, tr } = useI18n();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-deep text-white">
      <Container>
        <div className="grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-[1.4fr,1fr,1fr,1.1fr]">
          {/* Brand */}
          <div>
            <BrandLogo variant="footer" disc markClassName="h-11 w-11" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">
              {c.footer_description}
            </p>
            <div className="mt-5 flex items-center gap-3">
              <SocialIcon href={instagramHref()} label="Instagram">
                <Instagram className="h-4.5 w-4.5" />
              </SocialIcon>
              <SocialIcon href={brand.facebookUrl} label="Facebook">
                <Facebook className="h-4.5 w-4.5" />
              </SocialIcon>
              <SocialIcon href={mailtoHref()} label="Email">
                <Mail className="h-4.5 w-4.5" />
              </SocialIcon>
            </div>
          </div>

          {/* Quick links */}
          <nav aria-label={c.footer_quicklinks}>
            <h3 className="text-sm font-bold uppercase tracking-wide text-white">
              {c.footer_quicklinks}
            </h3>
            <ul className="mt-4 space-y-2.5">
              {navLinks.map((link) => (
                <li key={link.id}>
                  <a
                    href={link.href}
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToId(link.id);
                    }}
                    className="text-sm text-white/60 transition-colors hover:text-lime"
                  >
                    {tr(link.label)}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Categories */}
          <nav aria-label={c.footer_categories}>
            <h3 className="text-sm font-bold uppercase tracking-wide text-white">
              {c.footer_categories}
            </h3>
            <ul className="mt-4 space-y-2.5">
              {categories.slice(0, 6).map((cat) => (
                <li key={cat.slug}>
                  <a
                    href="#products"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToId("products");
                    }}
                    className="text-sm text-white/60 transition-colors hover:text-lime"
                  >
                    {tr(cat.title)}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-white">
              {c.footer_contact}
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-white/60">
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-lime" aria-hidden="true" />
                {brand.address.full}
              </li>
              <li>
                <a
                  href={telHref(brand.phonePrimary.e164)}
                  onClick={() => trackInquiry("call", "footer")}
                  className="flex items-center gap-2.5 hover:text-lime"
                >
                  <Phone className="h-4 w-4 shrink-0 text-lime" aria-hidden="true" />
                  {brand.phonePrimary.label}
                </a>
              </li>
              <li>
                <a
                  href={telHref(brand.phoneSecondary.e164)}
                  onClick={() => trackInquiry("call", "footer")}
                  className="flex items-center gap-2.5 hover:text-lime"
                >
                  <Phone className="h-4 w-4 shrink-0 text-lime" aria-hidden="true" />
                  {brand.phoneSecondary.label}
                </a>
              </li>
              <li>
                <a href={mailtoHref()} className="flex items-center gap-2.5 hover:text-lime">
                  <Mail className="h-4 w-4 shrink-0 text-lime" aria-hidden="true" />
                  {brand.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 py-6 sm:flex-row">
          <p className="text-xs text-white/50">
            © {year} {brand.name}. {c.footer_rights}
          </p>
          <p className="hidden text-xs text-white/40 sm:block">{c.footer_made}</p>
          <div className="flex items-center gap-3">
            <LanguageToggle tone="onDark" />
            <button
              type="button"
              onClick={() => scrollToId("home")}
              aria-label={c.back_to_top}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-lime hover:text-deep"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Container>
    </footer>
  );
}

function SocialIcon({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-lime hover:text-deep"
    >
      {children}
    </a>
  );
}
