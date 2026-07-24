import { useRef } from "react";
import { Check, MessageCircle, Phone, Send, Info } from "lucide-react";
import type { Product } from "@/types";
import { useI18n } from "@/context/I18nContext";
import { useInquiry } from "@/context/InquiryContext";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProductMedia } from "@/components/ui/ProductMedia";
import { brand } from "@/data/brand";
import { telHref, whatsappHref, productInquiryMessage } from "@/lib/links";
import { trackInquiry } from "@/lib/track";

export function ProductModal() {
  const { locale, c, tr } = useI18n();
  const { modalProduct, closeModal, selectForInquiry } = useInquiry();

  // Keep the last product mounted during the exit animation.
  const lastRef = useRef<Product | null>(null);
  if (modalProduct) lastRef.current = modalProduct;
  const product = modalProduct ?? lastRef.current;

  const titleId = "product-modal-title";

  return (
    <Modal open={!!modalProduct} onClose={closeModal} labelledBy={titleId} closeLabel={c.nav_close}>
      {product && (
        <div>
          <div className="relative aspect-[16/10] w-full overflow-hidden sm:aspect-[16/9]">
            <ProductMedia
              visual={product.visual}
              image={product.image}
              alt={product.name}
              rounded="rounded-none"
            />
            {product.badge && (
              <span className="absolute left-4 top-4">
                <Badge tone="lime">{tr(product.badge)}</Badge>
              </span>
            )}
          </div>

          <div className="p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald2">
              {tr(product.categoryLabel)}
              {product.brand ? ` · ${product.brand}` : ""}
            </p>
            <h2 id={titleId} className="mt-1 text-xl font-extrabold text-ink-strong sm:text-2xl">
              {product.name}
            </h2>
            {product.shortDescription && (
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                {tr(product.shortDescription)}
              </p>
            )}

            {/* Specs — only rendered for fields that actually exist (imported products). */}
            {(product.productCode || product.packageSize) && (
              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
                {product.productCode && (
                  <div>
                    <dt className="text-[0.7rem] font-semibold uppercase tracking-wide text-ink-muted">
                      {tr({ al: "Kodi i produktit", en: "Product code" })}
                    </dt>
                    <dd className="mt-0.5 text-sm font-semibold text-ink-strong">
                      {product.productCode}
                    </dd>
                  </div>
                )}
                {product.packageSize && (
                  <div>
                    <dt className="text-[0.7rem] font-semibold uppercase tracking-wide text-ink-muted">
                      {tr({ al: "Madhësia e paketimit", en: "Package size" })}
                    </dt>
                    <dd className="mt-0.5 text-sm font-semibold text-ink-strong">
                      {product.packageSize}
                    </dd>
                  </div>
                )}
              </dl>
            )}

            {product.benefits && product.benefits[locale].length > 0 && (
              <>
                <h3 className="mt-5 text-sm font-bold text-ink-strong">{c.modal_benefits}</h3>
                {/* Lime callout chips — the signature benefit style of the brand's posts. */}
                <ul className="mt-2.5 flex flex-wrap gap-2">
                  {product.benefits[locale].map((benefit) => (
                    <li
                      key={benefit}
                      className="inline-flex items-center gap-1.5 rounded-full bg-lime px-3.5 py-1.5 text-[13px] font-semibold leading-snug text-deep"
                    >
                      <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </>
            )}

            {product.usage && (
              <div className="mt-5 rounded-xl bg-surface-soft p-4">
                <h3 className="text-sm font-bold text-ink-strong">{c.modal_usage}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-muted">{tr(product.usage)}</p>
              </div>
            )}

            <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-ink-muted">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {c.modal_disclaimer}
            </p>

            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <Button
                href={whatsappHref(productInquiryMessage(locale, product.name))}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackInquiry("whatsapp", "product_modal", product)}
                variant="whatsapp"
                leftIcon={<MessageCircle className="h-4 w-4" aria-hidden="true" />}
              >
                {c.modal_ask_whatsapp}
              </Button>
              <Button
                onClick={() => selectForInquiry(product)}
                variant="primary"
                leftIcon={<Send className="h-4 w-4" aria-hidden="true" />}
              >
                {c.modal_inquiry}
              </Button>
              <Button
                href={telHref(brand.phonePrimary.e164)}
                onClick={() => trackInquiry("call", "product_modal", product)}
                variant="outline"
                leftIcon={<Phone className="h-4 w-4" aria-hidden="true" />}
                className="sm:col-span-2"
              >
                {c.modal_call} · {brand.phonePrimary.label}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
