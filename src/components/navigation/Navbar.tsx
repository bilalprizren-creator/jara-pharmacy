import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, Phone, X } from "lucide-react";
import { navLinks } from "@/data/nav";
import { brand } from "@/data/brand";
import { useI18n } from "@/context/I18nContext";
import { useScrolled } from "@/hooks/useScrolled";
import { useScrollProgress } from "@/hooks/useScrollProgress";
import { useActiveSection } from "@/hooks/useActiveSection";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import { scrollToId } from "@/lib/dom";
import { telHref } from "@/lib/links";
import { cn } from "@/lib/cn";
import { Container } from "@/components/ui/Container";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Button } from "@/components/ui/Button";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { EASE } from "@/lib/motion";

const sectionIds = navLinks.map((l) => l.id);

export function Navbar() {
  const { c, tr } = useI18n();
  const scrolled = useScrolled(24);
  const active = useActiveSection(sectionIds);
  const [menuOpen, setMenuOpen] = useState(false);
  useLockBodyScroll(menuOpen);
  // Page scroll progress (0→1) driving the thin reading-progress bar.
  const scrollYProgress = useScrollProgress();

  // Solid appearance when scrolled or when the mobile menu is open.
  const solid = scrolled || menuOpen;

  const handleNav = (href: string) => {
    setMenuOpen(false);
    scrollToId(href.replace("#", ""));
  };

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        solid
          ? "border-b border-line/70 bg-white/85 backdrop-blur-md shadow-soft"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <Container>
        <nav className="flex h-18 items-center justify-between gap-4" aria-label="Primary">
          <a
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              handleNav("#home");
            }}
            className="rounded-lg"
            aria-label="Jara Pharmacy — home"
          >
            <BrandLogo
              variant="full"
              markClassName="h-11 w-11"
              disc
              wordmarkTone={solid ? "dark" : "light"}
              className={solid ? "" : "drop-shadow"}
            />
          </a>

          {/* Desktop nav */}
          <ul className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => {
              const isActive = active === link.id;
              return (
                <li key={link.id}>
                  <a
                    href={link.href}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNav(link.href);
                    }}
                    aria-current={isActive ? "true" : undefined}
                    className={cn(
                      "relative rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
                      solid
                        ? isActive
                          ? "text-forest"
                          : "text-ink-muted hover:text-forest"
                        : isActive
                          ? "text-white"
                          : "text-white/80 hover:text-white",
                    )}
                  >
                    {tr(link.label)}
                    {isActive && (
                      <motion.span
                        layoutId="nav-active"
                        className={cn(
                          "absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full",
                          solid ? "bg-lime-600" : "bg-lime",
                        )}
                        transition={{ duration: 0.3, ease: EASE }}
                      />
                    )}
                  </a>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageToggle tone={solid ? "light" : "onDark"} className="hidden sm:inline-flex" />
            <Button
              href={telHref(brand.phonePrimary.e164)}
              size="sm"
              variant={solid ? "primary" : "lime"}
              leftIcon={<Phone className="h-4 w-4" aria-hidden="true" />}
              className="hidden sm:inline-flex"
            >
              {c.cta_call}
            </Button>

            {/* Mobile menu button */}
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label={menuOpen ? c.nav_close : c.nav_menu}
              aria-expanded={menuOpen}
              className={cn(
                "inline-flex h-10 w-10 items-center justify-center rounded-full transition lg:hidden",
                solid ? "text-forest hover:bg-forest/5" : "text-white hover:bg-white/10",
              )}
            >
              {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </nav>
      </Container>

      {/* Reading-progress bar — grows lime as the page is scrolled. */}
      {!menuOpen && (
        <motion.div
          aria-hidden="true"
          style={{ scaleX: scrollYProgress }}
          className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-lime"
        />
      )}

      {/* Mobile drawer */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="overflow-hidden border-t border-line bg-white lg:hidden"
          >
            <Container>
              <ul className="flex flex-col gap-1 py-4">
                {navLinks.map((link) => (
                  <li key={link.id}>
                    <a
                      href={link.href}
                      onClick={(e) => {
                        e.preventDefault();
                        handleNav(link.href);
                      }}
                      className={cn(
                        "block rounded-xl px-4 py-3 text-base font-medium transition-colors",
                        active === link.id
                          ? "bg-forest/5 text-forest"
                          : "text-ink-strong hover:bg-surface-soft",
                      )}
                    >
                      {tr(link.label)}
                    </a>
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between gap-3 border-t border-line py-4">
                <LanguageToggle />
                <Button
                  href={telHref(brand.phonePrimary.e164)}
                  size="sm"
                  leftIcon={<Phone className="h-4 w-4" aria-hidden="true" />}
                >
                  {c.cta_call}
                </Button>
              </div>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
