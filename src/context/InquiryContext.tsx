import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Product } from "@/types";
import { prefersReducedMotion } from "@/lib/dom";

interface InquiryValue {
  /** Product currently open in the detail modal (null = closed). */
  modalProduct: Product | null;
  openModal: (product: Product) => void;
  closeModal: () => void;

  /** Product pre-filled into the contact form / inquiry flow. */
  inquiryProduct: Product | null;
  /** Select a product for inquiry and scroll the contact form into view. */
  selectForInquiry: (product: Product) => void;
  clearInquiry: () => void;
}

const InquiryContext = createContext<InquiryValue | null>(null);

export function InquiryProvider({ children }: { children: ReactNode }) {
  const [modalProduct, setModalProduct] = useState<Product | null>(null);
  const [inquiryProduct, setInquiryProduct] = useState<Product | null>(null);

  const openModal = useCallback((product: Product) => setModalProduct(product), []);
  const closeModal = useCallback(() => setModalProduct(null), []);
  const clearInquiry = useCallback(() => setInquiryProduct(null), []);

  const selectForInquiry = useCallback((product: Product) => {
    setInquiryProduct(product);
    setModalProduct(null);
    // Defer so the form can mount/update before we scroll to it.
    window.requestAnimationFrame(() => {
      const target = document.getElementById("contact");
      target?.scrollIntoView({
        behavior: prefersReducedMotion() ? "auto" : "smooth",
        block: "start",
      });
    });
  }, []);

  const value = useMemo<InquiryValue>(
    () => ({
      modalProduct,
      openModal,
      closeModal,
      inquiryProduct,
      selectForInquiry,
      clearInquiry,
    }),
    [modalProduct, inquiryProduct, openModal, closeModal, selectForInquiry, clearInquiry],
  );

  return <InquiryContext.Provider value={value}>{children}</InquiryContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useInquiry(): InquiryValue {
  const ctx = useContext(InquiryContext);
  if (!ctx) throw new Error("useInquiry must be used within <InquiryProvider>");
  return ctx;
}
