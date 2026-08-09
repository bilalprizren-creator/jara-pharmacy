import { useState } from "react";
import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { useI18n } from "@/context/I18nContext";
import { useInquiry } from "@/context/InquiryContext";
import { whatsappHref, generalInquiryMessage, productInquiryMessage } from "@/lib/links";
import { trackInquiry } from "@/lib/track";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useInView } from "@/hooks/useInView";
import { cn } from "@/lib/cn";

/**
 * Fixed WhatsApp quick-contact FAB. If a product is active in the inquiry
 * flow, the pre-filled message becomes product-specific.
 *
 * It steps aside over the contact section: on a phone it otherwise sits on top
 * of the inquiry form's submit button and swallows the tap.
 */
export function FloatingWhatsApp() {
  const { locale, c } = useI18n();
  const { inquiryProduct } = useInquiry();
  const reduced = useReducedMotion();
  const hidden = useInView("contact");
  // The 0.8s entrance delay is for the first appearance only — hiding and
  // returning over the contact section should feel immediate.
  const [appeared, setAppeared] = useState(false);

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
      aria-hidden={hidden}
      tabIndex={hidden ? -1 : undefined}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={hidden ? { opacity: 0, scale: 0.6 } : { opacity: 1, scale: 1 }}
      transition={{
        delay: appeared ? 0 : 0.8,
        type: "spring",
        stiffness: 260,
        damping: 20,
      }}
      onAnimationComplete={() => setAppeared(true)}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "pb-safe fixed right-4 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-fab sm:right-6",
        hidden && "pointer-events-none",
      )}
    >
      {!reduced && !hidden && (
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
