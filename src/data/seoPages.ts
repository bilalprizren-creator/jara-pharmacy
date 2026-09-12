// Relative, not "@/": vite/seo/render.ts writes this same copy into the
// generated static pages, and vite.config.ts is bundled before Vite's
// `resolve.alias` exists. See the note in src/lib/routes.ts.
import { brand } from "./brand";
import { branchShortName } from "../lib/branches";
import type { Bilingual, Locale, Location } from "@/types";

/**
 * The text of the branches hub (/barnatore-ne-prizren) and of the branch pages
 * (/lokacionet/<id>), in both languages.
 *
 * It lives here rather than in the components because two things render it:
 * the app (sections/RouteHero) and the build (vite/seo/render.ts), which
 * writes the Albanian version into each page's static HTML. One source keeps
 * what the crawler reads identical to what the visitor sees.
 */

export interface FaqItem {
  q: Bilingual;
  a: Bilingual;
}

/** Opening paragraphs of the hub — the "barnatore në Prizren" page. */
export const hubIntro: Bilingual[] = [
  {
    al: "Jara Pharmacy është rrjeti më i madh i barnatoreve në Prizren: njëmbëdhjetë barnatore në qytet dhe rrethinë — te Galeria Shopping Mall në Rrugën Tirana, në Bazhdarhane, në Jeni Mahalla, në Landovicë dhe deri në Xërxë të Rahovecit. Kudo që të ndodheni, një barnatore Jara është vetëm pak minuta larg.",
    en: "Jara Pharmacy is the largest pharmacy network in Prizren: eleven pharmacies across the city and its surroundings — at Galeria Shopping Mall on Rruga Tirana, in Bazhdarhane, in Jeni Mahalla, in Landovicë and out to Xërxë near Rahovec. Wherever you are, a Jara pharmacy is only minutes away.",
  },
  {
    al: "Të gjitha barnatoret punojnë me të njëjtin standard: farmacistë me përvojë, produkte origjinale nga prodhues të licencuar, kozmetikë dermatologjike, vitamina e suplemente dhe kujdes për nënë e bebe. Jemi hapur çdo ditë deri në orën 22:00 — të dielën deri në 20:00 — dhe për çdo pyetje na shkruani në WhatsApp.",
    en: "Every branch works to the same standard: experienced pharmacists, original products from licensed manufacturers, dermatological cosmetics, vitamins and supplements, and mother-and-baby care. We are open every day until 22:00 — Sundays until 20:00 — and for any question you can message us on WhatsApp.",
  },
];

/** The questions people actually type next to "barnatore Prizren". */
export const hubFaq: FaqItem[] = [
  {
    q: {
      al: "Cila barnatore Jara është më afër qendrës së Prizrenit?",
      en: "Which Jara pharmacy is closest to the centre of Prizren?",
    },
    a: {
      al: "Në qendër ju shërbejnë Jara Pharmacy 10 në Rr. Shuaip Spahiu dhe Jara Pharmacy 9 në Rr. Reshat Karjagdiu; Jara Pharmacy 2 në Bazhdarhane dhe Jara Pharmacy 7 në Rr. Qazim Berisha janë disa minuta në këmbë. Në listën më lart e gjeni secilën me adresë dhe hartë.",
      en: "Closest to the centre are Jara Pharmacy 10 on Rr. Shuaip Spahiu and Jara Pharmacy 9 on Rr. Reshat Karjagdiu; Jara Pharmacy 2 in Bazhdarhane and Jara Pharmacy 7 on Rr. Qazim Berisha are a few minutes' walk away. The list above has each one with its address and map.",
    },
  },
  {
    q: {
      al: "A janë barnatoret Jara të hapura të dielën?",
      en: "Are Jara pharmacies open on Sundays?",
    },
    a: {
      al: "Po. Nga e hëna deri të shtunën punojmë 08:00–22:00 dhe të dielën 09:00–20:00. Orari i secilës barnatore është edhe në faqen e saj.",
      en: "Yes. Monday to Saturday we are open 08:00–22:00 and on Sundays 09:00–20:00. Each pharmacy's hours are also on its own page.",
    },
  },
  {
    q: {
      al: "A mund të porosis me WhatsApp?",
      en: "Can I order via WhatsApp?",
    },
    a: {
      al: `Po. Na shkruani në WhatsApp me emrin e produktit dhe ju përgjigjemi me disponueshmërinë dhe çmimin; produktin e merrni në barnatoren që ju përshtatet më shumë. Numri: ${brand.phonePrimary.label}.`,
      en: `Yes. Message us on WhatsApp with the product name and we reply with availability and price; you collect the product at whichever pharmacy suits you. Number: ${brand.phonePrimary.label}.`,
    },
  },
  {
    q: {
      al: "A lëshoni barna me recetë?",
      en: "Do you dispense prescription medicines?",
    },
    a: {
      al: "Po. Të gjitha barnatoret Jara lëshojnë barna me recetë dhe pa recetë. Sillni recetën e mjekut dhe farmacistët tanë ju këshillojnë për dozimin dhe përdorimin e sigurt.",
      en: "Yes. Every Jara pharmacy dispenses prescription and over-the-counter medicines. Bring your doctor's prescription and our pharmacists will advise you on dosage and safe use.",
    },
  },
  {
    q: {
      al: "Çfarë gjej te Jara përveç barnave?",
      en: "What else do you carry besides medicines?",
    },
    a: {
      al: "Kujdes për lëkurën dhe kozmetikë dermatologjike, vitamina e suplemente, kolagjen, produkte për nënë e bebe, kujdes për flokë, kujdes oral dhe pajisje mjekësore — të gjitha origjinale, nga prodhues të licencuar. Kategoritë i shfletoni në faqen kryesore.",
      en: "Skincare and dermatological cosmetics, vitamins and supplements, collagen, mother-and-baby products, hair care, oral care and medical devices — all original, from licensed manufacturers. Browse the categories on the homepage.",
    },
  },
  {
    q: {
      al: "A keni barnatore edhe jashtë Prizrenit?",
      en: "Do you have a pharmacy outside Prizren?",
    },
    a: {
      al: "Po — Jara Pharmacy 4 ndodhet në QTX, Rr. Egzodi 99, në Xërxë të Rahovecit, dhe Jara Pharmacy 5 te Transiti në Landovicë, në hyrje të Prizrenit. Secila barnatore ka numrin e vet të telefonit; e gjeni në faqen e saj.",
      en: "Yes — Jara Pharmacy 4 is at QTX, Rr. Egzodi 99, in Xërxë near Rahovec, and Jara Pharmacy 5 at Transiti in Landovicë, at the entrance to Prizren. Every pharmacy has its own phone number; you will find it on its page.",
    },
  },
];

/** The paragraph under a branch page's heading. */
export function branchIntro(branch: Location, locale: Locale): string {
  const name = branchShortName(branch);
  return locale === "al"
    ? `${name} është barnatorja jonë në ${branch.address}. Këtu ju presin farmacistë me përvojë, barna me dhe pa recetë, kozmetikë dermatologjike, vitamina e suplemente dhe kujdes për nënë e bebe — me të njëjtin standard si në të gjitha barnatoret Jara.`
    : `${name} is our pharmacy at ${branch.address}. Experienced pharmacists, prescription and over-the-counter medicines, dermatological cosmetics, vitamins and supplements and mother-and-baby care await you — the same standard as in every Jara pharmacy.`;
}
