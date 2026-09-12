import { useMemo } from "react";
import { I18nProvider } from "@/context/I18nContext";
import { InquiryProvider } from "@/context/InquiryContext";
import { ArticleProvider } from "@/context/ArticleContext";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/layout/Footer";
import { FloatingWhatsApp } from "@/components/common/FloatingWhatsApp";
import { ProductModal } from "@/components/products/ProductModal";
import { ArticleModal } from "@/components/blog/ArticleModal";
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
import { SkipLink } from "@/components/common/SkipLink";
import { resolveRoute } from "@/lib/routes";

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
      <InquiryProvider>
        <ArticleProvider>
          <SkipLink />
          <Navbar />
          <main id="main">
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
          </main>
          <Footer />
          <FloatingWhatsApp />
          {/* Global, accessible detail dialogs driven by their contexts. */}
          <ProductModal />
          <ArticleModal />
        </ArticleProvider>
      </InquiryProvider>
    </I18nProvider>
  );
}
