// Imported from /react — the same entry point main.tsx mounts <Analytics /> from,
// so both share one module instance instead of bundling the SDK twice.
import { track } from "@vercel/analytics/react";
import type { Product } from "@/types";

/**
 * Outbound-inquiry tracking.
 *
 * Every conversion on this site leaves for WhatsApp or the phone dialer, so
 * nothing about it is observable afterwards — and the number belongs to the
 * pharmacy, not to us. These events are the only record that an inquiry
 * happened at all. They show up in the Vercel dashboard under
 * Analytics -> Events.
 *
 * Deliberately anonymous: product, channel and placement only. No names, no
 * phone numbers, no message text — Vercel Analytics must never carry personal
 * data, and a tel: click cannot identify the caller anyway.
 *
 * `track()` is a no-op outside production (it logs to the console in dev), and
 * it never throws, so these calls cannot break a link.
 */

/** Which way the visitor chose to reach the pharmacy. */
type Channel = "whatsapp" | "call";

/** Where on the page the click happened. */
export type InquirySource =
  | "product_modal"
  | "floating_fab"
  | "navbar"
  | "footer"
  | "contact"
  | "locations";

/** Stand-in for a dimension that does not apply, e.g. a plain footer call. */
const NONE = "—";

/** Vercel rejects overlong values; imported catalog names can be very long. */
function clip(value: string): string {
  return value.length > 120 ? `${value.slice(0, 117)}...` : value;
}

/**
 * Record an outbound inquiry. Pass `product` only when the click carries a
 * product context — that is what answers "which product were they asking
 * about". Fire-and-forget: call it right before the link opens.
 */
export function trackInquiry(
  channel: Channel,
  source: InquirySource,
  product?: Product | null,
): void {
  track(channel === "call" ? "inquiry_call" : "inquiry_whatsapp", {
    product: product ? clip(product.name) : NONE,
    // SHEMO-imported products carry a catalog code; curated ones may not.
    code: product?.productCode ?? product?.sku ?? NONE,
    source,
  });
}
