import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  Clock,
  CreditCard,
  MapPin,
  MessageCircle,
  PackageCheck,
  RefreshCw,
  Store,
  XCircle,
} from "lucide-react";
import { useI18n } from "@/context/I18nContext";
import { publicBranches } from "@/data/locations";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/shop/PageHeader";
import { usePageMeta } from "@/hooks/usePageMeta";
import { branchName } from "@/lib/branches";
import { whatsappHref } from "@/lib/links";
import { formatEur } from "@/lib/money";
import { getOrder, retryPayment, ShopApiError } from "@/lib/shopApi";
import { cn } from "@/lib/cn";
import type { OrderStatus as Status, OrderView } from "@/types/shop";

const POLL_MS = 2000;
const POLL_LIMIT = 15;

/**
 * /porosia/<id> — where the customer lands after paying (or after placing a
 * cash order). The gateway's redirect only says what the *browser* saw; the
 * order's real status comes from our API, which the payment webhook updates
 * and which double-checks with the gateway itself while a payment is still
 * pending. So this page simply asks, and asks again for a little while.
 */
export function OrderStatus({ id }: { id: string }) {
  const { c, locale, fmt, tr } = useI18n();
  usePageMeta({ title: c.order_number, noindex: true });

  const [order, setOrder] = useState<OrderView | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [polls, setPolls] = useState(0);
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState(false);

  // What the gateway redirect claimed — only a hint while the first fetch runs.
  const hint = useMemo(() => new URLSearchParams(window.location.search).get("pagesa"), []);

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;

    const load = async () => {
      try {
        const next = await getOrder(id);
        if (cancelled) return;
        setOrder(next);
        if (next.status === "pending_payment" && polls < POLL_LIMIT) {
          timer = window.setTimeout(() => setPolls((n) => n + 1), POLL_MS);
        }
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ShopApiError && err.status === 404) setNotFound(true);
        else if (polls < POLL_LIMIT) timer = window.setTimeout(() => setPolls((n) => n + 1), POLL_MS);
      }
    };
    void load();

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [id, polls]);

  const retry = async () => {
    setRetrying(true);
    setRetryError(false);
    try {
      const { paymentUrl } = await retryPayment(id, locale);
      window.location.assign(paymentUrl);
    } catch {
      setRetryError(true);
      setRetrying(false);
    }
  };

  const status: Status | "loading" | "missing" = notFound
    ? "missing"
    : order
      ? order.status
      : hint === "anuluar"
        ? "cancelled"
        : "loading";

  const view = statusView(status, c);
  const Icon = view.icon;
  const canRetry =
    order?.paymentMethod === "card" && (status === "payment_failed" || status === "cancelled");

  return (
    <>
      <PageHeader
        eyebrow={order ? `${c.order_number} ${order.number}` : c.order_number}
        title={view.title}
        subtitle={view.body}
        icon={<Icon className="h-4 w-4" aria-hidden="true" />}
      />

      <section className="bg-surface-soft py-10 sm:py-14">
        <Container>
          <div className="mx-auto max-w-2xl">
            <div className="rounded-2xl border border-line bg-white p-5 shadow-card sm:p-7">
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={cn(
                    "inline-flex h-12 w-12 items-center justify-center rounded-full",
                    view.tone,
                  )}
                >
                  <Icon className={cn("h-6 w-6", status === "pending_payment" || status === "loading" ? "animate-spin" : "")} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{c.order_number}</p>
                  <p className="text-xl font-extrabold text-ink-strong">{order?.number ?? "…"}</p>
                </div>
                {order && (
                  <span className={cn("rounded-full px-3 py-1 text-xs font-bold", view.tone)}>
                    {view.label}
                  </span>
                )}
              </div>

              {canRetry && (
                <div className="mt-5 rounded-xl bg-surface-soft p-4">
                  <Button
                    onClick={retry}
                    disabled={retrying}
                    variant="primary"
                    fullWidth
                    leftIcon={<RefreshCw className={cn("h-4 w-4", retrying && "animate-spin")} aria-hidden="true" />}
                  >
                    {c.order_retry}
                  </Button>
                  {retryError && (
                    <p role="alert" className="mt-2 text-center text-xs font-medium text-rose">
                      {c.checkout_error_generic}
                    </p>
                  )}
                </div>
              )}

              {order && (
                <>
                  <h2 className="mt-6 text-sm font-bold uppercase tracking-wide text-ink-muted">{c.order_items}</h2>
                  <ul className="mt-2 divide-y divide-line">
                    {order.items.map((line) => (
                      <li key={line.id} className="flex items-baseline justify-between gap-3 py-2.5 text-sm">
                        <span className="text-ink-strong">
                          <span className="font-bold tabular-nums text-forest">{line.qty}×</span> {line.name}
                        </span>
                        <span className="shrink-0 font-semibold tabular-nums">
                          {formatEur(line.unitCents * line.qty, locale)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <dl className="mt-3 space-y-1.5 border-t border-line pt-3 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-ink-muted">{c.cart_subtotal}</dt>
                      <dd className="tabular-nums">{formatEur(order.totals.subtotalCents, locale)}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-ink-muted">{c.checkout_delivery}</dt>
                      <dd className="tabular-nums">
                        {order.totals.deliveryCents === 0 ? c.checkout_free : formatEur(order.totals.deliveryCents, locale)}
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-3 pt-1">
                      <dt className="font-bold text-ink-strong">{c.checkout_total}</dt>
                      <dd className="text-xl font-extrabold tabular-nums text-forest">
                        {formatEur(order.totals.totalCents, locale)}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <InfoCard
                      icon={order.fulfilment.method === "pickup" ? Store : MapPin}
                      label={order.fulfilment.method === "pickup" ? c.order_pickup_at : c.order_delivery_to}
                    >
                      {order.fulfilment.method === "pickup"
                        ? branchLabel(order.fulfilment.branchId)
                        : `${order.fulfilment.street}, ${order.fulfilment.city}`}
                      {order.fulfilment.method !== "pickup" && order.fulfilment.note && (
                        <span className="block text-xs text-ink-muted">{order.fulfilment.note}</span>
                      )}
                    </InfoCard>
                    <InfoCard
                      icon={order.paymentMethod === "card" ? CreditCard : Banknote}
                      label={c.order_payment}
                    >
                      {order.paymentMethod === "card" ? c.order_payment_card : c.order_payment_cash}
                    </InfoCard>
                    <InfoCard icon={PackageCheck} label={c.order_customer} className="sm:col-span-2">
                      {order.customer.name} · {order.customer.phone}
                      {order.customer.email && (
                        <span className="block text-xs text-ink-muted">{order.customer.email}</span>
                      )}
                    </InfoCard>
                  </div>
                </>
              )}

              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                <Button
                  href={whatsappHref(fmt("order_whatsapp_message", { number: order?.number ?? id }))}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="whatsapp"
                  leftIcon={<MessageCircle className="h-4 w-4" aria-hidden="true" />}
                >
                  {c.order_whatsapp}
                </Button>
                <Button
                  href="/#products"
                  variant="outline"
                  leftIcon={<ArrowLeft className="h-4 w-4" aria-hidden="true" />}
                >
                  {c.order_back}
                </Button>
              </div>
            </div>

            <p className="mt-4 text-center text-xs text-ink-muted">{tr({ al: "Ruajeni këtë lidhje — është faqja e porosisë suaj.", en: "Keep this link — it is your order's page." })}</p>
          </div>
        </Container>
      </section>
    </>
  );
}

function branchLabel(branchId: string): string {
  const branch = publicBranches.find((b) => b.id === branchId);
  return branch ? `${branchName(branch)} · ${branch.address}` : branchId;
}

function InfoCard({
  icon: Icon,
  label,
  children,
  className,
}: {
  icon: typeof Store;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start gap-3 rounded-xl border border-line bg-surface-soft p-4", className)}>
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-forest shadow-soft">
        <Icon className="h-4.5 w-4.5" aria-hidden="true" />
      </span>
      <div className="min-w-0 text-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{label}</p>
        <p className="mt-0.5 font-semibold text-ink-strong">{children}</p>
      </div>
    </div>
  );
}

type Copy = ReturnType<typeof useI18n>["c"];

function statusView(status: Status | "loading" | "missing", c: Copy) {
  switch (status) {
    case "paid":
    case "done":
      return { icon: CheckCircle2, tone: "bg-successsoft text-forest", title: c.order_paid_title, body: c.order_paid_body, label: status === "done" ? c.order_status_done : c.order_status_paid };
    case "new":
      return { icon: PackageCheck, tone: "bg-successsoft text-forest", title: c.order_new_title, body: c.order_new_body, label: c.order_status_new };
    case "payment_failed":
      return { icon: XCircle, tone: "bg-rose-blush text-rose", title: c.order_failed_title, body: c.order_failed_body, label: c.order_status_failed };
    case "cancelled":
      return { icon: XCircle, tone: "bg-warningsoft text-ink-strong", title: c.order_cancelled_title, body: c.order_cancelled_body, label: c.order_status_cancelled };
    case "missing":
      return { icon: XCircle, tone: "bg-rose-blush text-rose", title: c.order_not_found_title, body: c.order_not_found_body, label: "" };
    case "pending_payment":
    case "loading":
    default:
      return { icon: Clock, tone: "bg-warningsoft text-ink-strong", title: c.order_pending_title, body: c.order_pending_body, label: c.order_status_pending };
  }
}
