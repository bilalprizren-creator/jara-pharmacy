import type { Bilingual } from "@/types";

/**
 * Single source of truth for verifiable brand + contact data.
 * All values are taken from the brand references / official profile snippets.
 * A backend or CMS can later hydrate/override this object.
 */
export const brand = {
  name: "Jara Pharmacy",
  legalCity: "Prizren",
  country: "Kosovo",
  slogan: { al: "Cilësi. Besim. Kujdes.", en: "Quality. Trust. Care." } satisfies Bilingual,

  // Mind the hyphen. jarapharmacy.com without it is NOT ours — it belongs to a
  // third party and forwards to shemofarm.com. Our live site is
  // jara-pharmacy.com. Never advertise the hyphen-less spelling.
  website: "jara-pharmacy.com",
  websiteUrl: "https://jara-pharmacy.com",
  email: "jarapharm@gmail.com",

  instagramHandle: "jarapharmacy",
  instagramUrl: "https://www.instagram.com/jarapharmacy",
  facebookUrl: "https://www.facebook.com/jarapharm",

  /** Primary WhatsApp / call number (E.164, no spaces). */
  phonePrimary: {
    label: "+383 49 500 763",
    e164: "38349500763",
  },
  phoneSecondary: {
    label: "+383 48 550 002",
    e164: "38348550002",
  },

  /** Address shown in contact sections (screenshot-primary form). */
  address: {
    street: "Rr. William Vokeri",
    city: "Prizren",
    country: "Kosovo",
    postalCode: "20000",
    full: "Rr. William Vokeri, Prizren, Kosovo, 20000",
  },

  /** Public custom map of all branches (from the Instagram bio link). */
  allLocationsMapUrl: "https://www.google.com/maps/search/Jara+Pharmacy+Prizren",
} as const;

export type Brand = typeof brand;
