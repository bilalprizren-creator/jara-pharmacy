import { useMemo } from "react";
import { I18nProvider } from "@/context/I18nContext";
import { InquiryProvider } from "@/context/InquiryContext";
import { ArticleProvider } from "@/context/ArticleContext";
import { CartProvider } from "@/context/CartContext";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/layout/Footer";
import { FloatingWhatsApp } from "@/components/common/FloatingWhatsApp";
import { ProductModal } from "@/components/products/ProductModal";
import { ArticleModal } from "@/components/blog/ArticleModal";
import { CartDrawer } from "@/components/shop/CartDrawer";
import { Hero } from "@/sections/Hero";
import { RouteHero } from "@/sections/RouteHero";
import { Trust } from "@/sections/Trust";
import { Categories } from "@/sections/Categories";
import { Products } from "@/sections/Products";
import { Social } from "@/sections/Social";
import { Locations } from "@/sections/Locations";
import { About } from "@/sections/About";
import { OurPharmacy } from "@/sections/OurPharmacy";
import { Testimonials } from "@/sections/Testimonials";
import { Stats } from "@/sections/Stats";
import { Blog } from "@/sections/Blog";
import { Contact } from "@/sections/Contact";
import { Checkout } from "@/sections/Checkout";
import { OrderStatus } from "@/sections/OrderStatus";
import { LegalPage } from "@/sections/LegalPage";
import { SkipLink } from "@/components/common/SkipLink";
import { resolveRoute, type AppRoute } from "@/lib/routes";

/**
 * The shop and info pages stand on their own: a checkout with the whole
 * homepage scrolling underneath it would be noise, and the bank's audit
 * wants the terms page to be *the* page. Everything else keeps the
 * one-scrolling-page layout, with the hub/branch hero swapped in on top.
 */
function isStandalone(route: AppRoute | null): route is Extract<
  AppRoute,
  { kind: "checkout" | "order" | "legal" }
> {
  return route?.kind === "checkout" || route?.kind === "order" || route?.kind === "legal";
}

export default function App() {
  /**
   * A visitor arriving on a branch or hub address was served a page about
   * that pharmacy; React then replaces that markup with the app. Keep the page
   * about what they asked for: those routes open on their own hero (with the
   * rest of the homepage below it) instead of the generic one. Articles need
   * no equivalent — those open their own dialog from ArticleProvider. The
   * path never changes without a full load, so reading it once is enough.
   */
  const route = useMemo(() => resolveRoute(window.location.pathname), []);

  return (
    <I18nProvider>
      <CartProvider>
        <InquiryProvider>
          <ArticleProvider>
            <SkipLink />
            <Navbar />
            <main id="main">
              {isStandalone(route) ? (
                <StandalonePage route={route} />
              ) : (
                <>
                  {route ? <RouteHero route={route} /> : <Hero />}
                  <Trust />
                  <Categories />
                  <Products />
                  <Social />
                  <Locations />
                  <About />
                  <OurPharmacy />
                  <Testimonials />
                  <Stats />
                  <Blog />
                  <Contact />
                </>
              )}
            </main>
            <Footer />
            <FloatingWhatsApp />
            {/* Global, accessible detail dialogs driven by their contexts. */}
            <ProductModal />
            <ArticleModal />
            <CartDrawer />
          </ArticleProvider>
        </InquiryProvider>
      </CartProvider>
    </I18nProvider>
  );
}

function StandalonePage({
  route,
}: {
  route: Extract<AppRoute, { kind: "checkout" | "order" | "legal" }>;
}) {
  switch (route.kind) {
    case "checkout":
      return <Checkout />;
    case "order":
      return <OrderStatus id={route.id} />;
    case "legal":
      return <LegalPage page={route.page} />;
  }
}
