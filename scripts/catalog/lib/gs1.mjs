/**
 * Barcode judgement for the ALBTRIX assortment.
 * ---------------------------------------------
 * Whether a photo can be found automatically hangs almost entirely on the
 * barcode, so "has a barcode" is not a useful answer — the field is filled for
 * 8.505 of 9.462 articles, but a large minority of those cannot identify a
 * product anywhere outside this pharmacy:
 *
 *   - 237 entries are alphanumeric national codes (PZN/AIC) or batch numbers,
 *   - GS1 prefixes 02/04/2 are reserved for in-store codes: valid check digit,
 *     meaningless to the outside world,
 *   - a couple are placeholders someone typed once (12345670),
 *   - and repdigit codes (0000000000000) are simply empty fields in disguise.
 *
 * `classifyBarcode` sorts those apart so the image search only ever runs on
 * codes that can actually resolve.
 */

/** Verifies the GS1 mod-10 check digit of an all-digit GTIN-8/12/13/14. */
export function hasValidCheckDigit(barcode) {
  if (!/^\d{8}$|^\d{12,14}$/.test(barcode)) return false;
  const digits = [...barcode].map(Number);
  const check = digits.pop();
  let sum = 0;
  // Weights run 3,1,3,1… from the right-most body digit outwards.
  digits.reverse().forEach((digit, index) => {
    sum += digit * (index % 2 === 0 ? 3 : 1);
  });
  return (10 - (sum % 10)) % 10 === check;
}

const PLACEHOLDERS = new Set(["12345670", "1234567890128", "0000000000000"]);

/**
 * Grades a raw barcode field.
 *
 * @returns {{ status: string, usable: boolean, reason: string }}
 *   `usable` means: this code may be sent to an external lookup.
 */
export function classifyBarcode(raw) {
  const code = (raw ?? "").trim();
  if (!code) return grade("missing", false, "Nuk ka barkod");
  if (!/^\d+$/.test(code)) return grade("non-numeric", false, "Nuk është EAN — kod kombëtar (PZN/AIC) ose numër serie");
  if (PLACEHOLDERS.has(code) || /^(\d)\1+$/.test(code)) return grade("placeholder", false, "Vendmbajtës, jo barkod i vërtetë");
  if (!/^\d{8}$|^\d{12,14}$/.test(code)) return grade("wrong-length", false, `Gjatësi e pavlefshme (${code.length} shifra)`);
  if (!hasValidCheckDigit(code)) return grade("bad-check-digit", false, "Shifra e kontrollit nuk përputhet");
  if (/^(02|04|2)/.test(code)) return grade("in-store", false, "Kod i brendshëm (prefiks 02/04/2) — nuk njihet jashtë barnatores");
  return grade("valid", true, "GTIN i vlefshëm ndërkombëtarisht");
}

const grade = (status, usable, reason) => ({ status, usable, reason });

/**
 * Findability grade, mirroring the classes used in the ChatGPT analysis so the
 * two sets of numbers stay comparable:
 *   A = resolvable GTIN + brand · B = GTIN only · C = brand only · D = neither.
 */
export function findabilityGrade({ barcodeUsable, hasBrand }) {
  if (barcodeUsable && hasBrand) return "A";
  if (barcodeUsable) return "B";
  return hasBrand ? "C" : "D";
}
