// Relative imports on purpose: api/ prices every order through this module,
// and the serverless bundle has no "@/" alias (see src/lib/routes.ts).
import { shopPrices } from "../data/prices";
import { LOCAL_CITY, shippingMethod } from "../data/shipping";
import { toCents } from "./money";
import type {
  CartItem,
  OrderFulfilment,
  OrderLine,
  OrderTotals,
  ShippingMethodId,
} from "../types/shop";

export const MAX_QTY_PER_LINE = 10;

/**
 * Turn cart items into priced lines using the price list only. Unknown ids
 * are dropped (a product that lost its price while sitting in someone's
 * cart) and quantities are clamped, so the result is always sellable.
 */
export function priceLines(items: CartItem[]): OrderLine[] {
  const lines: OrderLine[] = [];
  for (const item of items) {
    const entry = shopPrices[item.id];
    const qty = Math.floor(Number(item.qty));
    if (!entry || !Number.isFinite(qty) || qty < 1) continue;
    lines.push({
      id: item.id,
      name: entry.name,
      qty: Math.min(qty, MAX_QTY_PER_LINE),
      unitCents: toCents(entry.price),
    });
  }
  return lines;
}

export function subtotalOf(lines: OrderLine[]): number {
  return lines.reduce((sum, l) => sum + l.unitCents * l.qty, 0);
}

/** Delivery fee for a method at a given subtotal, honouring "free from". */
export function deliveryFee(method: ShippingMethodId, subtotalCents: number): number {
  const m = shippingMethod(method);
  if (!m) return 0;
  if (m.freeFromCents != null && subtotalCents >= m.freeFromCents) return 0;
  return m.feeCents;
}

export function computeTotals(lines: OrderLine[], method: ShippingMethodId): OrderTotals {
  const subtotalCents = subtotalOf(lines);
  const deliveryCents = deliveryFee(method, subtotalCents);
  return {
    subtotalCents,
    deliveryCents,
    totalCents: subtotalCents + deliveryCents,
    currency: "EUR",
  };
}

/**
 * The delivery method a fulfilment implies. A Prizren address always gets the
 * local rate whatever the form said — nobody should pay the nationwide fee
 * for a delivery across town.
 */
export function methodFor(fulfilment: OrderFulfilment): ShippingMethodId {
  if (fulfilment.method === "pickup") return "pickup";
  return fulfilment.city.trim().toLowerCase() === LOCAL_CITY.toLowerCase() ? "prizren" : "kosovo";
}
