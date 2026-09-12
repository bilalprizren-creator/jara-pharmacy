import { store } from "../_lib/db";
import { clientIp, handler, HttpError, json, readBody, siteUrl } from "../_lib/http";
import { confirmCustomer, notifyPharmacy } from "../_lib/mail";
import { buildOrder, createOrderSchema, orderNumber, startPayment } from "../_lib/orders";
import type { CreateOrderResponse } from "../../src/types/shop";

/** More than this many orders from one address in ten minutes is not a customer. */
const MAX_ORDERS_PER_IP = 5;
const RATE_WINDOW_MINUTES = 10;

/**
 * POST /api/orders — place an order.
 *
 * The browser sends ids, quantities and contact details; everything with a
 * price on it is recomputed here from src/data/prices.ts and shipping.ts. A
 * cash order is complete on arrival (the pharmacy gets its email at once); a
 * card order is stored as pending and the customer is sent to the bank's
 * payment page.
 */
export default handler(["POST"], async (req, res) => {
  const input = readBody(req, createOrderSchema);
  const site = siteUrl(req);
  const ip = clientIp(req);
  const db = store();

  if (ip && (await db.countRecentOrders(ip, RATE_WINDOW_MINUTES)) >= MAX_ORDERS_PER_IP) {
    throw new HttpError(429, "Too many orders, please try again later", "too_many_orders");
  }

  let order = await db.create(buildOrder(input));
  await db.addEvent(order.id, "created", { paymentMethod: order.payment_method, ip });

  const reply: CreateOrderResponse = { id: order.id, number: orderNumber(order) };

  if (order.payment_method === "card") {
    try {
      const started = await startPayment(order, { siteUrl: site, locale: input.locale, ip });
      order = started.order;
      reply.paymentUrl = started.paymentUrl;
    } catch (err) {
      // The order is saved; only the bank could not be reached. Hand the
      // customer their order page, which offers to start the payment again,
      // instead of a dead end with nothing to show for it.
      console.error("[orders] could not start payment", err);
      await db.update(order.id, { status: "payment_failed" });
      await db.addEvent(order.id, "payment_error", { message: (err as Error).message });
      reply.paymentError = true;
    }
  } else {
    await Promise.all([notifyPharmacy(order, site), confirmCustomer(order, site)]);
  }

  json(res, 201, reply);
});
