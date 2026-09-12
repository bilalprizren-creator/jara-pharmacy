// Relative, not "@/": the serverless functions in api/ import this file to
// price every order on the server, and they are bundled without Vite's alias.
import type { ShopPrice } from "../types/shop";

/**
 * The shop's price list — the only place a price is entered.
 *
 * A product is buyable online exactly when its id appears here; every other
 * product keeps the inquiry-only buttons ("Pyet për këtë produkt"). The app
 * shows these prices on the cards, and the server recomputes every order
 * from this same list, so nothing the browser sends can change a total.
 *
 * Prices are in EUR, VAT included, as printed on the shelf.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │  PLACEHOLDER PRICES — pilot. Every value below was estimated from    │
 * │  comparable ALBTRIX list prices and MUST be replaced by the pharmacy │
 * │  before the shop goes live (see docs/online-payment.md, go-live).    │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export const shopPrices: Record<string, ShopPrice> = {
  // Homepage "Oferta" row (src/data/homepage.ts → OFFER_IDS)
  "shemo-7367": { name: "Collagen Beauty 20eff (Ivy Bear)", price: 14.9, oldPrice: 17.9 },
  "shemo-0477": { name: "Nature Collagen Powder 240g (Ivy Bear)", price: 29.9, oldPrice: 34.9 },
  "shemo-7603": { name: "Gummy monsters vitamin C A60 (Ivy Bear)", price: 9.9 },
  "shemo-2070C": { name: "Vaseline Advanced Repair Body Lotion 400ml", price: 6.9, oldPrice: 7.9 },
  "shemo-3093": { name: "Labello SPF 15 Hydro Care 4.8g", price: 2.6 },
  "shemo-7765": { name: "Froika Anti-spot cream with Vitamin C SPF15 30ml", price: 17.9, oldPrice: 19.9 },
  "shemo-7656": { name: "Oral-B Brush Pro Extra Soft", price: 3.9 },
  "shemo-5208": { name: "Black Cumin Seed Oil 250ml (Balen)", price: 8.9 },
  "shemo-5172": { name: "Vaj ulliri extra virgin 250ml", price: 7.5, oldPrice: 8.9 },
};

/** Ids of every product that can be bought online. */
export const shopProductIds: string[] = Object.keys(shopPrices);
