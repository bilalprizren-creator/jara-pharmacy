import { cn } from "@/lib/cn";
import type { ProductVisual as Visual } from "@/types";
import { ProductVisual, palettes, studioBg } from "@/components/ui/ProductVisual";

/**
 * Product artwork with real-photo support. When `image` is set, the photo is
 * centered (object-contain, never cropped or distorted) on a calm, light
 * "studio" backdrop — the same one the generated ProductVisual uses — with only
 * a whisper of the category color as a soft glow, so every card reads as one
 * consistent, premium system regardless of the photo's own colors. Without an
 * `image` it falls back to the generated ProductVisual scene.
 */
export function ProductMedia({
  visual,
  image,
  alt,
  className,
  rounded = "rounded-lg",
}: {
  visual: Visual;
  image?: string;
  alt: string;
  className?: string;
  rounded?: string;
}) {
  if (!image) {
    return <ProductVisual visual={visual} className={className} rounded={rounded} />;
  }

  const p = palettes[visual.palette];

  return (
    <div
      className={cn("relative h-full w-full overflow-hidden", rounded, className)}
      style={{ background: `linear-gradient(180deg, ${studioBg.from} 0%, ${studioBg.to} 100%)` }}
    >
      {/* very soft category-tinted glow — a whisper of color, not a colored field */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(58% 52% at 50% 44%, ${p.glow}24 0%, transparent 100%)`,
        }}
      />
      <img
        src={image}
        alt={alt}
        loading="lazy"
        decoding="async"
        className="relative h-full w-full object-contain object-center p-[9%] drop-shadow-[0_8px_20px_rgba(7,59,45,0.10)]"
      />
    </div>
  );
}
