import { randomBytes } from "node:crypto";
import { z } from "zod";
import { publicBranches } from "../../src/data/locations";
import { shopPrices } from "../../src/data/prices";
import { computeTotals, methodFor, priceLines } from "../../src/lib/orderTotals";
import type { CreateOrderRequest, OrderStatus, OrderView } from "../../src/types/shop";
import { store, type NewOrder, type OrderRecord } from "./db";
import { HttpError } from "./http";
import { confirmCustomer, notifyPharmacy } from "./mail";
import { checkPurchase, createCheckout, mode, type RaiTransaction } from "./raiaccept";

/**
 * Everything about an order that is not HTTP: validating what the browser
 * sent, pricing it from the price list, starting a card payment, applying a
 * payment result exactly once, and the public view the status page reads.
 */

export const PROVIDER = "raiaccept";

export function orderNumber(order: Pick<OrderRecord, "number">): string {
  return `JP-${order.number}`;
}

/** 12 URL-safe characters — the order's address, so it must not be guessable. */
export function newOrderId(): string {
  return randomBytes(9).toString("base64url").slice(0, 12);
}

/* ---- validation --------------------------------------------------------- */

const branchIds = new Set(publicBranches.map((b) => b.id));

const createSchema = z.object({
  locale: z.enum(["al", "en"]).default("al"),
  items: z
    .array(z.object({ id: z.string().min(1).max(64), qty: z.number().int().min(1).max(10) }))
    .min(1)
    .max(30),
  customer: z.object({
    name: z.string().trim().min(2).max(80),
    phone: z.string().trim().min(6).max(30),
    email: z.string().trim().email().max(120).optional().or(z.literal("")),
  }),
  fulfilment: z.discriminatedUnion("method", [
    z.object({ method: z.literal("pickup"), branchId: z.string().refine((id) => branchIds.has(id), "unknown branch") }),
    z.object({
      method: z.enum(["prizren", "kosovo"]),
      street: z.string().trim().min(3).max(120),
      city: z.string().trim().min(2).max(60),
      note: z.string().trim().max(300).optional(),
    }),
  ]),
  paymentMethod: z.enum(["card", "cash"]),
  acceptTerms: z.literal(true),
  website: z.string().max(0).optional(),
});

export const createOrderSchema: z.ZodType<CreateOrderRequest> = createSchema as unknown as z.ZodType<CreateOrderRequest>;

/**
 * Kosovo numbers in one shape: "+383 4x xxx xxx". Accepts the local "04x…",
 * "3834x…" and "+383…" spellings; anything else (a foreign number) is kept
 * as typed, minus spaces, with a leading "+" if it had a country code.
 */
export function normalizePhone(raw: string): string {
  let digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("00")) digits = `+${digits.slice(2)}`;
  if (/^0\d{8,9}$/.test(digits)) digits = `+383${digits.slice(1)}`;
  else if (/^383\d{8,9}$/.test(digits)) digits = `+${digits}`;
  if (/^\+383\d{8,9}$/.test(digits)) {
    const local = digits.slice(4);
    return `+383 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5)}`;
  }
  return digits;
}

/* ---- creation ----------------------------------------------------------- */

export function buildOrder(input: CreateOrderRequest): NewOrder {
  const lines = priceLines(input.items);
  if (lines.length === 0) throw new HttpError(400, "No purchasable items", "empty_cart");
  const unknown = input.items.filter((i) => !shopPrices[i.id]);
  if (unknown.length > 0) throw new HttpError(400, `Unknown product: ${unknown[0].id}`, "unknown_product");

  const totals = computeTotals(lines, methodFor(input.fulfilment));

  return {
    id: newOrderId(),
    status: input.paymentMethod === "card" ? "pending_payment" : "new",
    locale: input.locale,
    customer: {
      name: input.customer.name.trim(),
      phone: normalizePhone(input.customer.phone),
      email: input.customer.email ? input.customer.email.trim().toLowerCase() : undefined,
    },
    fulfilment: input.fulfilment,
    items: lines,
    subtotal_cents: totals.subtotalCents,
    delivery_cents: totals.deliveryCents,
    total_cents: totals.totalCents,
    currency: totals.currency,
    payment_method: input.paymentMethod,
  };
}

/* ---- payment ------------------------------------------------------------ */

