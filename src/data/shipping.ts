// Relative imports on purpose: api/ loads this file too (see prices.ts).
import type { Bilingual } from "../types";
import type { ShippingMethodId } from "../types/shop";

/**
 * How an order reaches the customer, as data the pharmacy can adjust.
 *
 * `feeCents` is charged unless the subtotal reaches `freeFromCents`. Both the
 * checkout (live estimate) and the server (the amount actually charged) read
 * this table through src/lib/orderTotals.ts, so they can never disagree.
 *
 * PLACEHOLDER FEES — the pharmacy sets the real ones before go-live.
 */
export interface ShippingMethod {
  id: ShippingMethodId;
  title: Bilingual;
  description: Bilingual;
  /** Delivery fee in cents (0 for pickup). */
  feeCents: number;
  /** Subtotal (cents) from which delivery is free; omit = never free. */
  freeFromCents?: number;
  /** Rough promise shown in the checkout and the confirmation. */
  eta: Bilingual;
  /** Set to false to hide a method without deleting it. */
  enabled: boolean;
}

export const shippingMethods: ShippingMethod[] = [
  {
    id: "pickup",
    title: { al: "Merre në barnatore", en: "Pick up in a pharmacy" },
    description: {
      al: "Zgjidh një nga barnatoret tona dhe merre porosinë kur të duash.",
      en: "Choose one of our pharmacies and collect whenever it suits you.",
    },
    feeCents: 0,
    eta: { al: "Gati brenda ditës", en: "Ready the same day" },
    enabled: true,
  },
  {
    id: "prizren",
    title: { al: "Dërgesë në Prizren", en: "Delivery in Prizren" },
    description: {
      al: "Sjellim porosinë te dera juaj, kudo në Prizren.",
      en: "We bring the order to your door anywhere in Prizren.",
    },
    feeCents: 150,
    freeFromCents: 2000,
    eta: { al: "Brenda 24 orëve", en: "Within 24 hours" },
    enabled: true,
  },
  {
    id: "kosovo",
    title: { al: "Dërgesë në gjithë Kosovën", en: "Delivery across Kosovo" },
    description: {
      al: "Me postë të shpejtë, në çdo qytet të Kosovës.",
      en: "By courier, to every city in Kosovo.",
    },
    feeCents: 300,
    freeFromCents: 4000,
    eta: { al: "1–3 ditë pune", en: "1–3 working days" },
    enabled: true,
  },
];

export function shippingMethod(id: ShippingMethodId): ShippingMethod | undefined {
  return shippingMethods.find((m) => m.id === id && m.enabled);
}

/** Cities offered in the address form; anything else goes under "Tjetër". */
export const kosovoCities: string[] = [
  "Prishtinë",
  "Prizren",
  "Pejë",
  "Gjakovë",
  "Mitrovicë",
  "Ferizaj",
  "Gjilan",
  "Rahovec",
  "Suharekë",
  "Malishevë",
  "Dragash",
  "Vushtrri",
  "Podujevë",
  "Fushë Kosovë",
  "Lipjan",
  "Drenas",
  "Skenderaj",
  "Kaçanik",
  "Viti",
  "Istog",
  "Klinë",
  "Deçan",
  "Kamenicë",
  "Obiliq",
  "Shtime",
];

/** The city that gets the cheaper local delivery rate. */
export const LOCAL_CITY = "Prizren";
