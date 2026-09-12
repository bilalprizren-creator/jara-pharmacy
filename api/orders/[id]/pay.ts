import { z } from "zod";
import { clientIp, handler, json, queryParam, readBody, siteUrl } from "../../_lib/http";
import { requireOrder, startPayment } from "../../_lib/orders";

/**
 * POST /api/orders/<id>/pay — start a fresh card payment for an order whose
 * previous attempt failed or was cancelled ("Provo përsëri pagesën"). Each
 * attempt is a new gateway order with its own reference (JP-1042-2, …).
 */
export default handler(["POST"], async (req, res) => {
  const body = readBody(req, z.object({ locale: z.enum(["al", "en"]).optional() }));
  const order = await requireOrder(queryParam(req, "id"));
  const { paymentUrl } = await startPayment(order, {
    siteUrl: siteUrl(req),
    locale: body.locale ?? order.locale,
    ip: clientIp(req),
  });
  json(res, 200, { paymentUrl });
});
