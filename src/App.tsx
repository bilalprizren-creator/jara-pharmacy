import { useEffect } from "react";
import { I18nProvider } from "@/context/I18nContext";
import { InquiryProvider } from "@/context/InquiryContext";
import { ArticleProvider } from "@/context/ArticleContext";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/layout/Footer";
import { FloatingWhatsApp } from "@/components/common/FloatingWhatsApp";
import { ProductModal } from "@/components/products/ProductModal";
import { ArticleModal } from "@/components/blog/ArticleModal";
import { Hero } from "@/sections/Hero";
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
import { scrollToId } from "@/lib/dom";
import { BRANCHES_HUB_PATH, branchIdFrom } from "@/lib/routes";

export default function App() {
  /**
   * A visitor arriving from a branch or hub result was served a page about a
   * specific pharmacy; React then replaces that markup with the homepage. Take
   * them to the branch list so the app opens on what they actually asked for
   * rather than silently at the top. Articles need no equivalent — those open
   * their own dialog from ArticleProvider.
   */
  useEffect(() => {
    const { pathname } = window.location;
    if (branchIdFrom(pathname) || pathname === BRANCHES_HUB_PATH) {
      scrollToId("locations", true);
    }
  }, []);

  return (
    <I18nProvider>
      <InquiryProvider>
        <ArticleProvider>
          <SkipLink />
          <Navbar />
          <main id="main">
          <Hero />
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
