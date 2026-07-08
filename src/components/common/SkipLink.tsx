import { useI18n } from "@/context/I18nContext";

/** Keyboard-accessible skip-to-content link (visible only when focused). */
export function SkipLink() {
  const { locale } = useI18n();
  const label = locale === "al" ? "Kalo te përmbajtja" : "Skip to content";
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-full focus:bg-forest focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lift"
    >
      {label}
    </a>
  );
}
