import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Product } from "@/types";
import type { CartItem } from "@/types/shop";
import { productById } from "@/data/products";
import { MAX_QTY_PER_LINE } from "@/lib/orderTotals";
import { toCents } from "@/lib/money";

/**
 * The shopping cart: ids and quantities in localStorage, priced from the
 * catalog at render time. Same persistence pattern as useFavorite — a custom
 * event keeps every consumer in the tab in sync, `storage` covers other tabs.
 *
 * Only products with a `price` can be added; the checkout page re-validates
 * everything on the server anyway, so a stale cart is harmless.
 */
const STORAGE_KEY = "jara.cart";
const SYNC_EVENT = "jara:cart";

export interface CartLine {
  product: Product;
  qty: number;
  unitCents: number;
  lineCents: number;
}

interface CartValue {
  items: CartItem[];
  /** Priced lines for products that still exist and still have a price. */
  lines: CartLine[];
  /** Total number of units across all lines. */
  count: number;
  subtotalCents: number;
  add: (product: Product, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  /** The drawer is global so any card can open it. */
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
}

const CartContext = createContext<CartValue | null>(null);

function readItems(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (x): x is CartItem =>
          typeof x === "object" && x !== null && typeof x.id === "string" && typeof x.qty === "number",
      )
      .map((x) => ({ id: x.id, qty: clampQty(x.qty) }))
      .filter((x) => x.qty > 0);
  } catch {
    return [];
  }
}

function writeItems(items: CartItem[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* storage may be unavailable (private mode) — the cart stays in memory */
  }
  window.dispatchEvent(new Event(SYNC_EVENT));
}

function clampQty(qty: number): number {
  if (!Number.isFinite(qty)) return 0;
  return Math.max(0, Math.min(MAX_QTY_PER_LINE, Math.floor(qty)));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(readItems);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const sync = () => setItems(readItems());
    window.addEventListener(SYNC_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(SYNC_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const update = useCallback((next: (prev: CartItem[]) => CartItem[]) => {
    const result = next(readItems());
    writeItems(result);
    setItems(result);
  }, []);

  const add = useCallback(
    (product: Product, qty = 1) => {
      if (product.price == null) return;
      update((prev) => {
        const existing = prev.find((i) => i.id === product.id);
        if (existing) {
          return prev.map((i) =>
            i.id === product.id ? { ...i, qty: clampQty(i.qty + qty) } : i,
          );
        }
        return [...prev, { id: product.id, qty: clampQty(qty) }];
      });
    },
    [update],
  );

  const setQty = useCallback(
    (id: string, qty: number) => {
      const q = clampQty(qty);
      update((prev) =>
        q === 0 ? prev.filter((i) => i.id !== id) : prev.map((i) => (i.id === id ? { ...i, qty: q } : i)),
      );
    },
    [update],
  );

  const remove = useCallback((id: string) => update((prev) => prev.filter((i) => i.id !== id)), [update]);
  const clear = useCallback(() => update(() => []), [update]);
  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const value = useMemo<CartValue>(() => {
    const lines: CartLine[] = [];
    for (const item of items) {
      const product = productById.get(item.id);
      if (!product || product.price == null) continue;
      const unitCents = toCents(product.price);
      lines.push({ product, qty: item.qty, unitCents, lineCents: unitCents * item.qty });
    }
    return {
      items,
      lines,
      count: lines.reduce((n, l) => n + l.qty, 0),
      subtotalCents: lines.reduce((n, l) => n + l.lineCents, 0),
      add,
      setQty,
      remove,
      clear,
      drawerOpen,
      openDrawer,
      closeDrawer,
    };
  }, [items, add, setQty, remove, clear, drawerOpen, openDrawer, closeDrawer]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart(): CartValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within <CartProvider>");
  return ctx;
}
