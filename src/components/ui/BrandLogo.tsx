import { useId } from "react";
import { clsx } from "clsx";

/**
 * Jara Pharmacy brand mark — an interlinked rounded pharmacy cross.
 *
 * The mark is two rounded-rectangle "links" (one vertical, one horizontal)
 * woven together into a plus, echoing the storefront sign + profile logo in
 * the brand references. A mask creates the over/under chain weave so the mark
 * never looks like a generic medical cross.
 */

type MarkColors = {
  vertical: string;
  horizontal: string;
};

function JaraMark({
  colors,
  className,
}: {
  colors: MarkColors;
  className?: string;
}) {
  // Unique ids so multiple logos can coexist on one page without clashing.
  const uid = useId().replace(/:/g, "");
  const weaveMask = `weave-${uid}`;

  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      fill="none"
      role="presentation"
      aria-hidden="true"
    >
      <defs>
        {/* Reveal the vertical link at two diagonal crossings for the weave. */}
        <mask id={weaveMask}>
          <rect x="0" y="0" width="120" height="120" fill="white" />
          <circle cx="42" cy="42" r="12" fill="black" />
          <circle cx="78" cy="78" r="12" fill="black" />
        </mask>
      </defs>

      {/* Vertical link (drawn first = under, except where mask reveals it). */}
      <rect
        x="42"
        y="18"
        width="36"
        height="84"
        rx="18"
        stroke={colors.vertical}
        strokeWidth="13"
        strokeLinejoin="round"
      />

      {/* Horizontal link (on top), masked at 2 crossings to weave under. */}
      <g mask={`url(#${weaveMask})`}>
        <rect
          x="18"
          y="42"
          width="84"
          height="36"
          rx="18"
          stroke={colors.horizontal}
          strokeWidth="13"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

export type BrandLogoVariant = "full" | "mark" | "footer";

export interface BrandLogoProps {
  variant?: BrandLogoVariant;
  /** Renders the deep-green circular disc behind the mark (profile style). */
  disc?: boolean;
  className?: string;
  /** Tailwind height class for the mark, e.g. "h-10". */
  markClassName?: string;
  /**
   * Wordmark text tone. The disc/mark can sit on a green surface while the
   * wordmark sits on the page background — so its tone is decoupled here.
   * Defaults to the mark tone. Pass "dark" over a light/white surface.
   */
  wordmarkTone?: "light" | "dark";
  title?: string;
}

export function BrandLogo({
  variant = "full",
  disc = false,
  className,
  markClassName = "h-10 w-10",
  wordmarkTone,
  title = "Jara Pharmacy",
}: BrandLogoProps) {
  // On a green disc / dark footer the mark uses white + lime for contrast;
  // inline on light surfaces it uses forest + lime.
  const onDark = disc || variant === "footer";
  const colors: MarkColors = onDark
    ? { vertical: "#FFFFFF", horizontal: "#B7E532" }
    : { vertical: "#0A5C44", horizontal: "#B7E532" };

  const mark = disc ? (
    <span
      className={clsx(
        "relative inline-flex items-center justify-center rounded-full bg-hero-forest shadow-soft ring-1 ring-white/10",
        markClassName,
      )}
    >
      <JaraMark colors={colors} className="h-[68%] w-[68%]" />
    </span>
  ) : (
    <JaraMark colors={colors} className={markClassName} />
  );

  if (variant === "mark") {
    return (
      <span className={clsx("inline-flex", className)} aria-label={title} role="img">
        {mark}
      </span>
    );
  }

  // Wordmark tone follows the surrounding surface, not the (green) disc.
  const tone = wordmarkTone ?? (onDark ? "light" : "dark");
  const wordColor = tone === "light" ? "text-white" : "text-forest";
  const subColor = tone === "light" ? "text-lime-600" : "text-emerald2";

  return (
    <span
      className={clsx("inline-flex items-center gap-2.5 select-none", className)}
      aria-label={title}
      role="img"
    >
      {mark}
      <span className="flex flex-col leading-none">
        <span className={clsx("text-[1.3rem] font-extrabold tracking-tight", wordColor)}>
          JARA
        </span>
        <span className={clsx("text-[0.64rem] font-semibold uppercase tracking-[0.28em]", subColor)}>
          Pharmacy
        </span>
      </span>
    </span>
  );
}

export default BrandLogo;