const RETRYABLE: OrderStatus[] = ["pending_payment", "payment_failed", "cancelled"];

/** Start (or restart) the card payment: a fresh gateway order per attempt. */
export async function startPayment(
  order: OrderRecord,
  ctx: { siteUrl: string; locale: "al" | "en"; ip: string },
): Promise<{ order: OrderRecord; paymentUrl: string }> {
  if (order.payment_method !== "card") throw new HttpError(409, "Not a card order", "not_card");
  if (!RETRYABLE.includes(order.status)) throw new HttpError(409, `Order is ${order.status}`, "not_payable");

  const attempt = order.payment_attempts + 1;
  const reference = attempt === 1 ? orderNumber(order) : `${orderNumber(order)}-${attempt}`;

  const session = await createCheckout({
    order,
    reference,
    siteUrl: ctx.siteUrl,
    returnPath: `/porosia/${order.id}`,
    locale: ctx.locale,
    ip: ctx.ip,
  });

  const db = store();
  const updated = await db.update(order.id, {
    status: "pending_payment",
    provider: PROVIDER,
    provider_order_id: session.providerOrderId,
    payment_attempts: attempt,
  });
  await db.addEvent(order.id, "payment_started", { attempt, reference, providerOrderId: session.providerOrderId, mode: mode() });
  return { order: updated, paymentUrl: session.paymentUrl };
}

export interface PaymentResult {
  state: "paid" | "failed" | "cancelled";
  transaction?: Partial<RaiTransaction> & Pick<RaiTransaction, "transactionId">;
  source: "webhook" | "reconcile" | "mock";
}

/**
 * Apply a payment result exactly once. A paid order stays paid whatever
 * arrives later (webhooks retry, and a customer can reload the status page
 * as often as they like); a failure never overwrites a success.
 */
export async function applyPaymentResult(order: OrderRecord, result: PaymentResult, siteUrl: string): Promise<OrderRecord> {
  const db = store();
  await db.addEvent(order.id, `payment_${result.state}`, { source: result.source, transaction: result.transaction ?? null });

  if (order.status === "paid") return order;
  if (order.status !== "pending_payment" && result.state !== "paid") return order;

  if (result.state === "paid") {
    const paid = await db.update(order.id, {
      status: "paid",
      provider_tx_id: result.transaction?.transactionId ?? null,
      paid_at: new Date().toISOString(),
    });
    await Promise.all([notifyPharmacy(paid, siteUrl), confirmCustomer(paid, siteUrl)]);
    return paid;
  }

  return db.update(order.id, {
    status: result.state === "cancelled" ? "cancelled" : "payment_failed",
    provider_tx_id: result.transaction?.transactionId ?? null,
  });
}

/**
 * Ask the gateway ourselves while a payment is pending — the status page
 * calls this, so a lost webhook never leaves a customer staring at a spinner.
 */
export async function reconcile(order: OrderRecord, siteUrl: string): Promise<OrderRecord> {
  if (order.status !== "pending_payment" || !order.provider_order_id) return order;
  try {
    const check = await checkPurchase(order.provider_order_id, { cents: order.total_cents, currency: order.currency });
    if (check.state === "pending") return order;
    return applyPaymentResult(order, { state: check.state, transaction: check.transaction, source: "reconcile" }, siteUrl);
  } catch (err) {
    console.error("[orders] reconcile failed", err);
    return order;
  }
}

/* ---- public view -------------------------------------------------------- */

export function toView(order: OrderRecord): OrderView {
  return {
    id: order.id,
    number: orderNumber(order),
    status: order.status,
    locale: order.locale,
    customer: order.customer,
    fulfilment: order.fulfilment,
    items: order.items,
    totals: {
      subtotalCents: order.subtotal_cents,
      deliveryCents: order.delivery_cents,
      totalCents: order.total_cents,
      currency: "EUR",
    },
    paymentMethod: order.payment_method,
    createdAt: order.created_at,
    paidAt: order.paid_at ?? undefined,
  };
}

export async function requireOrder(id: string | undefined): Promise<OrderRecord> {
  if (!id || !/^[A-Za-z0-9_-]{6,40}$/.test(id)) throw new HttpError(404, "Order not found", "not_found");
  const order = await store().get(id);
  if (!order) throw new HttpError(404, "Order not found", "not_found");
  return order;
}
