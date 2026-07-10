import type { Locale } from "@/types";

/**
 * Central bilingual UI copy. Albanian is authored first (brand default);
 * English is typed against the Albanian shape so keys can never drift.
 *
 * Consume via `useCopy()` / the `t` helper — never hardcode visible strings.
 */
const al = {
  // Language
  lang_al: "Shqip",
  lang_en: "English",
  lang_switch: "Ndrysho gjuhën",

  // Global CTAs
  cta_products: "Shiko produktet",
  cta_contact: "Na kontakto",
  cta_call: "Na telefono",
  cta_whatsapp: "Na shkruaj në WhatsApp",
  see_more: "Shiko më shumë",
  read_more: "Lexo më shumë",
  back_to_top: "Kthehu lart",
  open_now: "Tani hapur",

  // Navigation
  nav_home: "Ballina",
  nav_products: "Produkte",
  nav_categories: "Kategoritë",
  nav_locations: "Lokacionet",
  nav_about: "Rreth nesh",
  nav_blog: "Blog",
  nav_contact: "Kontakt",
  nav_menu: "Menyja",
  nav_close: "Mbyll",

  // Hero
  brand_tagline: "Kujdes, besim dhe cilësi për shëndetin tuaj",
  hero_eyebrow: "Farmaci · Bukuri · Mirëqenie",
  hero_title: "Farmaci moderne në Prizren për shëndet, bukuri dhe mirëqenie",
  hero_subtitle:
    "Produkte të zgjedhura për lëkurë, flokë, vitamina, suplemente dhe kujdes të përditshëm.",
  trust_original: "Produkte origjinale",
  trust_advice: "Këshillim profesional",
  trust_locations: "10 lokacione",
  trust_family: "Kujdes për familjen",

  // Trust section
  trust_eyebrow: "Pse Jara Pharmacy",
  trust_title: "Besim që ndërtohet çdo ditë",
  trust_subtitle:
    "Kujdes profesional, produkte të zgjedhura dhe një eksperiencë e qetë për ju dhe familjen tuaj.",
  trust_quality_t: "Cilësi e garantuar",
  trust_quality_d: "Vetëm produkte origjinale nga marka të besueshme.",
  trust_selected_t: "Produkte të zgjedhura",
  trust_selected_d: "Përzgjedhje e kujdesshme për lëkurë, flokë dhe shëndet.",
  trust_advice_t: "Këshillim profesional",
  trust_advice_d: "Staf i gatshëm t'ju udhëzojë me përgjegjësi.",
  trust_near_t: "Gjithmonë pranë jush",
  trust_near_d: "10 lokacione në Prizren e Rahovec, kudo ku ju nevojitet.",
  trust_care_t: "Kujdes për shëndetin dhe bukurinë",
  trust_care_d: "Një vend për mirëqenien e përditshme të familjes.",

  // Categories
  categories_eyebrow: "Kategoritë",
  categories_title: "Zbulo çfarë të nevojitet",
  categories_subtitle:
    "Nga kujdesi për lëkurën te suplementet — çdo kategori e menduar për rutinën tuaj.",

  // Products
  products_eyebrow: "Produktet kryesore",
  products_title: "Të zgjedhura për ju",
  products_subtitle:
    "Produkte popullore dhe të reja nga koleksioni ynë. Pyet për secilin me një prekje.",
  product_ask: "Pyet për këtë produkt",
  product_view: "Shiko detajet",
  fav_add: "Shto te të preferuarat",
  fav_remove: "Hiq nga të preferuarat",
  products_search: "Kërko produkte…",
  products_filter_all: "Të gjitha",
  products_results_one: "{count} produkt",
  products_results_many: "{count} produkte",
  products_clear: "Pastro filtrat",
  products_empty_title: "Asnjë produkt",
  products_empty: "Nuk u gjet asnjë produkt me këto filtra.",
  products_view_all: "Shiko të gjitha",
  products_show_more: "Shiko më shumë",
  products_prev: "Produktet e mëparshme",
  products_next: "Produktet e tjera",
  products_all_label: "Të gjitha produktet",
  products_filter_aria: "Filtro sipas kategorisë",
  products_filter_prev: "Kategoritë e mëparshme",
  products_filter_next: "Kategoritë e radhës",

  // Homepage curated product rows
  home_offers: "Oferta",
  home_offers_sub: "Produkte të përzgjedhura dhe të promovuara.",
  home_popular: "Produktet më të kërkuara",
  home_popular_sub: "Më të njohurat dhe të rekomanduara nga ne.",
  home_skin_hair: "Kujdes për lëkurën dhe flokët",
  home_skin_hair_sub: "Kujdes ditor për lëkurë dhe flokë të shëndetshëm.",
  home_vitamins_health: "Vitamina dhe shëndet",
  home_vitamins_health_sub: "Suplemente, produkte natyrale dhe kujdes shëndetësor.",
  home_mother_baby: "Nënë dhe bebe",
  home_mother_baby_sub: "Kujdes i butë për nënat dhe të vegjlit.",

  // Category overview
  cat_all: "Të gjitha kategoritë",
  cat_all_sub: "Shfleto të gjithë katalogun e produkteve.",

  // Product modal
  modal_benefits: "Përfitimet",
  modal_usage: "Sugjerim përdorimi",
  modal_disclaimer: "Për më shumë informacione, na kontaktoni.",
  modal_ask_whatsapp: "Porosit tani",
  modal_call: "Telefono",
  modal_inquiry: "Dërgo kërkesë",

  // Social
  section_instagram: "Nga Instagrami ynë",
  social_subtitle:
    "Frymëzim për shëndet dhe bukuri, drejt nga profili ynë @jarapharmacy.",
  instagram_follow: "Na ndiq në Instagram",

  // Locations
  locations_eyebrow: "Lokacionet",
  locations_title: "Na gjeni kudo në Prizren",
  locations_subtitle:
    "Dhjetë pika shërbimi në Prizren e Rahovec, të gjitha me të njëjtin standard kujdesi.",
  location_featured: "Lokacioni kryesor",
  maps_open: "Hap në Google Maps",
  location_directions: "Udhëzime",
  all_locations: "Shiko të gjitha lokacionet",
  locations_prev: "Shfaq lokacionet e mëparshme",
  locations_next: "Shfaq lokacionet e ardhshme",

  // About
  about_eyebrow: "Rreth nesh",
  about_title: "Një farmaci moderne, e ndërtuar mbi besim",
  about_body:
    "Jara Pharmacy është një farmaci moderne në Prizren, e ndërtuar mbi besim, cilësi dhe kujdes profesional. Synimi ynë është t'u ofrojmë klientëve produkte të sigurta, këshillim të saktë dhe një eksperiencë të lehtë, të bukur dhe të shpejtë.",
  // Authentic tagline from the brand's social posts.
  about_quote: "Cilësi që ndjehet, kujdes që bën ndryshim.",
  about_value_quality: "Cilësi",
  about_value_trust: "Besim",
  about_value_care: "Kujdes",
  about_value_pro: "Profesionalizëm",

  // Our Pharmacy
  pharmacy_title: "Farmacia jonë",
  pharmacy_subtitle:
    "Një ambient modern, i organizuar dhe i krijuar për kujdesin dhe mirëqenien tuaj.",
  pharmacy_visit_cta: "Na vizitoni",
  pharmacy_exterior_alt: "Hyrja e JARA Pharmacy",
  pharmacy_interior_alt_1: "Ambient i brendshëm i JARA Pharmacy",
  pharmacy_interior_alt_2: "Sporteli dhe produktet në JARA Pharmacy",

  // Testimonials
  section_testimonials: "Çfarë thonë klientët",
  testimonials_subtitle: "Përvoja reale nga njerëz që na besojnë çdo ditë.",

  // Stats
  stats_title: "Jara Pharmacy në numra",
  stats_subtitle: "Rritje e qëndrueshme dhe besim që flet vetë.",

  // Blog
  section_blog: "Këshilla për shëndet dhe bukuri",
  blog_subtitle:
    "Informacione të shkurtra dhe praktike për kujdesin ndaj lëkurës, flokëve dhe mirëqenies suaj.",
  blog_prev: "Shfaq artikujt e mëparshëm",
  blog_next: "Shfaq artikujt e ardhshëm",
  min_read: "min lexim",
  article_back: "Kthehu te këshillat",
  article_related: "Produkte të përshtatshme",
  article_more: "Artikuj të ngjashëm",
  article_disclaimer_title: "Informacion",
  article_disclaimer:
    "Përmbajtja ka karakter informues dhe nuk zëvendëson këshillën, diagnozën ose trajtimin nga mjeku apo farmacisti.",

  // Contact
  section_contact: "Na kontaktoni",
  contact_title: "Le të flasim për kujdesin tuaj",
  contact_subtitle:
    "Na shkruani ose telefononi — ekipi ynë ju përgjigjet sa më shpejt.",
  contact_phone: "Telefoni",
  contact_email: "Email",
  contact_address: "Adresa",
  contact_hours: "Orari",
  contact_hours_value: "Hën–Sht: 08:00–22:00 · Diel: 09:00–20:00",
  contact_reassurance: "Ne do t'ju kontaktojmë sa më shpejt.",
  form_name: "Emri",
  form_phone: "Numri i telefonit",
  form_interest: "Produkti / Interesi",
  form_message: "Mesazhi",
  form_submit: "Dërgo kërkesën",
  form_placeholder_name: "Emri juaj i plotë",
  form_placeholder_phone: "+383 4x xxx xxx",
  form_placeholder_interest: "P.sh. Kolagjen, kujdes për lëkurë…",
  form_placeholder_message: "Si mund t'ju ndihmojmë?",
  form_selected_product: "Produkti i zgjedhur",
  form_error_name: "Ju lutemi shkruani emrin tuaj.",
  form_error_phone: "Shkruani një numër telefoni të vlefshëm.",
  form_error_message: "Shkruani një mesazh të shkurtër.",
  form_success_title: "Faleminderit!",
  form_success_body: "Kërkesa juaj u dërgua. Ne do t'ju kontaktojmë sa më shpejt.",
  form_send_another: "Dërgo një kërkesë tjetër",
  form_send_whatsapp: "Ose dërgoje menjëherë në WhatsApp",

  // Footer
  footer_description:
    "Farmaci moderne në Prizren për shëndet, bukuri dhe mirëqenie. Produkte origjinale dhe këshillim profesional.",
  footer_quicklinks: "Lidhje të shpejta",
  footer_categories: "Kategoritë",
  footer_contact: "Kontakti",
  footer_rights: "Të gjitha të drejtat e rezervuara.",
  footer_made: "Ndërtuar me kujdes për komunitetin e Prizrenit.",

  // Floating
  fab_whatsapp: "Shkruaj në WhatsApp",
};

