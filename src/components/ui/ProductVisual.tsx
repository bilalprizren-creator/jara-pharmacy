import { useId } from "react";
import { cn } from "@/lib/cn";
import type { ProductVisual as Visual, VisualPalette, ProductForm } from "@/types";

/**
 * Premium in-app product artwork. Since original packshots are not provided,
 * each product renders a brand-consistent gradient "studio" scene with a
 * stylized silhouette derived from its `form` + `palette`. Fully scalable SVG,
 * no external assets — matching the reference posts' color logic.
 */

interface PaletteTokens {
  bgFrom: string;
  bgTo: string;
  glow: string;
  body: string;
  bodyDark: string;
  cap: string;
}

/**
 * One calm, light "studio" backdrop shared by every product visual (photos and
 * generated scenes) so the whole grid reads as a single premium system. The
 * category color survives only as a whisper via the palette `glow`. Also
 * consumed by ProductMedia so both stay in sync.
 */
export const studioBg = { from: "#FFFFFF", to: "#F4F7F5" } as const;

/** Shared palette tokens — also consumed by ProductMedia for photo backdrops. */
export const palettes: Record<VisualPalette, PaletteTokens> = {
  rose: { bgFrom: "#FCEAF2", bgTo: "#F6D3E3", glow: "#F7B7D3", body: "#E975A8", bodyDark: "#C64B85", cap: "#8E2C5B" },
  green: { bgFrom: "#DFF4E8", bgTo: "#B6E1CC", glow: "#8FD3B2", body: "#0F7A57", bodyDark: "#0A5C44", cap: "#073B2D" },
  teal: { bgFrom: "#DDF1F1", bgTo: "#BAE4E4", glow: "#93D6D6", body: "#2C8C8C", bodyDark: "#1F6E6E", cap: "#154D4D" },
  amber: { bgFrom: "#FCEFD3", bgTo: "#F6E0AE", glow: "#F1CE7C", body: "#E6A23C", bodyDark: "#C67F1E", cap: "#8A5713" },
  violet: { bgFrom: "#EEEAFB", bgTo: "#DBD1F4", glow: "#BCA9EC", body: "#7C5CD6", bodyDark: "#5B3EB0", cap: "#3D2880" },
  cream: { bgFrom: "#F8F3E9", bgTo: "#EDE3D0", glow: "#DFCDA6", body: "#E7DBC1", bodyDark: "#C9B892", cap: "#0F7A57" },
  orange: { bgFrom: "#FCE7D9", bgTo: "#F8D0B8", glow: "#F4B48C", body: "#F26A3C", bodyDark: "#C64E22", cap: "#8A3313" },
};

