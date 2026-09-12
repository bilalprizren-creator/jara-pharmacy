import { useI18n } from "@/context/I18nContext";
import { formatEur, toCents } from "@/lib/money";
import { cn } from "@/lib/cn";

/**
 * A product price with its optional struck-through previous price. Sizes map
 * to where it sits: `sm` on cards, `md` in the modal and cart, `lg` for totals.
 */
export function PriceTag({
  price,
  oldPrice,
  size = "sm",
  className,
}: {
  price: number;
  oldPrice?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const { locale, c } = useI18n();
  const sizes = {
    sm: "text-[15px]",
    md: "text-lg",
    lg: "text-2xl",
  } as const;
  const hasOld = oldPrice != null && oldPrice > price;

  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-x-2", className)}>
      <span className={cn("font-extrabold tracking-tight text-forest", sizes[size])}>
        {formatEur(toCents(price), locale)}
      </span>
      {hasOld && (
        <span className="text-xs font-medium text-ink-muted">
          <span className="sr-only">{c.price_was} </span>
          <s>{formatEur(toCents(oldPrice), locale)}</s>
        </span>
      )}
    </span>
  );
}
