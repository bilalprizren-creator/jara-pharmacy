import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone,
  Mail,
  MapPin,
  Instagram,
  Clock,
  Send,
  MessageCircle,
  CheckCircle2,
  X,
} from "lucide-react";
import { useI18n } from "@/context/I18nContext";
import { useInquiry } from "@/context/InquiryContext";
import { brand } from "@/data/brand";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import {
  telHref,
  mailtoHref,
  instagramHref,
  whatsappHref,
  contactInquiryMessage,
} from "@/lib/links";
import { trackInquiry } from "@/lib/track";
import { fadeUp, viewportOnce } from "@/lib/motion";

const schema = z.object({
  name: z.string().trim().min(2),
  phone: z
    .string()
    .trim()
    .min(6)
    .regex(/^[+()\d\s-]+$/),
  interest: z.string().trim().optional(),
  message: z.string().trim().min(4),
});
type FormValues = z.infer<typeof schema>;

export function Contact() {
  const { locale, c } = useI18n();
  const { inquiryProduct, clearInquiry } = useInquiry();
  const [submitted, setSubmitted] = useState<FormValues | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", phone: "", interest: "", message: "" },
  });

  // Smart inquiry: when a product is selected elsewhere, prefill the interest.
  useEffect(() => {
    if (inquiryProduct) setValue("interest", inquiryProduct.name, { shouldValidate: false });
  }, [inquiryProduct, setValue]);

  const onSubmit = (data: FormValues) => setSubmitted(data);

  const resetForm = () => {
    setSubmitted(null);
    reset();
    clearInquiry();
  };

  // `onClick` is set only on the phone rows — tapping a number here is a real
  // inquiry, and nothing about it is observable once the dialer takes over.
  const trackCall = () => trackInquiry("call", "contact");

  const contactItems = [
    { icon: Phone, label: c.contact_phone, value: brand.phonePrimary.label, href: telHref(brand.phonePrimary.e164), onClick: trackCall },
    { icon: Phone, label: c.contact_phone, value: brand.phoneSecondary.label, href: telHref(brand.phoneSecondary.e164), onClick: trackCall },
    { icon: Mail, label: c.contact_email, value: brand.email, href: mailtoHref(), onClick: undefined },
    { icon: Instagram, label: "Instagram", value: `@${brand.instagramHandle}`, href: instagramHref(), onClick: undefined },
    { icon: MapPin, label: c.contact_address, value: brand.address.full, href: undefined, onClick: undefined },
    { icon: Clock, label: c.contact_hours, value: c.contact_hours_value, href: undefined, onClick: undefined },
  ];

  return (
    <section id="contact" className="section bg-white" aria-labelledby="contact-heading">
      <Container>
        <SectionHeading
          eyebrow={c.section_contact}
          title={<span id="contact-heading">{c.contact_title}</span>}
          subtitle={c.contact_subtitle}
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {/* Contact details */}
          <motion.ul
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
            className="grid gap-3 sm:grid-cols-2"
          >
            {contactItems.map((item, i) => {
              const Icon = item.icon;
              const inner = (
                <>
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-forest/5 text-forest">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold uppercase tracking-wide text-ink-muted">
                      {item.label}
                    </span>
                    <span className="block break-words text-sm font-semibold text-ink-strong">
                      {item.value}
                    </span>
                  </span>
                </>
              );
              return (
                <li key={i}>
                  {item.href ? (
                    <a
                      href={item.href}
                      onClick={item.onClick}
                      target={item.href.startsWith("http") ? "_blank" : undefined}
                      rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                      className="flex h-full items-center gap-3 rounded-xl border border-line bg-white p-4 shadow-soft transition hover:border-forest/30 hover:shadow-card"
                    >
                      {inner}
                    </a>
                  ) : (
                    <div className="flex h-full items-center gap-3 rounded-xl border border-line bg-surface-soft p-4">
                      {inner}
                    </div>
                  )}
                </li>
              );
            })}
          </motion.ul>

          {/* Inquiry form */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
            className="rounded-2xl border border-line bg-surface-soft p-6 shadow-soft sm:p-8"
          >
            <AnimatePresence mode="wait">
              {submitted ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-4 py-8 text-center"
                >
                  <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-successsoft text-forest">
                    <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-xl font-extrabold text-ink-strong">{c.form_success_title}</p>
                    <p className="mt-1 text-sm text-ink-muted">{c.form_success_body}</p>
                  </div>
                  <Button
                    href={whatsappHref(
                      contactInquiryMessage(locale, {
                        name: submitted.name,
                        phone: submitted.phone,
                        product: submitted.interest,
                        message: submitted.message,
                      }),
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="whatsapp"
                    leftIcon={<MessageCircle className="h-4 w-4" aria-hidden="true" />}
                  >
                    {c.form_send_whatsapp}
                  </Button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="text-sm font-semibold text-forest hover:text-forest-600"
                  >
                    {c.form_send_another}
                  </button>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleSubmit(onSubmit)}
                  noValidate
                  className="flex flex-col gap-4"
                >
                  {inquiryProduct && (
                    <div className="flex items-center justify-between gap-2 rounded-xl bg-lime-soft/60 px-4 py-2.5 text-sm">
                      <span className="min-w-0 truncate text-emerald2">
                        <span className="font-semibold">{c.form_selected_product}:</span>{" "}
                        {inquiryProduct.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          clearInquiry();
                          setValue("interest", "");
                        }}
                        aria-label={c.nav_close}
                        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-emerald2 hover:bg-white/50"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  <Field label={c.form_name} error={errors.name ? c.form_error_name : undefined}>
                    <input
                      type="text"
                      autoComplete="name"
                      placeholder={c.form_placeholder_name}
                      aria-invalid={!!errors.name}
                      className={inputClass(!!errors.name)}
                      {...register("name")}
                    />
                  </Field>

                  <Field label={c.form_phone} error={errors.phone ? c.form_error_phone : undefined}>
                    <input
                      type="tel"
                      autoComplete="tel"
                      placeholder={c.form_placeholder_phone}
                      aria-invalid={!!errors.phone}
                      className={inputClass(!!errors.phone)}
                      {...register("phone")}
                    />
                  </Field>

                  <Field label={c.form_interest}>
                    <input
                      type="text"
                      placeholder={c.form_placeholder_interest}
                      className={inputClass(false)}
                      {...register("interest")}
                    />
                  </Field>

                  <Field label={c.form_message} error={errors.message ? c.form_error_message : undefined}>
                    <textarea
                      rows={4}
                      placeholder={c.form_placeholder_message}
                      aria-invalid={!!errors.message}
                      className={inputClass(!!errors.message) + " !h-auto min-h-[7rem] resize-none py-3"}
                      {...register("message")}
                    />
                  </Field>

                  <Button type="submit" size="lg" fullWidth leftIcon={<Send className="h-4 w-4" aria-hidden="true" />}>
                    {c.form_submit}
                  </Button>
                  <p className="text-center text-xs text-ink-muted">{c.contact_reassurance}</p>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-ink-strong">{label}</span>
      {children}
      {error && <span className="text-xs font-medium text-rose">{error}</span>}
    </label>
  );
}

function inputClass(hasError: boolean): string {
  return [
    "h-11 w-full rounded-xl border bg-white px-4 text-sm text-ink-strong outline-none transition",
    "placeholder:text-ink-muted focus:ring-2 focus:ring-lime/40",
    hasError ? "border-rose focus:border-rose" : "border-line focus:border-forest/40",
  ].join(" ");
}
