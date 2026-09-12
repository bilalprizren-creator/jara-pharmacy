import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  Banknote,
  CreditCard,
  Lock,
  MapPin,
  ShoppingBag,
  Store,
  Trash2,
  Truck,
} from "lucide-react";
import { useI18n } from "@/context/I18nContext";
import { useCart } from "@/context/CartContext";
import { kosovoCities, LOCAL_CITY, shippingMethods } from "@/data/shipping";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { ProductMedia } from "@/components/ui/ProductMedia";
import { PageHeader } from "@/components/shop/PageHeader";
import { PaymentLogos } from "@/components/shop/PaymentLogos";
import { QtyStepper } from "@/components/shop/QtyStepper";
import { ChoiceCard, Field, inputClass, StepTitle } from "@/components/shop/form";
import { usePageMeta } from "@/hooks/usePageMeta";
import { branchesByNumber, branchName } from "@/lib/branches";
import { formatEur } from "@/lib/money";
import { computeTotals, deliveryFee, priceLines } from "@/lib/orderTotals";
import { legalPath, orderPath } from "@/lib/routes";
import { createOrder } from "@/lib/shopApi";
import { trackShop } from "@/lib/track";
import type { OrderFulfilment, ShippingMethodId } from "@/types/shop";

const OTHER_CITY = "__other";

/**
 * /porosia — the checkout. One page, three cards: the cart, the details, the
 * payment; a sticky summary on the side. The form only collects what the
 * server needs; every amount shown here is an estimate the server recomputes
 * from the same price list and shipping table before anything is charged.
 */
