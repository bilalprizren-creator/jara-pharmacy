import { ArrowRight, ShoppingBag, Trash2, Truck } from "lucide-react";
import { useI18n } from "@/context/I18nContext";
import { useCart } from "@/context/CartContext";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { ProductMedia } from "@/components/ui/ProductMedia";
import { QtyStepper } from "@/components/shop/QtyStepper";
import { formatEur } from "@/lib/money";
import { CHECKOUT_PATH } from "@/lib/routes";
import { trackShop } from "@/lib/track";

/**
 * The cart as a right-hand panel over the page. "Vazhdo te porosia" is a real
 * link: the checkout is its own address, the cart lives in localStorage, so a
 * full page load loses nothing and no router is needed.
 */
export function CartDrawer() {
  const { c, locale, fmt, tr } = useI18n();
  const { lines, count, subtotalCents, setQty, remove, drawerOpen, closeDrawer } = useCart();
  const titleId = "cart-drawer-title";

  return (
    <Modal open={drawerOpen} onClose={closeDrawer} labelledBy={titleId} closeLabel={c.nav_close} placement="right">
      <div className="flex h-full flex-col">
        <div className="border-b border-line px-5 py-5 pr-16 sm:px-6">
          <h2 id={titleId} className="flex items-center gap-2 text-xl font-extrabold text-ink-strong">
            <ShoppingBag className="h-5 w-5 text-forest" aria-hidden="true" />
            {c.cart_title}
          </h2>
          <p className="mt-0.5 text-sm text-ink-muted">
            {count === 1 ? fmt("cart_count_one", { count }) : fmt("cart_count_many", { count })}
          </p>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-forest/5 text-forest">
              <ShoppingBag className="h-7 w-7" aria-hidden="true" />
            </span>
            <h3 className="mt-4 text-lg font-bold text-ink-strong">{c.cart_empty_title}</h3>
            <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-ink-muted">{c.cart_empty}</p>
            <Button onClick={closeDrawer} variant="outline" className="mt-6">
              {c.cart_continue}
            </Button>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-line overflow-y-auto px-5 sm:px-6">
              {lines.map(({ product, qty, lineCents }) => (
                <li key={product.id} className="flex gap-3 py-4">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-line">
                    <ProductMedia visual={product.visual} image={product.image} alt="" rounded="rounded-lg" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-emerald2">
                      {tr(product.categoryLabel)}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-sm font-bold leading-snug text-ink-strong">
                      {product.name}
                    </p>
                    <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                      <QtyStepper
                        value={qty}
                        min={0}
                        size="sm"
                        label={product.name}
                        onChange={(next) => setQty(product.id, next)}
                      />
                      <span className="text-sm font-extrabold tabular-nums text-forest">
                        {formatEur(lineCents, locale)}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(product.id)}
                    aria-label={`${c.cart_remove}: ${product.name}`}
                    className="-mr-2 inline-flex h-9 w-9 shrink-0 items-center justify-center self-start rounded-full text-ink-muted transition hover:bg-rose-blush hover:text-rose"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>

            <div className="border-t border-line bg-surface-soft px-5 py-5 sm:px-6">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-semibold text-ink-muted">{c.cart_subtotal}</span>
                <span className="text-xl font-extrabold tabular-nums text-ink-strong">
                  {formatEur(subtotalCents, locale)}
                </span>
              </div>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-muted">
                <Truck className="h-3.5 w-3.5" aria-hidden="true" />
                {c.cart_delivery_note}
              </p>
              <Button
                href={CHECKOUT_PATH}
                onClick={() => trackShop("checkout_started", { items: count })}
                variant="primary"
                fullWidth
                size="lg"
                className="mt-4"
                rightIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
              >
                {c.cart_checkout}
              </Button>
              <Button onClick={closeDrawer} variant="ghost" fullWidth className="mt-2">
                {c.cart_continue}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
