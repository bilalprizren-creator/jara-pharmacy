import { handler, json, queryParam, siteUrl } from "../../_lib/http";
import { reconcile, requireOrder, toView } from "../../_lib/orders";

/**
 * GET /api/orders/<id> — the order as the status page shows it.
 *
 * While a card payment is pending the function asks the gateway itself
 * before answering, so the page is right even if the webhook never came.
 * The id is a 12-character random string, which is what keeps other
 * people's orders private without a login.
 */
export default handler(["GET"], async (req, res) => {
  const order = await requireOrder(queryParam(req, "id"));
  const current = await reconcile(order, siteUrl(req));
  json(res, 200, toView(current));
});
