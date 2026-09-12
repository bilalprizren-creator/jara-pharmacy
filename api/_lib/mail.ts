import { publicBranches } from "../../src/data/locations";
import { brand } from "../../src/data/brand";
import { formatEur } from "../../src/lib/money";
import { branchName } from "../../src/lib/branches";
import { whatsappHref } from "../../src/lib/links";
import type { OrderRecord } from "./db";
import { orderNumber } from "./orders";

/**
 * Order emails through Resend's REST API (no SDK — one POST). Two mails per
 * order: the pharmacy gets everything it needs to pack and call; the customer
 * gets a confirmation if they left an address. Without `RESEND_API_KEY` the
 * mails are only logged, which is what the dev server does.
 *
 * Sending never throws into the request: an email that fails must not turn a
 * paid order into an error page.
 */

const FROM = process.env.ORDER_MAIL_FROM ?? "Jara Pharmacy <porosite@jara-pharmacy.com>";
const NOTIFY = process.env.ORDER_NOTIFY_EMAIL ?? brand.email;

interface Mail {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

async function send(mail: Mail): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.info(`[mail] (not sent — RESEND_API_KEY missing) to=${mail.to} subject="${mail.subject}"`);
    return;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM,
        to: [mail.to],
        subject: mail.subject,
        html: mail.html,
        reply_to: mail.replyTo,
      }),
    });
    if (!res.ok) console.error(`[mail] resend ${res.status}: ${await res.text()}`);
  } catch (err) {
    console.error("[mail] failed", err);
  }
}

/* ---- templates ---------------------------------------------------------- */

