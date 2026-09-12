// Relative imports on purpose: src/lib/routes.ts (and through it the build)
// loads this file, and vite.config.ts is bundled before the "@/" alias exists.
import type { Bilingual, BilingualList } from "../types";

/**
 * The information pages a card-acquiring bank looks for before it activates
 * an online shop: terms of purchase, privacy, delivery & returns. Rendered at
 * /info/<slug> by the app and written as static HTML by the build, so the
 * text is reachable without JavaScript.
 *
 * ⚠️ DRAFT — written to be complete and plausible, not legally reviewed.
 * Everything in [square brackets] must be filled in by the pharmacy, and the
 * whole text should be read by them (or their accountant/lawyer) before the
 * bank's website audit. See docs/online-payment.md.
 */
export interface LegalSection {
  title: Bilingual;
  paragraphs: BilingualList;
}

export interface LegalPage {
  slug: string;
  title: Bilingual;
  intro: Bilingual;
  /** ISO date of the last wording change, shown on the page. */
  updated: string;
  sections: LegalSection[];
  /** Drawn from src/data/shipping.ts on the delivery page. */
  showShippingTable?: boolean;
}

export const LEGAL_ENTITY = "[Emri ligjor i biznesit] — Jara Pharmacy";
export const BUSINESS_NUMBER = "[Numri i biznesit / Nr. fiskal]";
export const COURIER = "[Kompania postare partnere]";

