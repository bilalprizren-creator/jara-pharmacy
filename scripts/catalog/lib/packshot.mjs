/**
 * How much does a photo look like a product packshot?
 * ---------------------------------------------------
 * The catalogue on the site is built from packshots: the product, centred, on a
 * clean light ground. Photos contributed to the open barcode databases are a
 * mixed bag — some are proper packshots, many are a box photographed on a
 * kitchen table or a bed sheet. Those are correct products but wrong pictures,
 * and putting them next to the existing catalogue would look careless.
 *
 * This scores that difference without any machine learning: a packshot has a
 * border that is bright and uniform, because it is empty studio ground. A photo
 * taken on a table has a border that is darker, and above all *varied* — that
 * is the signal that separates them most reliably.
 *
 * The score is a hint for ranking candidates and for flagging weak ones to the
 * reviewer. It never decides anything on its own: a person still confirms every
 * photo before it reaches the site.
 */
import sharp from "sharp";

const SAMPLE = 64; // the image is judged from a small thumbnail — plenty, and fast
const BORDER = 12; // size of each corner patch that counts as "background"
const STANDS_OUT = 20; // grey levels a pixel must differ from the ground to be the product

/**
 * @returns {Promise<{score: number, brightness: number, uniformity: number,
 *   width: number, height: number, subjectWidth: number, subjectHeight: number,
 *   verdict: string} | null>}
 *   `score` runs 0..1; null when the image cannot be read.
 */
export async function packshotScore(input) {
  let image;
  let meta;
  try {
    image = sharp(input);
    meta = await image.metadata();
  } catch {
    return null;
  }

  let pixels;
  try {
    pixels = await sharp(input)
      .resize(SAMPLE, SAMPLE, { fit: "fill" })
      // Flatten onto white, never removeAlpha: a cut-out PNG carries black
      // under its transparent pixels, so dropping the alpha channel turns the
      // very best case — a proper cut-out packshot — into a black border and
      // the worst possible score.
      .flatten({ background: "#ffffff" })
      .greyscale()
      .raw()
      .toBuffer();
  } catch {
    return null;
  }

  // Only the four corners, not the whole frame. A centred product regularly
  // touches the middle of an edge — a tall bottle reaches top and bottom — and
  // judging the full ring would then read the product itself as "background"
  // and punish a perfectly good packshot. Corners stay empty far more reliably.
  const border = [];
  for (let y = 0; y < SAMPLE; y += 1) {
    for (let x = 0; x < SAMPLE; x += 1) {
      const nearLeft = x < BORDER;
      const nearRight = x >= SAMPLE - BORDER;
      const nearTop = y < BORDER;
      const nearBottom = y >= SAMPLE - BORDER;
      if ((nearLeft || nearRight) && (nearTop || nearBottom)) border.push(pixels[y * SAMPLE + x]);
    }
  }

  const mean = border.reduce((sum, value) => sum + value, 0) / border.length;
  const variance = border.reduce((sum, value) => sum + (value - mean) ** 2, 0) / border.length;
  const deviation = Math.sqrt(variance);

  // Brightness: 255 is paper white, below ~200 is not studio ground at all.
  const brightness = clamp((mean - 170) / 80);
  // Uniformity: a clean ground varies by a couple of levels; a room varies by 30+.
  const uniformity = clamp(1 - deviation / 40);
  // Uniformity carries more weight: a grey seamless backdrop is still a packshot,
  // a bright but cluttered kitchen counter is not.
  const score = brightness * 0.4 + uniformity * 0.6;

  // How large the product itself is: the box around everything that stands out
  // from the ground. A 1910×1000 canvas with a small jar in the middle is not a
  // large photo of the jar, nor is a colour swatch on white one of the box.
  let [left, right, top, bottom] = [SAMPLE, -1, SAMPLE, -1];
  for (let y = 0; y < SAMPLE; y += 1) {
    for (let x = 0; x < SAMPLE; x += 1) {
      if (Math.abs(pixels[y * SAMPLE + x] - mean) <= STANDS_OUT) continue;
      left = Math.min(left, x);
      right = Math.max(right, x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
    }
  }
  const spanX = right < 0 ? 1 : (right - left + 1) / SAMPLE;
  const spanY = bottom < 0 ? 1 : (bottom - top + 1) / SAMPLE;

  return {
    score: round(score),
    brightness: round(brightness),
    uniformity: round(uniformity),
    width: meta.width ?? 0,
    height: meta.height ?? 0,
    subjectWidth: Math.round((meta.width ?? 0) * spanX),
    subjectHeight: Math.round((meta.height ?? 0) * spanY),
    verdict: verdictFor(score),
  };
}

/** Albanian labels, because these end up in front of the review team. */
export function verdictFor(score) {
  if (score >= 0.8) return "Fotografi studioje";
  if (score >= 0.45) return "E pranueshme";
  return "Jo fotografi produkti";
}

const clamp = (value) => Math.max(0, Math.min(1, value));
const round = (value) => Math.round(value * 100) / 100;
