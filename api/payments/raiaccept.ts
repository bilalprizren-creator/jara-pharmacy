import { store } from "../_lib/db";
import { clientIp, handler, json, siteUrl } from "../_lib/http";
import { applyPaymentResult, reconcile } from "../_lib/orders";
import { isRaiAcceptIp, mode, type RaiWebhook } from "../_lib/raiaccept";

/**
 * POST /api/payments/raiaccept — the gateway's notification webhook.
 *
 * Treated as a nudge, not as the truth: the order is looked up, then the
 * bank's API is asked what actually happened (`reconcile`), and only that
 * answer changes the order. Always answers 200 quickly — RaiAccept retries
 * up to three times otherwise, and a retry of something already handled
 * must be harmless (it is: `applyPaymentResult` is idempotent).
 */
export default handler(["POST"], async (req, res) => {
  if (mode() === "mock") {
    json(res, 404, { error: "Not found" });
    return;
  }

  const ip = clientIp(req);
  if (ip && !isRaiAcceptIp(ip)) {
    // Logged, not rejected: proxies can rewrite the source, and the API
    // check below is what protects the order anyway.
    console.warn(`[webhook] notification from unexpected ip ${ip}`);
  }

  const body = (typeof req.body === "string" ? safeJson(req.body) : req.body) as RaiWebhook | undefined;
  const providerOrderId = body?.order?.orderIdentification;
  const reference = body?.order?.invoice?.merchantOrderReference;

  const db = store();
  let order = providerOrderId ? await db.findByProviderOrderId(providerOrderId) : null;
  if (!order && reference) {
    const number = Number(/^JP-(\d+)/.exec(reference)?.[1]);
    if (Number.isFinite(number)) order = await db.findByNumber(number);
  }

  if (!order) {
    console.warn("[webhook] no order for", { providerOrderId, reference });
    json(res, 200, { ok: true, ignored: true });
    return;
  }

  await db.addEvent(order.id, "webhook", body ?? null);

  // The transaction in the payload is only a hint; reconcile asks the API.
  const site = siteUrl(req);
  let current = await reconcile(order, site);

  // A refund notification, or an API that is briefly unreachable: fall back to
  // the payload for a failure only — never mark paid from the payload alone.
  const tx = body?.transaction;
  if (current.status === "pending_payment" && tx?.transactionType === "PURCHASE" && tx.status && tx.status !== "SUCCESS") {
    current = await applyPaymentResult(current, { state: "failed", transaction: tx, source: "webhook" }, site);
  }

  json(res, 200, { ok: true, status: current.status });
});

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}
