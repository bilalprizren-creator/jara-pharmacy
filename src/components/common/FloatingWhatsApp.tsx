import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { useI18n } from "@/context/I18nContext";
import { useInquiry } from "@/context/InquiryContext";
import { whatsappHref, generalInquiryMessage, productInquiryMessage } from "@/lib/links";
import { trackInquiry } from "@/lib/track";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/**
 * Fixed WhatsApp quick-contact FAB. If a product is active in the inquiry
 * flow, the pre-filled message becomes product-specific.
 */
export function FloatingWhatsApp() {
  const { locale, c } = useI18n();
  const { inquiryProduct } = useInquiry();
  const reduced = useReducedMotion();

  const message = inquiryProduct
    ? productInquiryMessage(locale, inquiryProduct.name)
    : generalInquiryMessage(locale);

  return (
    <motion.a
      href={whatsappHref(message)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackInquiry("whatsapp", "floating_fab", inquiryProduct)}
      aria-label={c.fab_whatsapp}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.8, type: "spring", stiffness: 260, damping: 20 }}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.95 }}
      className="pb-safe fixed right-4 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-fab sm:right-6"
    >
      {!reduced && (
        <span
          className="absolute inset-0 rounded-full bg-[#25D366] opacity-70 motion-safe:animate-pulse-ring"
          aria-hidden="true"
        />
      )}
      <MessageCircle className="relative h-7 w-7" aria-hidden="true" />
      <span className="sr-only">{c.fab_whatsapp}</span>
    </motion.a>
  );
}
