import { store } from "../_lib/db";
import { clientIp, handler, json, readBody, siteUrl } from "../_lib/http";
import { confirmCustomer, notifyPharmacy } from "../_lib/mail";
import { buildOrder, createOrderSchema, orderNumber, startPayment } from "../_lib/orders";
import type { CreateOrderResponse } from "../../src/types/shop";

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
  const db = store();

  let order = await db.create(buildOrder(input));
  await db.addEvent(order.id, "created", { paymentMethod: order.payment_method, ip: clientIp(req) });

  const reply: CreateOrderResponse = { id: order.id, number: orderNumber(order) };

  if (order.payment_method === "card") {
    const started = await startPayment(order, { siteUrl: site, locale: input.locale, ip: clientIp(req) });
    order = started.order;
    reply.paymentUrl = started.paymentUrl;
  } else {
    await Promise.all([notifyPharmacy(order, site), confirmCustomer(order, site)]);
  }

  json(res, 201, reply);
});