export function Checkout() {
  const { c, tr, locale, fmt } = useI18n();
  const { lines, items, count, setQty, remove, clear } = useCart();
  usePageMeta({ title: c.checkout_title, noindex: true });

  const [submitError, setSubmitError] = useState<string | null>(null);

  const schema = useMemo(
    () =>
      z
        .object({
          name: z.string().trim().min(2, c.checkout_error_name),
          phone: z
            .string()
            .trim()
            .regex(/^\+?[\d\s()./-]{8,20}$/, c.checkout_error_phone),
          email: z.union([z.literal(""), z.string().trim().email(c.checkout_error_email)]),
          method: z.enum(["pickup", "prizren", "kosovo"]),
          branchId: z.string(),
          street: z.string().trim(),
          city: z.string(),
          cityOther: z.string().trim(),
          note: z.string().trim().max(300),
          paymentMethod: z.enum(["card", "cash"]),
          acceptTerms: z.boolean().refine((v) => v, c.checkout_error_terms),
          website: z.string().max(0),
        })
        .superRefine((d, ctx) => {
          if (d.method === "pickup") {
            if (!d.branchId) ctx.addIssue({ code: "custom", path: ["branchId"], message: c.checkout_error_branch });
            return;
          }
          if (d.street.length < 3) ctx.addIssue({ code: "custom", path: ["street"], message: c.checkout_error_street });
          if (d.method === "kosovo") {
            if (!d.city) ctx.addIssue({ code: "custom", path: ["city"], message: c.checkout_error_city });
            if (d.city === OTHER_CITY && d.cityOther.length < 2) {
              ctx.addIssue({ code: "custom", path: ["cityOther"], message: c.checkout_error_city });
            }
          }
        }),
    [c],
  );
  type FormValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      method: "pickup",
      branchId: "",
      street: "",
      city: "",
      cityOther: "",
      note: "",
      paymentMethod: "card",
      acceptTerms: false,
      website: "",
    },
  });

  const method = watch("method");
  const paymentMethod = watch("paymentMethod");
  const city = watch("city");

  // Same math the server runs, so the estimate on screen is what gets charged.
  const totals = useMemo(() => computeTotals(priceLines(items), method), [items, method]);
  const empty = lines.length === 0;

  const onSubmit = async (data: FormValues) => {
    setSubmitError(null);
    if (empty) {
      setSubmitError(c.checkout_error_empty);
      return;
    }

    const fulfilment: OrderFulfilment =
      data.method === "pickup"
        ? { method: "pickup", branchId: data.branchId }
        : {
            method: data.method,
            street: data.street,
            city:
              data.method === "prizren"
                ? LOCAL_CITY
                : data.city === OTHER_CITY
                  ? data.cityOther
                  : data.city,
            note: data.note || undefined,
          };

    try {
      const result = await createOrder({
        locale,
        items,
        customer: { name: data.name, phone: data.phone, email: data.email || undefined },
        fulfilment,
        paymentMethod: data.paymentMethod,
        acceptTerms: data.acceptTerms,
        website: data.website,
      });
      trackShop("order_placed", { items: count, method: data.paymentMethod, totalCents: totals.totalCents });
      clear();
      window.location.assign(result.paymentUrl ?? orderPath(result.id));
    } catch {
      setSubmitError(c.checkout_error_generic);
    }
  };

  const enabledMethods = shippingMethods.filter((m) => m.enabled);
  const methodIcon: Record<ShippingMethodId, typeof Truck> = { pickup: Store, prizren: MapPin, kosovo: Truck };

  return (
    <>
      <PageHeader
        eyebrow={c.checkout_eyebrow}
        title={c.checkout_title}
        subtitle={c.checkout_subtitle}
        icon={<ShoppingBag className="h-4 w-4" aria-hidden="true" />}
      />

      <section className="bg-surface-soft py-10 sm:py-14">
        <Container>
          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr),22rem] lg:gap-8"
          >
            <div className="flex min-w-0 flex-col gap-6">
              {/* 1 · Cart */}
              <div className="rounded-2xl border border-line bg-white p-5 shadow-soft sm:p-6">
                <StepTitle step={1}>{c.checkout_step_cart}</StepTitle>
                {empty ? (
                  <div className="mt-5 rounded-xl bg-surface-soft p-6 text-center">
                    <p className="font-bold text-ink-strong">{c.cart_empty_title}</p>
                    <p className="mt-1 text-sm text-ink-muted">{c.cart_empty}</p>
                    <Button
                      href="/#products"
                      variant="outline"
                      className="mt-4"
                      leftIcon={<ArrowLeft className="h-4 w-4" aria-hidden="true" />}
                    >
                      {c.checkout_back}
                    </Button>
                  </div>
                ) : (
                  <ul className="mt-4 divide-y divide-line">
                    {lines.map(({ product, qty, lineCents }) => (
                      <li key={product.id} className="flex gap-3 py-4 first:pt-2 last:pb-0">
                        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-line">
                          <ProductMedia visual={product.visual} image={product.image} alt="" rounded="rounded-lg" />
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-emerald2">
                            {tr(product.categoryLabel)}
                          </p>
                          <p className="mt-0.5 text-sm font-bold leading-snug text-ink-strong">{product.name}</p>
                          <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2">
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
                )}
              </div>

              {/* 2 · Details & delivery */}
              <div className="rounded-2xl border border-line bg-white p-5 shadow-soft sm:p-6">
                <StepTitle step={2}>{c.checkout_step_details}</StepTitle>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <Field label={c.checkout_name} error={errors.name?.message}>
                    <input
                      type="text"
                      autoComplete="name"
                      placeholder={c.form_placeholder_name}
                      aria-invalid={!!errors.name}
                      className={inputClass(!!errors.name)}
                      {...register("name")}
                    />
                  </Field>
                  <Field label={c.checkout_phone} error={errors.phone?.message}>
                    <input
                      type="tel"
                      autoComplete="tel"
                      inputMode="tel"
                      placeholder={c.form_placeholder_phone}
                      aria-invalid={!!errors.phone}
                      className={inputClass(!!errors.phone)}
                      {...register("phone")}
                    />
                  </Field>
                  <Field
                    label={c.checkout_email}
                    hint={c.checkout_email_hint}
                    error={errors.email?.message}
                    className="sm:col-span-2"
                  >
                    <input
                      type="email"
                      autoComplete="email"
                      inputMode="email"
                      aria-invalid={!!errors.email}
                      className={inputClass(!!errors.email)}
                      {...register("email")}
                    />
                  </Field>
                </div>

                <h3 className="mt-6 text-sm font-semibold text-ink-strong">{c.checkout_delivery_title}</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label={c.checkout_delivery_title}>
                  {enabledMethods.map((m) => {
                    const Icon = methodIcon[m.id];
                    const fee = deliveryFee(m.id, totals.subtotalCents);
                    return (
                      <ChoiceCard
                        key={m.id}
                        icon={<Icon className="h-5 w-5" aria-hidden="true" />}
                        title={tr(m.title)}
                        description={tr(m.eta)}
                        aside={fee === 0 ? c.checkout_free : formatEur(fee, locale)}
                        checked={method === m.id}
                        value={m.id}
                        {...register("method")}
                      />
                    );
                  })}
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {method === "pickup" ? (
                    <Field label={c.checkout_branch} error={errors.branchId?.message} className="sm:col-span-2">
                      <select
                        aria-invalid={!!errors.branchId}
                        className={inputClass(!!errors.branchId)}
                        {...register("branchId")}
                      >
                        <option value="">{c.checkout_branch_placeholder}</option>
                        {branchesByNumber.map((b) => (
                          <option key={b.id} value={b.id}>
                            {branchName(b)} · {b.address}
                          </option>
                        ))}
                      </select>
                    </Field>
                  ) : (
                    <>
                      <Field label={c.checkout_street} error={errors.street?.message} className="sm:col-span-2">
                        <input
                          type="text"
                          autoComplete="street-address"
                          aria-invalid={!!errors.street}
                          className={inputClass(!!errors.street)}
                          {...register("street")}
                        />
                      </Field>
                      {method === "kosovo" && (
                        <>
                          <Field label={c.checkout_city} error={errors.city?.message}>
                            <select
                              aria-invalid={!!errors.city}
                              className={inputClass(!!errors.city)}
                              {...register("city", {
                                onChange: (e) => {
                                  if (e.target.value !== OTHER_CITY) setValue("cityOther", "");
                                },
                              })}
                            >
                              <option value="">—</option>
                              {kosovoCities.map((name) => (
                                <option key={name} value={name}>
                                  {name}
                                </option>
                              ))}
                              <option value={OTHER_CITY}>{c.checkout_city_other}</option>
                            </select>
                          </Field>
                          {city === OTHER_CITY && (
                            <Field label={c.checkout_city_other} error={errors.cityOther?.message}>
                              <input
                                type="text"
                                autoComplete="address-level2"
                                aria-invalid={!!errors.cityOther}
                                className={inputClass(!!errors.cityOther)}
                                {...register("cityOther")}
                              />
                            </Field>
                          )}
                        </>
                      )}
                      <Field label={c.checkout_note} className="sm:col-span-2">
                        <input
                          type="text"
                          placeholder={c.checkout_note_placeholder}
                          className={inputClass(false)}
                          {...register("note")}
                        />
                      </Field>
                    </>
                  )}
                </div>
              </div>

              {/* 3 · Payment */}
              <div className="rounded-2xl border border-line bg-white p-5 shadow-soft sm:p-6">
                <StepTitle step={3}>{c.checkout_step_payment}</StepTitle>
                <div className="mt-5 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label={c.checkout_payment_title}>
                  <ChoiceCard
                    icon={<CreditCard className="h-5 w-5" aria-hidden="true" />}
                    title={c.checkout_pay_card}
                    description={c.checkout_pay_card_sub}
                    checked={paymentMethod === "card"}
                    value="card"
                    {...register("paymentMethod")}
                  />
                  <ChoiceCard
                    icon={<Banknote className="h-5 w-5" aria-hidden="true" />}
                    title={c.checkout_pay_cash}
                    description={c.checkout_pay_cash_sub}
                    checked={paymentMethod === "cash"}
                    value="cash"
                    {...register("paymentMethod")}
                  />
                </div>
                {paymentMethod === "card" && (
                  <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-ink-muted">
                    <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    {c.checkout_secure}
                  </p>
                )}

                <label className="mt-5 flex items-start gap-3 text-sm text-ink-strong">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4.5 w-4.5 shrink-0 rounded border-line text-forest focus:ring-lime"
                    {...register("acceptTerms")}
                  />
                  <span>
                    {c.checkout_terms}{" "}
                    <a href={legalPath("kushtet-e-blerjes")} target="_blank" rel="noopener" className="font-semibold text-forest underline-offset-2 hover:underline">
                      {tr({ al: "Kushtet", en: "Terms" })}
                    </a>
                    {" · "}
                    <a href={legalPath("privatesia")} target="_blank" rel="noopener" className="font-semibold text-forest underline-offset-2 hover:underline">
                      {tr({ al: "Privatësia", en: "Privacy" })}
                    </a>
                  </span>
                </label>
                {errors.acceptTerms && (
                  <p role="alert" className="mt-1.5 text-xs font-medium text-rose">
                    {errors.acceptTerms.message}
                  </p>
                )}

                {/* Honeypot: invisible to people, irresistible to bots. */}
                <div className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
                  <label>
                    Website
                    <input type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
                  </label>
                </div>
              </div>
            </div>

            {/* Summary */}
            <aside className="rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6 lg:sticky lg:top-24">
              <h2 className="text-lg font-extrabold text-ink-strong">{c.checkout_summary}</h2>
              <p className="mt-0.5 text-sm text-ink-muted">
                {count === 1 ? fmt("cart_count_one", { count }) : fmt("cart_count_many", { count })}
              </p>

              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-muted">{c.cart_subtotal}</dt>
                  <dd className="font-semibold tabular-nums text-ink-strong">{formatEur(totals.subtotalCents, locale)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-muted">{c.checkout_delivery}</dt>
                  <dd className="font-semibold tabular-nums text-ink-strong">
                    {totals.deliveryCents === 0 ? c.checkout_free : formatEur(totals.deliveryCents, locale)}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-3 border-t border-line pt-3">
                  <dt className="font-bold text-ink-strong">{c.checkout_total}</dt>
                  <dd className="text-2xl font-extrabold tabular-nums text-forest">{formatEur(totals.totalCents, locale)}</dd>
                </div>
              </dl>
              <p className="mt-1 text-xs text-ink-muted">{c.checkout_vat}</p>

              {submitError && (
                <p role="alert" className="mt-4 rounded-xl bg-rose-blush px-4 py-3 text-sm font-medium text-rose">
                  {submitError}
                </p>
              )}

              <Button
                type="submit"
                variant={paymentMethod === "card" ? "primary" : "lime"}
                size="lg"
                fullWidth
                disabled={empty || isSubmitting}
                className="mt-5"
                leftIcon={
                  paymentMethod === "card" ? (
                    <Lock className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Banknote className="h-4 w-4" aria-hidden="true" />
                  )
                }
              >
                {isSubmitting
                  ? c.checkout_submitting
                  : paymentMethod === "card"
                    ? c.checkout_submit_card
                    : c.checkout_submit_cash}
              </Button>

              <PaymentLogos className="mt-5 justify-center" />

              <a
                href="/#products"
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-forest hover:text-forest-600"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                {c.checkout_back}
              </a>
            </aside>
          </form>
        </Container>
      </section>
    </>
  );
}
