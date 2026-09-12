import type { OrderRecord } from "./db";
import { HttpError } from "./http";

/**
 * RaiAccept — Raiffeisen Bank Kosovo's card gateway (docs.raiaccept.com).
 *
 * Three calls make a payment: log in for a bearer token, create the order
 * entry, create the checkout session that yields the hosted payment page's
 * URL. Afterwards the result arrives twice — as a webhook, and by asking the
 * API — and only the API answer is trusted (the docs say so too).
 *
 * The sandbox and production environments share these URLs; the credentials
 * decide which one answers. `RAIACCEPT_MODE=mock` never talks to the bank at
 * all: it points the customer at api/payments/mock, a local stand-in for the
 * payment page, so the whole flow can be exercised without an account.
 */

const AUTH_URL = "https://auth.raiaccept.com/auth/api/login";
const API_URL = "https://trapi.raiaccept.com";
const INTEGRATION = { type: "CODE", data: { name: "Jara Pharmacy", version: "1.0.0", vendor: "jara-pharmacy.com" } };

export type Mode = "mock" | "sandbox" | "production";

export function mode(): Mode {
  const value = process.env.RAIACCEPT_MODE;
  if (value === "sandbox" || value === "production") return value;
  if (process.env.VERCEL_ENV === "production" && !value) {
    throw new Error("RAIACCEPT_MODE must be set in production");
  }
  return "mock";
}

/* ---- auth --------------------------------------------------------------- */

let token: { value: string; expiresAt: number } | undefined;

async function accessToken(): Promise<string> {
  if (token && token.expiresAt > Date.now() + 10_000) return token.value;

  const username = process.env.RAIACCEPT_USERNAME;
  const password = process.env.RAIACCEPT_PASSWORD;
  if (!username || !password) throw new Error("RAIACCEPT_USERNAME / RAIACCEPT_PASSWORD not set");

  const res = await fetch(AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, integrationContext: INTEGRATION }),
  });
  if (!res.ok) throw new Error(`RaiAccept login failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { accessToken: string; accessTokenExpiresIn: number };
  token = { value: data.accessToken, expiresAt: Date.now() + data.accessTokenExpiresIn * 1000 };
  return token.value;
}

async function api<T>(path: string, init: { method: "GET" | "POST"; body?: unknown }): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: init.method,
    headers: {
      Authorization: `Bearer ${await accessToken()}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`RaiAccept ${init.method} ${path} → ${res.status}: ${text.slice(0, 500)}`);
  return (text ? JSON.parse(text) : {}) as T;
}

/* ---- checkout ----------------------------------------------------------- */

export interface CheckoutParams {
  order: OrderRecord;
  /** Merchant order reference — unique per attempt, e.g. "JP-1042" then "JP-1042-2". */
  reference: string;
  siteUrl: string;
  /** Where the customer comes back to; the gateway appends nothing. */
  returnPath: string;
  locale: "al" | "en";
  ip: string;
}

export interface CheckoutSession {
  providerOrderId: string;
  paymentUrl: string;
}

/** The request body RaiAccept expects, shared by "create order" and "create session". */
function orderBody(p: CheckoutParams) {
  const { order } = p;
  const [firstName, ...rest] = order.customer.name.trim().split(/\s+/);
  const lastName = rest.join(" ") || firstName;
  // Every field here is "recommended", and each has a format rule — so an
  // unknown value is left out rather than sent empty. (Kosovo has no official
  // ISO 3166 code; XKX is the user-assigned one banks and card schemes use.)
  const address =
    order.fulfilment.method === "pickup"
      ? { addressStreet1: "Marrje ne barnatore", city: "Prizren", postalCode: "20000", country: "XKX" }
      : { addressStreet1: order.fulfilment.street.slice(0, 50), city: order.fulfilment.city.slice(0, 50), country: "XKX" };
  const named = { firstName: firstName.slice(0, 32), lastName: lastName.slice(0, 32), ...address };

  const consumer: Record<string, string> = {
    firstName: named.firstName,
    lastName: named.lastName,
    mobilePhone: order.customer.phone.replace(/\s+/g, ""),
  };
  if (order.customer.email) consumer.email = order.customer.email;
  if (p.ip) consumer.ipAddress = p.ip;

  const items = order.items.map((line) => ({
    description: line.name.slice(0, 100),
    numberOfItems: line.qty,
    price: line.unitCents / 100,
  }));
  if (order.delivery_cents > 0) {
    items.push({ description: "Dërgesa", numberOfItems: 1, price: order.delivery_cents / 100 });
  }

  const back = (result: string) => `${p.siteUrl}${p.returnPath}?pagesa=${result}`;

  return {
    consumer,
    billingAddress: named,
    shippingAddress: named,
    invoice: {
      amount: order.total_cents / 100,
      currency: order.currency,
      description: `Jara Pharmacy — porosia ${p.reference}`,
      merchantOrderReference: p.reference,
      items,
    },
    paymentMethodPreference: "CARD",
    urls: {
      successUrl: back("sukses"),
      failUrl: back("deshtoi"),
      cancelUrl: back("anuluar"),
      notificationUrl: `${p.siteUrl}/api/payments/raiaccept`,
    },
    recurring: { recurringModel: "NONE" },
  };
}

