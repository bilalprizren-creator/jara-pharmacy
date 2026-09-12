import { z } from "zod";
import { handler, HttpError, queryParam, readBody, siteUrl } from "../_lib/http";
import { applyPaymentResult, orderNumber, requireOrder } from "../_lib/orders";
import { assertMockMode } from "../_lib/raiaccept";
import { formatEur } from "../../src/lib/money";

/**
 * A stand-in for the bank's payment page, only when RAIACCEPT_MODE=mock.
 *
 * GET shows the amount and three buttons — pay, decline, cancel — and POST
 * applies the chosen outcome through the very same code path the real
 * webhook and reconciliation use, then sends the "customer" back to the
 * order page like the bank would. Anywhere else this route is a 404.
 */
export default handler(["GET", "POST"], async (req, res) => {
  assertMockMode();

  if (req.method === "GET") {
    const order = await requireOrder(queryParam(req, "order"));
    const ref = queryParam(req, "ref") ?? orderNumber(order);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.status(200).send(page(order.id, ref, formatEur(order.total_cents, "al")));
    return;
  }

  const form = readBody(
    req,
    z.object({ order: z.string(), result: z.enum(["paid", "failed", "cancelled"]) }),
  );
  const order = await requireOrder(form.order);
  if (order.status !== "pending_payment") throw new HttpError(409, `Order is ${order.status}`);

  await applyPaymentResult(
    order,
    {
      state: form.result,
      transaction: { transactionId: `MOCK-TX-${Date.now()}`, statusCode: form.result === "paid" ? "0000" : "2004", statusMessage: form.result },
      source: "mock",
    },
    siteUrl(req),
  );

  const back = form.result === "paid" ? "sukses" : form.result === "failed" ? "deshtoi" : "anuluar";
  res.statusCode = 303;
  res.setHeader("Location", `${siteUrl(req)}/porosia/${order.id}?pagesa=${back}`);
  res.end();
});

function page(orderId: string, ref: string, amount: string): string {
  const button = (result: string, label: string, color: string) => `
      <form method="post" action="/api/payments/mock" style="margin:0">
        <input type="hidden" name="order" value="${orderId}">
        <input type="hidden" name="result" value="${result}">
        <button type="submit" style="width:100%;padding:14px 18px;border:0;border-radius:999px;background:${color};color:#fff;font-weight:700;font-size:15px;cursor:pointer">${label}</button>
      </form>`;
  return `<!doctype html><html lang="sq"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Faqe testuese e pagesës — ${ref}</title></head>
  <body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#1f2937;font-family:Inter,Segoe UI,Roboto,sans-serif">
    <main style="width:min(420px,92vw);background:#fff;border-radius:20px;padding:28px;box-shadow:0 24px 60px rgba(0,0,0,.35)">
      <p style="margin:0;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#6b7280">Faqe testuese · nuk është bankë e vërtetë</p>
      <h1 style="margin:8px 0 4px;font-size:22px;color:#111827">Pagesa për porosinë ${ref}</h1>
      <p style="margin:0 0 20px;font-size:32px;font-weight:800;color:#0A5C44">${amount}</p>
      <div style="display:grid;gap:10px">
        ${button("paid", "✅ Paguaj (sukses)", "#0A5C44")}
        ${button("failed", "❌ Refuzo kartën (dështim)", "#b91c1c")}
        ${button("cancelled", "↩ Anulo pagesën", "#6b7280")}
      </div>
      <p style="margin:18px 0 0;font-size:12px;color:#6b7280">Në prodhim këtu shfaqet faqja e Raiffeisen Bank (RaiAccept) me fushat e kartës dhe 3-D Secure.</p>
    </main>
  </body></html>`;
}
