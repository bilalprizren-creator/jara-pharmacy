import { cn } from "@/lib/cn";
import type { ProductVisual as Visual } from "@/types";
import { ProductVisual, palettes } from "@/components/ui/ProductVisual";

/**
 * Product artwork with real-photo support. When `image` is set, the photo is
 * centered (object-contain) on the product's brand palette gradient so mixed
 * photo qualities still read as one consistent, premium system — echoing the
 * reference posts. Without an `image` it falls back to the generated
 * ProductVisual scene, so photos can be added product by product.
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
      style={{ background: `linear-gradient(160deg, ${p.bgFrom} 0%, ${p.bgTo} 100%)` }}
    >
      {/* soft radial glow, mirroring the generated scenes */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(60% 55% at 50% 42%, ${p.glow}55 0%, transparent 100%)`,
        }}
      />
      <img
        src={image}
        alt={alt}
        loading="lazy"
        decoding="async"
        className="relative h-full w-full object-contain p-[9%] drop-shadow-[0_10px_18px_rgba(7,59,45,0.18)]"
      />
    </div>
  );
}