export async function createCheckout(p: CheckoutParams): Promise<CheckoutSession> {
  if (mode() === "mock") {
    const providerOrderId = `MOCK-${p.reference}`;
    const url = new URL(`${p.siteUrl}/api/payments/mock`);
    url.searchParams.set("order", p.order.id);
    url.searchParams.set("ref", p.reference);
    return { providerOrderId, paymentUrl: url.toString() };
  }

  const body = orderBody(p);
  const created = await api<{ orderIdentification: string }>("/orders", { method: "POST", body });
  const providerOrderId = created.orderIdentification;
  if (!providerOrderId) throw new Error("RaiAccept: no orderIdentification in response");

  const session = await api<{ sessionId: string; paymentRedirectURL: string }>(
    `/orders/${encodeURIComponent(providerOrderId)}/checkout`,
    { method: "POST", body },
  );
  if (!session.paymentRedirectURL) throw new Error("RaiAccept: no paymentRedirectURL in response");

  // The hosted page follows the customer's language.
  const url = new URL(session.paymentRedirectURL);
  url.searchParams.set("lang", p.locale === "al" ? "al" : "en");
  return { providerOrderId, paymentUrl: url.toString() };
}

/* ---- verification ------------------------------------------------------- */

export interface RaiTransaction {
  transactionId: string;
  transactionAmount: number;
  transactionCurrency: string;
  transactionType: "PURCHASE" | "REFUND" | string;
  status: string;
  statusCode: string;
  statusMessage?: string;
}

export interface PurchaseCheck {
  state: "paid" | "failed" | "pending";
  transaction?: RaiTransaction;
}

/**
 * What the bank says happened to a provider order. A purchase transaction
 * with status SUCCESS (code 0000) and the right amount and currency is a
 * payment; any other finished purchase is a failure; nothing yet is pending.
 */
export async function checkPurchase(providerOrderId: string, expected: { cents: number; currency: string }): Promise<PurchaseCheck> {
  if (mode() === "mock") return { state: "pending" };

  const raw = await api<RaiTransaction[] | { transactions?: RaiTransaction[] }>(
    `/orders/${encodeURIComponent(providerOrderId)}/transactions`,
    { method: "POST" },
  );
  const list = Array.isArray(raw) ? raw : (raw.transactions ?? []);
  const purchases = list.filter((t) => t.transactionType === "PURCHASE");

  const success = purchases.find(
    (t) =>
      (t.status === "SUCCESS" || t.statusCode === "0000") &&
      Math.round(Number(t.transactionAmount) * 100) === expected.cents &&
      t.transactionCurrency === expected.currency,
  );
  if (success) return { state: "paid", transaction: success };

  const failed = purchases.find((t) => t.status && t.status !== "SUCCESS" && t.status !== "PENDING");
  if (failed) return { state: "failed", transaction: failed };

  return { state: "pending" };
}

/** Shape of the notification RaiAccept posts to `notificationUrl`. */
export interface RaiWebhook {
  transaction?: RaiTransaction & { isProduction?: boolean };
  order?: { orderIdentification?: string; invoice?: { merchantOrderReference?: string } };
  card?: { maskedCardNumber?: string; type?: string };
}

/** The webhook's sender range, per the docs. Only enforced when the header is present. */
const WEBHOOK_CIDR = { base: ipToInt("18.96.33.128"), bits: 29 };

export function isRaiAcceptIp(ip: string): boolean {
  const n = ipToInt(ip);
  if (n == null) return false;
  const mask = ~((1 << (32 - WEBHOOK_CIDR.bits)) - 1) >>> 0;
  return (n & mask) === (WEBHOOK_CIDR.base! & mask);
}

function ipToInt(ip: string): number | null {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => !Number.isInteger(p) || p < 0 || p > 255)) return null;
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

export function assertMockMode(): void {
  if (mode() !== "mock") throw new HttpError(404, "Not found");
}
