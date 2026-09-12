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
  hero_eyebrow: "Barnatore · Bukuri · Mirëqenie",
  hero_title: "Barnatore moderne në Prizren për shëndet, bukuri dhe mirëqenie",
  hero_subtitle:
    "Produkte të zgjedhura për lëkurë, flokë, vitamina, suplemente dhe kujdes të përditshëm.",
  trust_original: "Produkte origjinale",
  trust_advice: "Këshillim profesional",
  trust_locations: "12 lokacione",
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
  trust_near_d:
    "Rrjeti ynë i barnatoreve në Prizren e Rahovec — 12 lokacione, kudo ku ju nevojitet.",
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
  home_vitamins_health: "Vitamina dhe shëndet",
  home_vitamins_health_sub: "Vitamina, suplemente dhe produkte natyrale.",
  home_mother_baby: "Nënë dhe bebe",
  home_mother_baby_sub: "Kujdes i butë për nënat dhe të vegjlit.",

  // Category overview
  cat_all: "Të gjitha kategoritë",
  cat_all_sub: "Shfleto të gjithë katalogun e produkteve.",

  // Product modal
  modal_benefits: "Përfitimet",
  modal_usage: "Sugjerim përdorimi",
  modal_disclaimer: "Për më shumë informacione, na kontaktoni.",
  modal_ask_whatsapp: "Porosit Tani",
  modal_call: "Telefono",
  modal_inquiry: "Dërgo kërkesë",

  // Social
  section_instagram: "Nga Instagrami ynë",
  social_subtitle:
    "Frymëzim për shëndet dhe bukuri, drejt nga profili ynë @jarapharmacy.",
  instagram_follow: "Na ndiq në Instagram",

  // Locations
  locations_eyebrow: "Lokacionet",
  locations_title: "Barnatore në Prizren — na gjeni kudo",
  locations_subtitle:
    "Barnatoret tona në Prizren e Rahovec — dymbëdhjetë pika shërbimi, të gjitha me të njëjtin standard kujdesi.",
  location_featured: "Lokacioni kryesor",
  maps_open: "Hap në Google Maps",
  location_directions: "Udhëzime",
  all_locations: "Shiko të gjitha lokacionet",
  locations_prev: "Shfaq lokacionet e mëparshme",
  locations_next: "Shfaq lokacionet e ardhshme",
  locations_map_aria: "Harta interaktive e të gjitha degëve Jara Pharmacy",
  locations_map_loading: "Duke ngarkuar hartën…",
  locations_map_legend_pharmacy: "Farmaci",
  locations_map_legend_depo: "Depo (jo për klientë)",

  // Branch pages (/lokacionet/<id>) and the hub (/barnatore-ne-prizren)
  route_branch_eyebrow: "Barnatore në {city}",
  route_hub_title: "Barnatore në Prizren — Jara Pharmacy",
  route_whatsapp: "Pyet në WhatsApp",
  route_call: "Telefono",
  route_map_cta: "Shiko hartën e lokacioneve",
  route_nearby_eyebrow: "Në afërsi",
  route_nearby_title: "Barnatore të tjera Jara afër",
  route_distance: "{km} km larg",
  route_all_branches: "Të gjitha barnatoret në Prizren",
  route_branches_eyebrow: "Lokacionet",
  route_branches_title: "Të gjitha barnatoret Jara",
  route_branches_subtitle:
    "Zgjidhni barnatoren më të afërt — secila ka faqen e vet me adresë, orar dhe telefon.",
  route_view_branch: "Shiko barnatoren",
  route_faq_eyebrow: "Pyetje të shpeshta",
  route_faq_title: "Pyetjet që na bëni më shpesh",

  // About
  about_eyebrow: "Rreth nesh",
  about_title: "Një barnatore moderne në Prizren, e ndërtuar mbi besim",
  about_body:
    "Jara Pharmacy është barnatore moderne në Prizren, e ndërtuar mbi besim, cilësi dhe kujdes profesional. Synimi ynë është t'u ofrojmë klientëve produkte të sigurta, këshillim të saktë dhe një eksperiencë të lehtë, të bukur dhe të shpejtë në secilën nga farmacitë tona.",
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
  // Short weekday labels — @/lib/hours builds each branch's opening-hours line
  // from these, so the visible text matches the structured data Google reads.
  day_monday: "Hën",
  day_tuesday: "Mar",
  day_wednesday: "Mër",
  day_thursday: "Enj",
  day_friday: "Pre",
  day_saturday: "Sht",
  day_sunday: "Die",
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
  footer_all_branches: "Barnatore në Prizren",
  footer_categories: "Kategoritë",
  footer_contact: "Kontakti",
  footer_rights: "Të gjitha të drejtat e rezervuara.",
  footer_made: "Ndërtuar me kujdes për komunitetin e Prizrenit.",

  // Floating
  fab_whatsapp: "Shkruaj në WhatsApp",

  // Shop — cart
  cart_title: "Shporta",
  cart_open: "Hap shportën",
  cart_add: "Shto në shportë",
  cart_added: "U shtua në shportë",
  cart_empty_title: "Shporta është bosh",
  cart_empty:
    "Shto produkte me çmim dhe porosit online — për çdo produkt tjetër na pyet në WhatsApp.",
  cart_qty: "Sasia",
  cart_qty_minus: "Më pak",
  cart_qty_plus: "Më shumë",
  cart_remove: "Hiq nga shporta",
  cart_subtotal: "Nëntotali",
  cart_delivery_note: "Kostoja e dërgesës llogaritet në hapin tjetër.",
  cart_checkout: "Vazhdo te porosia",
  cart_continue: "Vazhdo blerjen",
  cart_count_one: "{count} produkt",
  cart_count_many: "{count} produkte",
  price_was: "Më parë",

  // Shop — checkout (/porosia)
  checkout_eyebrow: "Porosia online",
  checkout_title: "Përfundo porosinë",
  checkout_subtitle:
    "Tre hapa të shkurtër: shporta, të dhënat, pagesa. Paguan me kartë online ose me para në dorë.",
  checkout_step_cart: "Shporta",
  checkout_step_details: "Të dhënat dhe dërgesa",
  checkout_step_payment: "Pagesa",
  checkout_name: "Emri dhe mbiemri",
  checkout_phone: "Numri i telefonit",
  checkout_email: "Email (opsionale)",
  checkout_email_hint: "Për konfirmimin e porosisë.",
  checkout_delivery_title: "Si dëshiron ta marrësh?",
  checkout_branch: "Barnatorja",
  checkout_branch_placeholder: "Zgjidh barnatoren",
  checkout_street: "Rruga dhe numri",
  checkout_city: "Qyteti",
  checkout_city_other: "Tjetër",
  checkout_note: "Shënim për dërgesën (opsionale)",
  checkout_note_placeholder: "P.sh. kati, hyrja, ora e përshtatshme…",
  checkout_payment_title: "Si dëshiron të paguash?",
  checkout_pay_card: "Kartë online",
  checkout_pay_card_sub:
    "Visa, Mastercard, Apple Pay, Google Pay — pagesë e sigurt përmes Raiffeisen Bank.",
  checkout_pay_cash: "Para në dorë",
  checkout_pay_cash_sub: "Paguan kur ta marrësh porosinë — në barnatore ose te dera.",
  checkout_terms: "Pranoj kushtet e blerjes dhe politikën e privatësisë.",
  checkout_summary: "Përmbledhja",
  checkout_delivery: "Dërgesa",
  checkout_free: "Falas",
  checkout_free_from: "Falas nga {amount}",
  checkout_total: "Totali",
  checkout_vat: "Çmimet përfshijnë TVSH-në.",
  checkout_submit_card: "Paguaj tani",
  checkout_submit_cash: "Dërgo porosinë",
  checkout_submitting: "Duke dërguar…",
  checkout_secure:
    "Pagesa kryhet në faqen e sigurt të bankës. Ne nuk i shohim dhe nuk i ruajmë të dhënat e kartës.",
  checkout_error_name: "Ju lutemi shkruani emrin tuaj.",
  checkout_error_phone: "Shkruani një numër telefoni të vlefshëm.",
  checkout_error_email: "Shkruani një email të vlefshëm.",
  checkout_error_branch: "Zgjidhni një barnatore.",
  checkout_error_street: "Shkruani adresën.",
  checkout_error_city: "Zgjidhni qytetin.",
  checkout_error_terms: "Duhet të pranoni kushtet e blerjes.",
  checkout_error_generic: "Diçka shkoi keq. Provoni përsëri ose na shkruani në WhatsApp.",
  checkout_error_unavailable:
    "Porositë online nuk janë aktivizuar ende në këtë faqe. Na shkruani në WhatsApp — ju përgjigjemi menjëherë.",
  checkout_error_too_many: "Shumë porosi brenda pak minutash. Ju lutemi provoni pak më vonë.",
  checkout_error_empty: "Shporta është bosh.",
  checkout_back: "Kthehu te produktet",

  // Shop — order status (/porosia/<id>)
  order_number: "Porosia",
  order_paid_title: "Pagesa u krye me sukses!",
  order_paid_body:
    "Faleminderit! Porosia juaj është paguar dhe po përgatitet. Do t'ju kontaktojmë për dorëzimin.",
  order_new_title: "Porosia u pranua!",
  order_new_body:
    "Faleminderit! Do t'ju telefonojmë për ta konfirmuar porosinë. Pagesa bëhet kur ta merrni.",
  order_pending_title: "Po e verifikojmë pagesën…",
  order_pending_body: "Kjo zgjat vetëm disa sekonda. Mos e mbyllni faqen.",
  order_failed_title: "Pagesa nuk u krye",
  order_failed_body:
    "Karta u refuzua ose pagesa u ndërpre. Mund të provoni përsëri, ose na shkruani që ta paguani me para në dorë.",
  order_cancelled_title: "Pagesa u anulua",
  order_cancelled_body: "Asgjë nuk është paguar. Mund ta provoni përsëri kur të doni.",
  order_stale_title: "Pagesa ende nuk është konfirmuar",
  order_stale_body:
    "Nuk kemi marrë ende konfirmim nga banka. Nëse e keni mbyllur faqen e pagesës, provoni përsëri; nëse keni paguar, na shkruani në WhatsApp dhe e kontrollojmë menjëherë.",
  order_retry: "Provo përsëri pagesën",
  order_not_found_title: "Porosia nuk u gjet",
  order_not_found_body:
    "Kontrolloni lidhjen ose na shkruani në WhatsApp me numrin e porosisë.",
  order_items: "Produktet",
  order_customer: "Të dhënat",
  order_pickup_at: "Merret në",
  order_delivery_to: "Dërgohet te",
  order_payment: "Pagesa",
  order_payment_card: "Kartë online",
  order_payment_cash: "Para në dorë",
  order_whatsapp: "Pyet për këtë porosi",
  order_whatsapp_message: "Përshëndetje Jara Pharmacy, po shkruaj për porosinë {number}.",
  order_back: "Kthehu te produktet",
  order_status_paid: "E paguar",
  order_status_new: "E pranuar",
  order_status_pending: "Në pritje të pagesës",
  order_status_failed: "Pagesa dështoi",
  order_status_cancelled: "E anuluar",
  order_status_done: "E përfunduar",

  // Legal / info pages and the footer strip
  legal_eyebrow: "Informacione",
  legal_back: "Kthehu në ballinë",
  legal_updated: "Përditësuar më {date}",
  legal_method: "Mënyra",
  legal_fee: "Kostoja",
  legal_eta: "Afati",
  footer_legal: "Informacione",
  footer_payments: "Pagesa të sigurta me kartë",
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
  trust_locations: "12 locations",
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
  trust_near_d: "12 locations across Prizren and Rahovec, wherever you need us.",
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
  home_vitamins_health: "Vitamins & Health",
  home_vitamins_health_sub: "Vitamins, supplements and natural products.",
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
    "Twelve service points across Prizren and Rahovec, all held to the same standard of care.",
  location_featured: "Main location",
  maps_open: "Open in Google Maps",
  location_directions: "Directions",
  all_locations: "View all locations",
  locations_prev: "Show previous locations",
  locations_next: "Show next locations",
  locations_map_aria: "Interactive map of all Jara Pharmacy branches",
  locations_map_loading: "Loading map…",
  locations_map_legend_pharmacy: "Pharmacy branch",
  locations_map_legend_depo: "Depot (not customer-facing)",

  route_branch_eyebrow: "Pharmacy in {city}",
  route_hub_title: "Pharmacies in Prizren — Jara Pharmacy",
  route_whatsapp: "Ask on WhatsApp",
  route_call: "Call",
  route_map_cta: "See the map of locations",
  route_nearby_eyebrow: "Nearby",
  route_nearby_title: "Other Jara pharmacies nearby",
  route_distance: "{km} km away",
  route_all_branches: "All pharmacies in Prizren",
  route_branches_eyebrow: "Locations",
  route_branches_title: "All Jara pharmacies",
  route_branches_subtitle:
    "Pick the pharmacy nearest to you — each has its own page with address, hours and phone.",
  route_view_branch: "View pharmacy",
  route_faq_eyebrow: "FAQ",
  route_faq_title: "The questions we hear most",

  about_eyebrow: "About us",
  about_title: "A modern pharmacy in Prizren, built on trust",
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
  day_monday: "Mon",
  day_tuesday: "Tue",
  day_wednesday: "Wed",
  day_thursday: "Thu",
  day_friday: "Fri",
  day_saturday: "Sat",
  day_sunday: "Sun",
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
  footer_all_branches: "Pharmacies in Prizren",
  footer_categories: "Categories",
  footer_contact: "Contact",
  footer_rights: "All rights reserved.",
  footer_made: "Built with care for the Prizren community.",

  fab_whatsapp: "Message on WhatsApp",

  cart_title: "Cart",
  cart_open: "Open cart",
  cart_add: "Add to cart",
  cart_added: "Added to cart",
  cart_empty_title: "Your cart is empty",
  cart_empty:
    "Add priced products and order online — for anything else, ask us on WhatsApp.",
  cart_qty: "Quantity",
  cart_qty_minus: "Fewer",
  cart_qty_plus: "More",
  cart_remove: "Remove from cart",
  cart_subtotal: "Subtotal",
  cart_delivery_note: "Delivery cost is calculated in the next step.",
  cart_checkout: "Go to checkout",
  cart_continue: "Continue shopping",
  cart_count_one: "{count} item",
  cart_count_many: "{count} items",
  price_was: "Was",

  checkout_eyebrow: "Online order",
  checkout_title: "Complete your order",
  checkout_subtitle:
    "Three short steps: cart, details, payment. Pay by card online or in cash.",
  checkout_step_cart: "Cart",
  checkout_step_details: "Details and delivery",
  checkout_step_payment: "Payment",
  checkout_name: "Full name",
  checkout_phone: "Phone number",
  checkout_email: "Email (optional)",
  checkout_email_hint: "For your order confirmation.",
  checkout_delivery_title: "How would you like to receive it?",
  checkout_branch: "Pharmacy",
  checkout_branch_placeholder: "Choose a pharmacy",
  checkout_street: "Street and number",
  checkout_city: "City",
  checkout_city_other: "Other",
  checkout_note: "Delivery note (optional)",
  checkout_note_placeholder: "e.g. floor, entrance, best time…",
  checkout_payment_title: "How would you like to pay?",
  checkout_pay_card: "Card online",
  checkout_pay_card_sub:
    "Visa, Mastercard, Apple Pay, Google Pay — secure payment via Raiffeisen Bank.",
  checkout_pay_cash: "Cash",
  checkout_pay_cash_sub: "Pay when you receive the order — in the pharmacy or at your door.",
  checkout_terms: "I accept the terms of purchase and the privacy policy.",
  checkout_summary: "Summary",
  checkout_delivery: "Delivery",
  checkout_free: "Free",
  checkout_free_from: "Free from {amount}",
  checkout_total: "Total",
  checkout_vat: "Prices include VAT.",
  checkout_submit_card: "Pay now",
  checkout_submit_cash: "Place order",
  checkout_submitting: "Sending…",
  checkout_secure:
    "Payment happens on the bank's secure page. We never see or store your card details.",
  checkout_error_name: "Please enter your name.",
  checkout_error_phone: "Enter a valid phone number.",
  checkout_error_email: "Enter a valid email address.",
  checkout_error_branch: "Choose a pharmacy.",
  checkout_error_street: "Enter your address.",
  checkout_error_city: "Choose your city.",
  checkout_error_terms: "You need to accept the terms of purchase.",
  checkout_error_generic: "Something went wrong. Try again or message us on WhatsApp.",
  checkout_error_unavailable:
    "Online orders are not switched on for this site yet. Message us on WhatsApp — we reply right away.",
  checkout_error_too_many: "Too many orders within a few minutes. Please try again a little later.",
  checkout_error_empty: "Your cart is empty.",
  checkout_back: "Back to products",

  order_number: "Order",
  order_paid_title: "Payment successful!",
  order_paid_body:
    "Thank you! Your order is paid and being prepared. We will contact you about the handover.",
  order_new_title: "Order received!",
  order_new_body:
    "Thank you! We will call you to confirm the order. You pay when you receive it.",
  order_pending_title: "Verifying your payment…",
  order_pending_body: "This only takes a few seconds. Please keep this page open.",
  order_failed_title: "Payment not completed",
  order_failed_body:
    "The card was declined or the payment was interrupted. You can try again, or message us to pay in cash instead.",
  order_cancelled_title: "Payment cancelled",
  order_cancelled_body: "Nothing was charged. You can try again whenever you like.",
  order_stale_title: "Payment not confirmed yet",
  order_stale_body:
    "We have not received a confirmation from the bank yet. If you closed the payment page, try again; if you did pay, message us on WhatsApp and we will check right away.",
  order_retry: "Try the payment again",
  order_not_found_title: "Order not found",
  order_not_found_body: "Check the link, or message us on WhatsApp with your order number.",
  order_items: "Items",
  order_customer: "Details",
  order_pickup_at: "Pick up at",
  order_delivery_to: "Deliver to",
  order_payment: "Payment",
  order_payment_card: "Card online",
  order_payment_cash: "Cash",
  order_whatsapp: "Ask about this order",
  order_whatsapp_message: "Hello Jara Pharmacy, I am writing about order {number}.",
  order_back: "Back to products",
  order_status_paid: "Paid",
  order_status_new: "Received",
  order_status_pending: "Awaiting payment",
  order_status_failed: "Payment failed",
  order_status_cancelled: "Cancelled",
  order_status_done: "Completed",

  legal_eyebrow: "Information",
  legal_back: "Back to the homepage",
  legal_updated: "Updated on {date}",
  legal_method: "Method",
  legal_fee: "Cost",
  legal_eta: "Time",
  footer_legal: "Information",
  footer_payments: "Secure card payments",
};

export const copy: Record<Locale, CopyShape> = { al, en };
export type CopyKey = keyof CopyShape;
