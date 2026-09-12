/**
 * Shop domain types — shared by the app (cart, checkout, status page) and the
 * serverless functions in `api/`. Type-only, so both sides can import it.
 */

/** How the order reaches the customer. Fees live in src/data/shipping.ts. */
export type ShippingMethodId = "pickup" | "prizren" | "kosovo";

export type PaymentMethod = "card" | "cash";

/**
 * Order lifecycle. Cash orders start at `new`; card orders wait in
 * `pending_payment` until the gateway confirms (`paid`) or declines
 * (`payment_failed`, from where a new payment can be started).
 */
export type OrderStatus =
  | "new"
  | "pending_payment"
  | "paid"
  | "payment_failed"
  | "cancelled"
  | "done";

/** One product with a price, as maintained in src/data/prices.ts. */
export interface ShopPrice {
  /** Retail price in EUR incl. VAT. */
  price: number;
  /** Previous price for offers (struck through). */
  oldPrice?: number;
  /**
   * Product name repeated here on purpose: the pharmacy edits this file, and
   * an id like "shemo-7367" says nothing to them. The server also uses it for
   * the order lines, so it never has to load the whole catalog.
   */
  name: string;
}

/** What the cart stores — nothing but ids and quantities. */
export interface CartItem {
  id: string;
  qty: number;
}

/** A priced order line, computed on the server from the price list. */
export interface OrderLine {
  id: string;
  name: string;
  qty: number;
  unitCents: number;
}

export interface OrderCustomer {
  name: string;
  phone: string;
  email?: string;
}

export type OrderFulfilment =
  | { method: "pickup"; branchId: string }
  | { method: "prizren" | "kosovo"; street: string; city: string; note?: string };

export interface OrderTotals {
  subtotalCents: number;
  deliveryCents: number;
  totalCents: number;
  currency: "EUR";
}

/** What the browser sends to POST /api/orders. */
export interface CreateOrderRequest {
  locale: "al" | "en";
  items: CartItem[];
  customer: OrderCustomer;
  fulfilment: OrderFulfilment;
  paymentMethod: PaymentMethod;
  acceptTerms: boolean;
  /** Honeypot — must stay empty; bots fill every field. */
  website?: string;
}

export interface CreateOrderResponse {
  id: string;
  number: string;
  /** Present for card payments: where to send the customer next. */
  paymentUrl?: string;
}

/** The public view of an order, as returned by GET /api/orders/<id>. */
export interface OrderView {
  id: string;
  number: string;
  status: OrderStatus;
  locale: "al" | "en";
  customer: OrderCustomer;
  fulfilment: OrderFulfilment;
  items: OrderLine[];
  totals: OrderTotals;
  paymentMethod: PaymentMethod;
  createdAt: string;
  paidAt?: string;
}
