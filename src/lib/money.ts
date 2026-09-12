/**
 * Money is handled in integer cents everywhere — the price list is the only
 * place a decimal EUR amount is written, and it is converted once, here.
 */

export function toCents(eur: number): number {
  return Math.round(eur * 100);
}

export function fromCents(cents: number): number {
  return cents / 100;
}

/** "12,90 €" in Albanian, "€12.90" in English. */
export function formatEur(cents: number, locale: "al" | "en" = "al"): string {
  const value = (cents / 100).toFixed(2);
  if (locale === "en") return `€${value}`;
  return `${value.replace(".", ",")} €`;
}
