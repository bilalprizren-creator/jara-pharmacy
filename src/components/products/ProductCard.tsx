import { forwardRef } from "react";
import { motion } from "framer-motion";
import { Heart, MessageCircle } from "lucide-react";
import type { Product } from "@/types";
import { useI18n } from "@/context/I18nContext";
import { useInquiry } from "@/context/InquiryContext";
import { useFavorite } from "@/hooks/useFavorite";
import { ProductMedia } from "@/components/ui/ProductMedia";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";
import { fadeUp } from "@/lib/motion";

// forwardRef: AnimatePresence (mode="popLayout") measures direct children via ref.
export const ProductCard = forwardRef<HTMLElement, { product: Product }>(function ProductCard(
  { product },
  ref,
) {
  const { tr, c } = useI18n();
  const { openModal, selectForInquiry } = useInquiry();
  const [favorite, toggleFavorite] = useFavorite(product.id);

  return (
    <motion.article
      ref={ref}
      variants={fadeUp}
      layout
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-line bg-white shadow-soft transition-shadow duration-300 hover:shadow-card"
    >
      <div className="relative">
        <button
          type="button"
          onClick={() => openModal(product)}
          className="block w-full"
          aria-label={`${c.product_view}: ${product.name}`}
        >
          <div className="aspect-[4/5] overflow-hidden">
            <ProductMedia
              visual={product.visual}
              image={product.image}
              alt={product.name}
              rounded="rounded-none"
              className="transition-transform duration-500 group-hover:scale-[1.04]"
            />
          </div>
        </button>

        {product.badge && (
          <span className="absolute left-3 top-3">
            <Badge tone="lime">{tr(product.badge)}</Badge>
          </span>
        )}

        <button
          type="button"
          onClick={toggleFavorite}
          aria-pressed={favorite}
          aria-label={favorite ? c.fav_remove : c.fav_add}
          title={favorite ? c.fav_remove : c.fav_add}
          className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-ink-muted shadow-soft ring-1 ring-line backdrop-blur transition hover:text-rose"
        >
          <motion.span animate={favorite ? { scale: [1, 1.3, 1] } : { scale: 1 }} transition={{ duration: 0.3 }}>
            <Heart className={cn("h-4 w-4", favorite && "fill-rose text-rose")} />
          </motion.span>
        </button>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-emerald2">
          {tr(product.categoryLabel)}
        </p>
        <button
          type="button"
          onClick={() => openModal(product)}
          className="mt-1 text-left text-[15px] font-bold leading-snug text-ink-strong hover:text-forest"
        >
          {product.name}
        </button>
        <p className="mt-1.5 line-clamp-2 flex-1 text-sm leading-relaxed text-ink-muted">
          {tr(product.shortDescription)}
        </p>

        <div className="mt-4 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => selectForInquiry(product)}
            className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full bg-forest px-3 py-2 text-center text-xs font-semibold leading-tight text-white transition-all duration-300 hover:bg-forest-600 active:scale-[0.98] sm:gap-2 sm:px-4 sm:text-sm"
          >
            <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            {c.product_ask}
          </button>
          <button
            type="button"
            onClick={() => openModal(product)}
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-line px-3 py-2 text-center text-xs font-semibold leading-tight text-forest transition-colors duration-300 hover:border-forest/40 hover:bg-surface-soft sm:px-4 sm:text-sm"
          >
            {c.product_view}
          </button>
        </div>
      </div>
    </motion.article>
  );
});