export const legalPages: LegalPage[] = [
  {
    slug: "kushtet-e-blerjes",
    title: { al: "Kushtet e blerjes", en: "Terms of purchase" },
    intro: {
      al: "Këto kushte vlejnë për çdo porosi që bëhet përmes faqes jara-pharmacy.com. Duke dërguar një porosi, ju i pranoni ato.",
      en: "These terms apply to every order placed through jara-pharmacy.com. By placing an order you accept them.",
    },
    updated: "2026-09-12",
    sections: [
      {
        title: { al: "1. Kush jemi", en: "1. Who we are" },
        paragraphs: {
          al: [
            `Faqja jara-pharmacy.com operohet nga ${LEGAL_ENTITY}, me seli në Rr. William Vokeri, 20000 Prizren, Republika e Kosovës, ${BUSINESS_NUMBER}.`,
            "Na kontaktoni në +383 49 500 763, në jarapharm@gmail.com ose në cilëndo nga barnatoret tona në Prizren e Rahovec.",
          ],
          en: [
            `jara-pharmacy.com is operated by ${LEGAL_ENTITY}, Rr. William Vokeri, 20000 Prizren, Republic of Kosovo, ${BUSINESS_NUMBER}.`,
            "Reach us on +383 49 500 763, at jarapharm@gmail.com, or in any of our pharmacies in Prizren and Rahovec.",
          ],
        },
      },
      {
        title: { al: "2. Produktet dhe çmimet", en: "2. Products and prices" },
        paragraphs: {
          al: [
            "Online shiten vetëm produkte të kujdesit, kozmetikë, suplemente ushqimore dhe artikuj për nënë e bebe — jo barna. Për çdo barnë ju këshillojmë në barnatore.",
            "Të gjitha çmimet janë në euro (EUR) dhe përfshijnë TVSH-në. Çmimi që vlen është ai i shfaqur në momentin e porosisë. Kostoja e dërgesës shfaqet veçmas para se ta konfirmoni porosinë.",
            "Fotografitë janë ilustruese; paketimi mund të ndryshojë nga prodhuesi.",
          ],
          en: [
            "Only care products, cosmetics, food supplements and mother & baby items are sold online — no medicines. For any medicine we advise you in the pharmacy.",
            "All prices are in euro (EUR) and include VAT. The price that applies is the one shown at the time of ordering. Delivery costs are shown separately before you confirm the order.",
            "Photos are illustrative; the manufacturer may change the packaging.",
          ],
        },
      },
      {
        title: { al: "3. Porosia dhe konfirmimi", en: "3. Ordering and confirmation" },
        paragraphs: {
          al: [
            "Porosia bëhet duke shtuar produkte në shportë, duke plotësuar të dhënat e kontaktit dhe të dërgesës dhe duke zgjedhur mënyrën e pagesës. Pas dërgimit merrni një numër porosie (p.sh. JP-1042).",
            "Kontrata lidhet kur ne e konfirmojmë porosinë me telefon, WhatsApp ose email. Nëse një produkt nuk është në stok, ju njoftojmë menjëherë dhe, nëse keni paguar me kartë, shuma kthehet e plotë.",
            "Porositë online i shërbejnë vetëm personave mbi 18 vjeç.",
          ],
          en: [
            "You order by adding products to the cart, entering your contact and delivery details and choosing a payment method. After sending it you receive an order number (e.g. JP-1042).",
            "The contract is concluded when we confirm the order by phone, WhatsApp or email. If a product is out of stock we tell you immediately and, if you paid by card, refund the full amount.",
            "Online orders are for persons aged 18 or over.",
          ],
        },
      },
      {
        title: { al: "4. Pagesa", en: "4. Payment" },
        paragraphs: {
          al: [
            "Mund të paguani me kartë online (Visa, Mastercard, Apple Pay, Google Pay) ose me para në dorë kur ta merrni porosinë.",
            "Pagesa me kartë kryhet në faqen e sigurt të Raiffeisen Bank Kosovo (RaiAccept), me verifikim 3-D Secure. Ne nuk i shohim dhe nuk i ruajmë të dhënat e kartës suaj. Në pasqyrën e kartës pagesa shfaqet me emrin e barnatores.",
          ],
          en: [
            "You can pay by card online (Visa, Mastercard, Apple Pay, Google Pay) or in cash when you receive the order.",
            "Card payments take place on the secure page of Raiffeisen Bank Kosovo (RaiAccept) with 3-D Secure verification. We never see or store your card details. The payment appears on your card statement under the pharmacy's name.",
          ],
        },
      },
      {
        title: { al: "5. Dërgesa dhe kthimi", en: "5. Delivery and returns" },
        paragraphs: {
          al: [
            "Mënyrat, kostot dhe afatet e dërgesës, si dhe rregullat e kthimit, janë përshkruar në faqen „Dërgesa dhe kthimi“.",
          ],
          en: [
            "Delivery methods, costs and times, as well as the return rules, are described on the “Delivery and returns” page.",
          ],
        },
      },
      {
        title: { al: "6. Ankesat dhe ligji i zbatueshëm", en: "6. Complaints and governing law" },
        paragraphs: {
          al: [
            "Për çdo ankesë na shkruani në jarapharm@gmail.com ose në WhatsApp; përgjigjemi brenda 2 ditëve të punës.",
            "Për këto kushte zbatohet ligji i Republikës së Kosovës, përfshirë Ligjin për Mbrojtjen e Konsumatorit. Kompetente janë gjykatat e Prizrenit.",
          ],
          en: [
            "For any complaint write to jarapharm@gmail.com or on WhatsApp; we reply within 2 working days.",
            "These terms are governed by the law of the Republic of Kosovo, including the Law on Consumer Protection. The courts of Prizren have jurisdiction.",
          ],
        },
      },
    ],
  },
  {
    slug: "privatesia",
    title: { al: "Politika e privatësisë", en: "Privacy policy" },
    intro: {
      al: "Ne mbledhim vetëm të dhënat që na duhen për ta përpunuar porosinë tuaj dhe për t'ju kontaktuar — dhe asgjë më shumë.",
      en: "We collect only the data we need to process your order and to contact you — nothing more.",
    },
    updated: "2026-09-12",
    sections: [
      {
        title: { al: "1. Cilat të dhëna mbledhim", en: "1. What data we collect" },
        paragraphs: {
          al: [
            "Kur porositni: emrin, numrin e telefonit, adresën e dërgesës (ose barnatoren e zgjedhur), emailin nëse e jepni, si dhe produktet e porositura dhe shumën.",
            "Kur paguani me kartë: të dhënat e kartës i futni drejtpërdrejt në faqen e Raiffeisen Bank Kosovo (RaiAccept). Ne marrim vetëm konfirmimin e pagesës dhe katër shifrat e fundit të kartës — kurrë numrin e plotë.",
            "Kur na shkruani në WhatsApp ose telefononi, komunikimi kalon përmes shërbimit përkatës dhe rregullave të tij.",
          ],
          en: [
            "When you order: your name, phone number, delivery address (or the chosen pharmacy), your email if you provide it, plus the products ordered and the amount.",
            "When you pay by card: you enter the card details directly on the page of Raiffeisen Bank Kosovo (RaiAccept). We only receive the payment confirmation and the last four digits of the card — never the full number.",
            "When you message us on WhatsApp or call, the communication runs through that service and its rules.",
          ],
        },
      },
      {
        title: { al: "2. Përse i përdorim", en: "2. What we use it for" },
        paragraphs: {
          al: [
            "Për ta përgatitur dhe dorëzuar porosinë, për t'ju kontaktuar rreth saj, për faturim dhe për detyrimet ligjore të kontabilitetit. Nuk dërgojmë reklama dhe nuk ua shesim të dhënat askujt.",
          ],
          en: [
            "To prepare and deliver the order, to contact you about it, for invoicing and for legal accounting obligations. We send no advertising and never sell your data.",
          ],
        },
      },
      {
        title: { al: "3. Kush i sheh të dhënat", en: "3. Who sees the data" },
        paragraphs: {
          al: [
            "Stafi i barnatores që përgatit porosinë; kompania postare për adresën e dërgesës; Raiffeisen Bank Kosovo për pagesën me kartë; ofruesit teknikë që mbajnë faqen (Vercel, Neon për bazën e të dhënave, Resend për emailet e konfirmimit), të gjithë me serverë në Bashkimin Evropian.",
          ],
          en: [
            "The pharmacy staff preparing the order; the courier for the delivery address; Raiffeisen Bank Kosovo for card payments; the technical providers hosting the site (Vercel, Neon for the database, Resend for confirmation emails), all with servers in the European Union.",
          ],
        },
      },
      {
        title: { al: "4. Sa gjatë i ruajmë", en: "4. How long we keep it" },
        paragraphs: {
          al: [
            "Të dhënat e porosisë ruhen për aq kohë sa e kërkon ligji i kontabilitetit dhe i tatimeve në Kosovë; pas kësaj fshihen.",
          ],
          en: [
            "Order data is kept for as long as accounting and tax law in Kosovo requires; after that it is deleted.",
          ],
        },
      },
      {
        title: { al: "5. Cookies dhe statistika", en: "5. Cookies and statistics" },
        paragraphs: {
          al: [
            "Faqja nuk përdor cookies gjurmimi. Shporta dhe gjuha e zgjedhur ruhen vetëm në shfletuesin tuaj. Statistikat e vizitave (Vercel Analytics) janë anonime dhe pa cookies.",
          ],
          en: [
            "The site uses no tracking cookies. Your cart and language choice are stored only in your browser. Visit statistics (Vercel Analytics) are anonymous and cookie-free.",
          ],
        },
      },
      {
        title: { al: "6. Të drejtat tuaja", en: "6. Your rights" },
        paragraphs: {
          al: [
            "Sipas Ligjit për Mbrojtjen e të Dhënave Personale të Republikës së Kosovës keni të drejtë të kërkoni qasje, korrigjim ose fshirje të të dhënave tuaja. Na shkruani në jarapharm@gmail.com — përgjigjemi brenda 30 ditësh.",
          ],
          en: [
            "Under the Law on Protection of Personal Data of the Republic of Kosovo you may request access to, correction or deletion of your data. Write to jarapharm@gmail.com — we reply within 30 days.",
          ],
        },
      },
    ],
  },
  {
    slug: "dergesa-dhe-kthimi",
    title: { al: "Dërgesa dhe kthimi", en: "Delivery and returns" },
    intro: {
      al: "Merre porosinë në një nga barnatoret tona pa pagesë, ose lëre ta sjellim ne — në Prizren brenda ditës, në gjithë Kosovën me postë të shpejtë.",
      en: "Collect your order free of charge in one of our pharmacies, or let us bring it — same day in Prizren, by courier across Kosovo.",
    },
    updated: "2026-09-12",
    showShippingTable: true,
    sections: [
      {
        title: { al: "1. Mënyrat dhe kostot e dërgesës", en: "1. Delivery methods and costs" },
        paragraphs: {
          al: [
            "Kostot aktuale janë në tabelën më poshtë dhe shfaqen gjithmonë para se ta konfirmoni porosinë. Nga një shumë e caktuar dërgesa është falas.",
            `Në Prizren porosinë e sjell ekipi ynë. Në qytetet e tjera të Kosovës dërgesa bëhet përmes ${COURIER}; do t'ju telefonojmë para dorëzimit.`,
          ],
          en: [
            "Current costs are in the table below and are always shown before you confirm the order. Above a certain amount delivery is free.",
            `In Prizren our own team delivers. In other cities of Kosovo delivery is made through ${COURIER}; we call you before the handover.`,
          ],
        },
      },
      {
        title: { al: "2. Afatet", en: "2. Delivery times" },
        paragraphs: {
          al: [
            "Porositë e konfirmuara deri në orën 14:00 përgatiten të njëjtën ditë. Marrja në barnatore është e mundur brenda ditës; dërgesa në Prizren brenda 24 orëve; në qytetet e tjera 1–3 ditë pune.",
          ],
          en: [
            "Orders confirmed by 14:00 are prepared the same day. Pickup in a pharmacy is possible the same day; delivery in Prizren within 24 hours; other cities 1–3 working days.",
          ],
        },
      },
      {
        title: { al: "3. Kthimi dhe rimbursimi", en: "3. Returns and refunds" },
        paragraphs: {
          al: [
            "Mund ta ktheni një produkt brenda 14 ditëve nga marrja, nëse është i pahapur, me vulën e prodhuesit të paprekur dhe në gjendjen origjinale. Për arsye higjienike, kozmetika, suplementet dhe artikujt e kujdesit personal nuk mund të kthehen pasi të jenë hapur.",
            "Produktet e dëmtuara gjatë transportit ose të gabuara i zëvendësojmë pa asnjë kosto — na njoftoni brenda 48 orëve me një fotografi.",
            "Rimbursimi bëhet me të njëjtën mënyrë pagese: pagesat me kartë kthehen përmes bankës brenda 5–10 ditëve të punës, pagesat me para në dorë kthehen në barnatore.",
          ],
          en: [
            "You may return a product within 14 days of receipt if it is unopened, with the manufacturer's seal intact and in its original condition. For hygiene reasons cosmetics, supplements and personal-care items cannot be returned once opened.",
            "Products damaged in transit or delivered by mistake are replaced at no cost — let us know within 48 hours with a photo.",
            "Refunds go back the way you paid: card payments are returned through the bank within 5–10 working days, cash payments are refunded in the pharmacy.",
          ],
        },
      },
      {
        title: { al: "4. Si ta ktheni", en: "4. How to return" },
        paragraphs: {
          al: [
            "Na shkruani në WhatsApp ose email me numrin e porosisë, pastaj sillni produktin në cilëndo barnatore Jara ose dërgojeni me postë në adresën e barnatores kryesore.",
          ],
          en: [
            "Message us on WhatsApp or email with your order number, then bring the product to any Jara pharmacy or post it to the main pharmacy's address.",
          ],
        },
      },
    ],
  },
];

export function legalPage(slug: string): LegalPage | undefined {
  return legalPages.find((p) => p.slug === slug);
}