function esc(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function fulfilmentText(order: OrderRecord, locale: "al" | "en"): string {
  const f = order.fulfilment;
  if (f.method === "pickup") {
    const branch = publicBranches.find((b) => b.id === f.branchId);
    const where = branch ? `${branchName(branch)}, ${branch.address}` : f.branchId;
    return locale === "al" ? `Merret në: ${where}` : `Pick up at: ${where}`;
  }
  const note = f.note ? ` (${f.note})` : "";
  return locale === "al"
    ? `Dërgohet te: ${f.street}, ${f.city}${note}`
    : `Deliver to: ${f.street}, ${f.city}${note}`;
}

function linesTable(order: OrderRecord, locale: "al" | "en"): string {
  const rows = order.items
    .map(
      (l) => `<tr>
        <td style="padding:6px 8px;border-bottom:1px solid #eee">${l.qty}× ${esc(l.name)}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;white-space:nowrap">${formatEur(l.unitCents * l.qty, locale)}</td>
      </tr>`,
    )
    .join("");
  const t = (al: string, en: string) => (locale === "al" ? al : en);
  return `<table style="border-collapse:collapse;width:100%;font-size:14px">${rows}
    <tr><td style="padding:6px 8px;color:#666">${t("Nëntotali", "Subtotal")}</td><td style="padding:6px 8px;text-align:right">${formatEur(order.subtotal_cents, locale)}</td></tr>
    <tr><td style="padding:6px 8px;color:#666">${t("Dërgesa", "Delivery")}</td><td style="padding:6px 8px;text-align:right">${order.delivery_cents === 0 ? t("Falas", "Free") : formatEur(order.delivery_cents, locale)}</td></tr>
    <tr><td style="padding:8px;font-weight:700;font-size:16px">${t("Totali", "Total")}</td><td style="padding:8px;text-align:right;font-weight:700;font-size:16px;color:#0A5C44">${formatEur(order.total_cents, locale)}</td></tr>
  </table>`;
}

function shell(title: string, body: string): string {
  return `<!doctype html><html><body style="margin:0;background:#F7FAF8;font-family:Inter,Segoe UI,Roboto,sans-serif;color:#0F172A">
  <div style="max-width:560px;margin:0 auto;padding:24px">
    <div style="background:#0A5C44;color:#fff;border-radius:16px 16px 0 0;padding:20px 24px">
      <div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;opacity:.8">Jara Pharmacy</div>
      <div style="font-size:20px;font-weight:800;margin-top:4px">${esc(title)}</div>
    </div>
    <div style="background:#fff;border:1px solid #DCE7E1;border-top:0;border-radius:0 0 16px 16px;padding:20px 24px;line-height:1.6;font-size:15px">
      ${body}
    </div>
    <p style="font-size:12px;color:#64748B;text-align:center;margin-top:16px">${esc(brand.name)} · ${esc(brand.address.full)} · ${esc(brand.phonePrimary.label)}</p>
  </div></body></html>`;
}

const paymentLabel = (order: OrderRecord, locale: "al" | "en") =>
  order.payment_method === "card"
    ? order.status === "paid"
      ? locale === "al" ? "Paguar me kartë online ✅" : "Paid by card online ✅"
      : locale === "al" ? "Kartë online — pagesa në pritje" : "Card online — payment pending"
    : locale === "al" ? "Para në dorë (paguan kur ta marrë)" : "Cash (pays on receipt)";

/** To the pharmacy: everything needed to pack the order and call the customer. */
export async function notifyPharmacy(order: OrderRecord, siteUrl: string): Promise<void> {
  const number = orderNumber(order);
  const phone = order.customer.phone;
  // wa.me wants bare digits with the country code — normalizePhone keeps spaces for people.
  const wa = whatsappHref(`Përshëndetje ${order.customer.name}, ju shkruajmë nga Jara Pharmacy për porosinë ${number}.`, phone.replace(/\D/g, ""));
  const body = `
    <p><strong>${esc(order.customer.name)}</strong><br>
    ${esc(phone)}${order.customer.email ? `<br>${esc(order.customer.email)}` : ""}</p>
    <p>${esc(fulfilmentText(order, "al"))}<br>
    <strong>${esc(paymentLabel(order, "al"))}</strong></p>
    ${linesTable(order, "al")}
    <p style="margin-top:20px">
      <a href="${wa}" style="display:inline-block;background:#25D366;color:#fff;text-decoration:none;font-weight:700;padding:10px 16px;border-radius:999px">Shkruaj klientit në WhatsApp</a>
      &nbsp; <a href="tel:${esc(phone.replace(/\s+/g, ""))}" style="color:#0A5C44;font-weight:700">Telefono</a>
    </p>
    <p style="font-size:13px;color:#64748B">Faqja e porosisë: <a href="${siteUrl}/porosia/${order.id}">${siteUrl}/porosia/${order.id}</a></p>`;
  await send({
    to: NOTIFY,
    subject: `${number} — ${order.customer.name} — ${formatEur(order.total_cents, "al")} — ${order.payment_method === "card" ? (order.status === "paid" ? "PAGUAR" : "kartë, në pritje") : "para në dorë"}`,
    html: shell(`Porosi e re ${number}`, body),
    replyTo: order.customer.email,
  });
}

/** To the customer, if they left an email. */
export async function confirmCustomer(order: OrderRecord, siteUrl: string): Promise<void> {
  const email = order.customer.email;
  if (!email) return;
  const l = order.locale;
  const number = orderNumber(order);
  const t = (al: string, en: string) => (l === "al" ? al : en);
  const body = `
    <p>${t(`Përshëndetje ${esc(order.customer.name)},`, `Hello ${esc(order.customer.name)},`)}</p>
    <p>${
      order.status === "paid"
        ? t("faleminderit — pagesa u krye dhe porosia juaj po përgatitet.", "thank you — your payment went through and your order is being prepared.")
        : t("faleminderit — porosia juaj u pranua. Do t'ju telefonojmë për ta konfirmuar.", "thank you — we received your order and will call you to confirm it.")
    }</p>
    <p>${esc(fulfilmentText(order, l))}<br>${esc(paymentLabel(order, l))}</p>
    ${linesTable(order, l)}
    <p style="margin-top:20px"><a href="${siteUrl}/porosia/${order.id}" style="color:#0A5C44;font-weight:700">${t("Shiko porosinë", "View your order")}</a></p>
    <p style="font-size:13px;color:#64748B">${t("Pyetje? Na shkruani në WhatsApp ose telefononi:", "Questions? Message us on WhatsApp or call:")} ${esc(brand.phonePrimary.label)}</p>`;
  await send({
    to: email,
    subject: t(`Porosia juaj ${number} — Jara Pharmacy`, `Your order ${number} — Jara Pharmacy`),
    html: shell(t(`Porosia ${number}`, `Order ${number}`), body),
    replyTo: NOTIFY,
  });
}
