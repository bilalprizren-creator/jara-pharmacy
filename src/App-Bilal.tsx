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
import { Testimonials } from "@/sections/Testimonials";
import { Stats } from "@/sections/Stats";
import { Blog } from "@/sections/Blog";
import { Contact } from "@/sections/Contact";
import { SkipLink } from "@/components/common/SkipLink";

export default function App() {
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