type CopyShape = typeof al;

const en: CopyShape = {
  lang_al: "Albanian",
  lang_en: "English",
  lang_switch: "Change language",

  cta_products: "Browse products",
  cta_contact: "Contact us",
  cta_call: "Call us",
  cta_whatsapp: "Message us on WhatsApp",
  see_more: "See more",
  read_more: "Read more",
  back_to_top: "Back to top",
  open_now: "Open now",

  nav_home: "Home",
  nav_products: "Products",
  nav_categories: "Categories",
  nav_locations: "Locations",
  nav_about: "About",
  nav_blog: "Blog",
  nav_contact: "Contact",
  nav_menu: "Menu",
  nav_close: "Close",

  brand_tagline: "Care, trust and quality for your health",
  hero_eyebrow: "Pharmacy · Beauty · Wellbeing",
  hero_title: "A modern pharmacy in Prizren for health, beauty and wellbeing",
  hero_subtitle:
    "Carefully selected products for skin, hair, vitamins, supplements and daily care.",
  trust_original: "Original products",
  trust_advice: "Professional guidance",
  trust_locations: "10 locations",
  trust_family: "Family care",

  trust_eyebrow: "Why Jara Pharmacy",
  trust_title: "Trust, built every single day",
  trust_subtitle:
    "Professional care, carefully selected products and a calm experience for you and your family.",
  trust_quality_t: "Guaranteed quality",
  trust_quality_d: "Only original products from trusted brands.",
  trust_selected_t: "Carefully selected products",
  trust_selected_d: "A thoughtful selection for skin, hair and health.",
  trust_advice_t: "Professional guidance",
  trust_advice_d: "Staff ready to guide you responsibly.",
  trust_near_t: "Always near you",
  trust_near_d: "10 locations across Prizren and Rahovec, wherever you need us.",
  trust_care_t: "Care for health and beauty",
  trust_care_d: "One place for your family's everyday wellbeing.",

  categories_eyebrow: "Categories",
  categories_title: "Discover what you need",
  categories_subtitle:
    "From skincare to supplements — every category designed around your routine.",

  products_eyebrow: "Featured products",
  products_title: "Selected for you",
  products_subtitle:
    "Popular and new products from our collection. Ask about any of them in one tap.",
  product_ask: "Ask about this product",
  product_view: "View details",
  fav_add: "Add to favorites",
  fav_remove: "Remove from favorites",
  products_search: "Search products…",
  products_filter_all: "All",
  products_results_one: "{count} product",
  products_results_many: "{count} products",
  products_clear: "Clear filters",
  products_empty_title: "No products",
  products_empty: "No products matched these filters.",
  products_view_all: "View all",
  products_show_more: "Show more",
  products_prev: "Previous products",
  products_next: "Next products",
  products_all_label: "All products",
  products_filter_aria: "Filter by category",
  products_filter_prev: "Previous categories",
  products_filter_next: "Next categories",

  // Homepage curated product rows
  home_offers: "Offers",
  home_offers_sub: "Selected and promoted products.",
  home_popular: "Most Popular Products",
  home_popular_sub: "Our most requested and recommended picks.",
  home_skin_hair: "Skin & Hair Care",
  home_skin_hair_sub: "Everyday care for healthy skin and hair.",
  home_vitamins_health: "Vitamins & Health",
  home_vitamins_health_sub: "Supplements, natural products and health care.",
  home_mother_baby: "Mother & Baby",
  home_mother_baby_sub: "Gentle care for mothers and little ones.",

  // Category overview
  cat_all: "All Categories",
  cat_all_sub: "Browse the complete product catalog.",

  modal_benefits: "Benefits",
  modal_usage: "How to use",
  modal_disclaimer: "For more information, contact us.",
  modal_ask_whatsapp: "Order now",
  modal_call: "Call",
  modal_inquiry: "Send inquiry",

  section_instagram: "From our Instagram",
  social_subtitle:
    "Health and beauty inspiration, straight from our @jarapharmacy profile.",
  instagram_follow: "Follow us on Instagram",

  locations_eyebrow: "Locations",
  locations_title: "Find us across Prizren",
  locations_subtitle:
    "Ten service points across Prizren and Rahovec, all held to the same standard of care.",
  location_featured: "Main location",
  maps_open: "Open in Google Maps",
  location_directions: "Directions",
  all_locations: "View all locations",
  locations_prev: "Show previous locations",
  locations_next: "Show next locations",

  about_eyebrow: "About us",
  about_title: "A modern pharmacy, built on trust",
  about_body:
    "Jara Pharmacy is a modern pharmacy in Prizren, built on trust, quality and professional care. Our goal is to offer safe products, accurate guidance and a fast, elegant and easy customer experience.",
  about_quote: "Quality you can feel, care that makes a difference.",
  about_value_quality: "Quality",
  about_value_trust: "Trust",
  about_value_care: "Care",
  about_value_pro: "Professionalism",

  pharmacy_title: "Our Pharmacy",
  pharmacy_subtitle:
    "A modern and carefully organized environment created for your health, care, and well-being.",
  pharmacy_visit_cta: "Visit us",
  pharmacy_exterior_alt: "JARA Pharmacy storefront",
  pharmacy_interior_alt_1: "JARA Pharmacy interior",
  pharmacy_interior_alt_2: "JARA Pharmacy counter and product shelves",

  section_testimonials: "What customers say",
  testimonials_subtitle: "Real experiences from people who trust us every day.",

  stats_title: "Jara Pharmacy in numbers",
  stats_subtitle: "Steady growth and trust that speaks for itself.",

  section_blog: "Health and Beauty Tips",
  blog_subtitle:
    "Short and practical guidance for skin care, hair care and everyday well-being.",
  blog_prev: "Show previous articles",
  blog_next: "Show next articles",
  min_read: "min read",
  article_back: "Back to tips",
  article_related: "Related products",
  article_more: "Related articles",
  article_disclaimer_title: "Information",
  article_disclaimer:
    "This content is provided for informational purposes and does not replace advice, diagnosis or treatment from a doctor or pharmacist.",

  section_contact: "Get in touch",
  contact_title: "Let's talk about your care",
  contact_subtitle:
    "Write or call us — our team will get back to you as soon as possible.",
  contact_phone: "Phone",
  contact_email: "Email",
  contact_address: "Address",
  contact_hours: "Hours",
  contact_hours_value: "Mon–Sat: 08:00–22:00 · Sun: 09:00–20:00",
  contact_reassurance: "We will contact you as soon as possible.",
  form_name: "Name",
  form_phone: "Phone number",
  form_interest: "Product / Interest",
  form_message: "Message",
  form_submit: "Send inquiry",
  form_placeholder_name: "Your full name",
  form_placeholder_phone: "+383 4x xxx xxx",
  form_placeholder_interest: "e.g. Collagen, skincare…",
  form_placeholder_message: "How can we help you?",
  form_selected_product: "Selected product",
  form_error_name: "Please enter your name.",
  form_error_phone: "Enter a valid phone number.",
  form_error_message: "Please write a short message.",
  form_success_title: "Thank you!",
  form_success_body: "Your inquiry was sent. We will contact you as soon as possible.",
  form_send_another: "Send another inquiry",
  form_send_whatsapp: "Or send it instantly on WhatsApp",

  footer_description:
    "A modern pharmacy in Prizren for health, beauty and wellbeing. Original products and professional guidance.",
  footer_quicklinks: "Quick links",
  footer_categories: "Categories",
  footer_contact: "Contact",
  footer_rights: "All rights reserved.",
  footer_made: "Built with care for the Prizren community.",

  fab_whatsapp: "Message on WhatsApp",
};

export const copy: Record<Locale, CopyShape> = { al, en };
export type CopyKey = keyof CopyShape;
