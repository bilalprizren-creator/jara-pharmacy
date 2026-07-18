import { I18nProvider } from "@/context/I18nContext";
import { InquiryProvider } from "@/context/InquiryContext";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/layout/Footer";
import { FloatingWhatsApp } from "@/components/common/FloatingWhatsApp";
import { ProductModal } from "@/components/products/ProductModal";
import { Hero } from "@/sections/Hero";
import { Trust } from "@/sections/Trust";
import { Categories } from "@/sections/Categories";
import { Products } from "@/sections/Products";
import { Social } from "@/sections/Social";
import { Locations } from "@/sections/Locations";
import { About } from "@/sections/About";
import { Services } from "@/sections/Services";
import { Testimonials } from "@/sections/Testimonials";
import { Stats } from "@/sections/Stats";
import { Blog } from "@/sections/Blog";
import { Contact } from "@/sections/Contact";
import { SkipLink } from "@/components/common/SkipLink";

export default function App() {
  return (
    <I18nProvider>
      <InquiryProvider>
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
          <Services />
          <Testimonials />
          <Stats />
          <Blog />
          <Contact />
        </main>
        <Footer />
        <FloatingWhatsApp />
        {/* Global, accessible product detail dialog driven by InquiryContext */}
        <ProductModal />
      </InquiryProvider>
    </I18nProvider>
  );
}
