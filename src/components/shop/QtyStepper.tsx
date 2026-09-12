import { Minus, Plus } from "lucide-react";
import { useI18n } from "@/context/I18nContext";
import { MAX_QTY_PER_LINE } from "@/lib/orderTotals";
import { cn } from "@/lib/cn";

/** −/+ quantity control used in the product modal, the drawer and the checkout. */
export function QtyStepper({
  value,
  onChange,
  min = 1,
  size = "md",
  label,
  className,
}: {
  value: number;
  onChange: (next: number) => void;
  /** 1 in the modal (a quantity to add), 0 in the cart (zero removes). */
  min?: 0 | 1;
  size?: "sm" | "md";
  /** Product name, so screen readers hear which line the buttons belong to. */
  label: string;
  className?: string;
}) {
  const { c } = useI18n();
  const dims = size === "sm" ? "h-8" : "h-10";
  const btn = cn(
    "inline-flex items-center justify-center rounded-full text-forest transition hover:bg-forest/10 disabled:opacity-40 disabled:hover:bg-transparent",
    size === "sm" ? "h-8 w-8" : "h-10 w-10",
  );

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-line bg-white p-0.5",
        dims,
        className,
      )}
      role="group"
      aria-label={`${c.cart_qty}: ${label}`}
    >
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        aria-label={c.cart_qty_minus}
        className={btn}
      >
        <Minus className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      <span className="min-w-8 text-center text-sm font-bold tabular-nums text-ink-strong" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={value >= MAX_QTY_PER_LINE}
        aria-label={c.cart_qty_plus}
        className={btn}
      >
        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}