function Silhouette({ form, p, sheen }: { form: ProductForm; p: PaletteTokens; sheen: string }) {
  // All shapes are centered on x=200 and grounded near y=436.
  const highlight = (
    <rect x="168" y="250" width="16" height="150" rx="8" fill="#FFFFFF" opacity="0.25" />
  );

  switch (form) {
    case "spray":
      return (
        <g>
          <rect x="150" y="250" width="100" height="186" rx="26" fill={p.body} />
          <rect x="150" y="250" width="100" height="186" rx="26" fill={`url(#${sheen})`} opacity="0.5" />
          <rect x="176" y="212" width="48" height="44" rx="8" fill={p.cap} />
          <rect x="220" y="222" width="24" height="10" rx="5" fill={p.cap} />
          {highlight}
        </g>
      );
    case "dropper":
      return (
        <g>
          <rect x="156" y="266" width="88" height="170" rx="24" fill={p.body} />
          <rect x="156" y="266" width="88" height="170" rx="24" fill={`url(#${sheen})`} opacity="0.5" />
          <rect x="182" y="196" width="36" height="30" rx="6" fill={p.cap} />
          <rect x="192" y="222" width="16" height="48" rx="8" fill={p.cap} opacity="0.85" />
          {highlight}
        </g>
      );
    case "jar":
      return (
        <g>
          <rect x="132" y="300" width="136" height="136" rx="30" fill={p.body} />
          <rect x="132" y="300" width="136" height="136" rx="30" fill={`url(#${sheen})`} opacity="0.45" />
          <rect x="140" y="262" width="120" height="52" rx="20" fill={p.cap} />
          <rect x="150" y="330" width="14" height="80" rx="7" fill="#FFFFFF" opacity="0.22" />
        </g>
      );
    case "tube":
      return (
        <g>
          <path d="M160 288 q40 -26 80 0 v148 h-80 z" fill={p.body} />
          <rect x="160" y="288" width="80" height="148" fill={`url(#${sheen})`} opacity="0.4" />
          <rect x="186" y="256" width="28" height="34" rx="6" fill={p.cap} />
          {highlight}
        </g>
      );
    case "sachet":
      return (
        <g>
          <path
            d="M150 250 l100 0 l-6 10 l6 10 l-6 10 l6 156 l-100 0 l6 -156 l-6 -10 l6 -10 z"
            fill={p.body}
          />
          <rect x="150" y="230" width="100" height="22" rx="4" fill={p.cap} />
          <rect x="168" y="286" width="14" height="120" rx="7" fill="#FFFFFF" opacity="0.22" />
        </g>
      );
    case "box":
      return (
        <g>
          <rect x="146" y="236" width="108" height="200" rx="12" fill={p.body} />
          <path d="M254 236 l24 -16 v196 l-24 16 z" fill={p.bodyDark} />
          <path d="M146 236 l24 -16 h108 l-24 16 z" fill={p.cap} opacity="0.9" />
          <rect x="164" y="300" width="12" height="110" rx="6" fill="#FFFFFF" opacity="0.2" />
        </g>
      );
    case "gummies":
      return (
        <g>
          <rect x="146" y="286" width="108" height="150" rx="22" fill={p.body} opacity="0.92" />
          <rect x="150" y="252" width="100" height="42" rx="14" fill={p.cap} />
          {[0, 1, 2].map((r) =>
            [0, 1, 2].map((c) => (
              <circle
                key={`${r}-${c}`}
                cx={170 + c * 30}
                cy={330 + r * 30}
                r="10"
                fill="#FFFFFF"
                opacity={0.28}
              />
            )),
          )}
        </g>
      );
    case "bottle":
    default:
      return (
        <g>
          <rect x="152" y="256" width="96" height="180" rx="28" fill={p.body} />
          <rect x="152" y="256" width="96" height="180" rx="28" fill={`url(#${sheen})`} opacity="0.5" />
          <rect x="176" y="216" width="48" height="46" rx="10" fill={p.cap} />
          {highlight}
        </g>
      );
  }
}

export function ProductVisual({
  visual,
  className,
  rounded = "rounded-lg",
}: {
  visual: Visual;
  className?: string;
  rounded?: string;
}) {
  const p = palettes[visual.palette];
  const uid = useId().replace(/:/g, "");

  return (
    <svg
      viewBox="0 0 400 500"
      className={cn("block h-full w-full", rounded, className)}
      role="img"
      aria-label={visual.label ? `${visual.label} product visual` : "Product visual"}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id={`bg-${uid}`} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor={studioBg.from} />
          <stop offset="100%" stopColor={studioBg.to} />
        </linearGradient>
        <radialGradient id={`sheen-${uid}`} cx="0.3" cy="0.2" r="0.9">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`glow-${uid}`} cx="0.5" cy="0.42" r="0.55">
          <stop offset="0%" stopColor={p.glow} stopOpacity="0.7" />
          <stop offset="100%" stopColor={p.glow} stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="400" height="500" fill={`url(#bg-${uid})`} />
      <circle cx="200" cy="220" r="150" fill={`url(#glow-${uid})`} />

      {/* soft ground shadow */}
      <ellipse cx="200" cy="446" rx="96" ry="16" fill={p.bodyDark} opacity="0.16" />

      <Silhouette form={visual.form} p={p} sheen={`sheen-${uid}`} />

      {/* signature four-point sparkle, as printed on the reference packshots */}
      <path
        d="M200 392 l3.2 9.8 9.8 3.2 -9.8 3.2 -3.2 9.8 -3.2 -9.8 -9.8 -3.2 9.8 -3.2 z"
        fill="#FFFFFF"
        opacity="0.85"
      />

      {/* label band with brand mini-mark */}
      {visual.label && (
        <g>
          <rect x="150" y="352" width="100" height="30" rx="8" fill="#FFFFFF" opacity="0.92" />
          <g transform="translate(160 360) scale(0.42)">
            <rect x="18" y="0" width="14" height="34" rx="7" fill="none" stroke={p.cap} strokeWidth="6" />
            <rect x="1" y="17" width="34" height="14" rx="7" fill="none" stroke={p.body} strokeWidth="6" />
          </g>
          <text
            x="182"
            y="372"
            fontSize="12"
            fontWeight="700"
            letterSpacing="0.5"
            fill={p.cap}
            fontFamily="Inter, system-ui, sans-serif"
          >
            {visual.label.length > 12 ? visual.label.slice(0, 12) : visual.label}
          </text>
        </g>
      )}
    </svg>
  );
}
