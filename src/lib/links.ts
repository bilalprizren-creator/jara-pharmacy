import { brand } from "@/data/brand";
import type { Locale } from "@/types";

/**
 * Conversion-flow helpers: WhatsApp click-to-chat, Google Maps universal URLs,
 * tel: and mailto: intents. Kept pure and resilient so per-branch URLs can be
 * swapped in later without touching components.
 */

export function telHref(e164: string = brand.phonePrimary.e164): string {
  return `tel:+${e164}`;
}

export function mailtoHref(subject?: string, body?: string): string {
  const params = new URLSearchParams();
  if (subject) params.set("subject", subject);
  if (body) params.set("body", body);
  const qs = params.toString();
  return `mailto:${brand.email}${qs ? `?${qs}` : ""}`;
}

/** WhatsApp click-to-chat with a pre-filled message. */
export function whatsappHref(message: string, e164: string = brand.phonePrimary.e164): string {
  return `https://wa.me/${e164}?text=${encodeURIComponent(message)}`;
}

/** Universal Google Maps search URL built from a resilient text query. */
export function mapsHref(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function instagramHref(): string {
  return brand.instagramUrl;
}

/* ---- Pre-filled inquiry message copy ---- */

export function generalInquiryMessage(locale: Locale): string {
  return locale === "al"
    ? "Përshëndetje Jara Pharmacy, dua të pyes për një produkt."
    : "Hello Jara Pharmacy, I would like to ask about a product.";
}

export function productInquiryMessage(locale: Locale, productName: string): string {
  return locale === "al"
    ? `Përshëndetje Jara Pharmacy, dua të pyes për produktin: ${productName}.`
    : `Hello Jara Pharmacy, I would like to ask about this product: ${productName}.`;
}

/** Message used when a contact form is submitted, optionally about a product. */
export function contactInquiryMessage(
  locale: Locale,
  data: { name: string; phone: string; product?: string; message: string },
): string {
  const { name, phone, product, message } = data;
  if (locale === "al") {
    return [
      "Përshëndetje Jara Pharmacy!",
      `Emri: ${name}`,
      `Telefoni: ${phone}`,
      product ? `Produkti / Interesi: ${product}` : null,
      `Mesazhi: ${message}`,
    ]
      .filter(Boolean)
      .join("\n");
  }
  return [
    "Hello Jara Pharmacy!",
    `Name: ${name}`,
    `Phone: ${phone}`,
    product ? `Product / Interest: ${product}` : null,
    `Message: ${message}`,
  ]
    .filter(Boolean)
    .join("\n");
}
