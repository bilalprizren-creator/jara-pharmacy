import { useI18n } from "@/context/I18nContext";
import { cn } from "@/lib/cn";
import type { Locale } from "@/types";

/** Compact segmented AL / EN switch. */
export function LanguageToggle({
  className,
  tone = "light",
}: {
  className?: string;
  tone?: "light" | "onDark";
}) {
  const { locale, setLocale, c } = useI18n();
  const options: { value: Locale; label: string }[] = [
    { value: "al", label: "AL" },
    { value: "en", label: "EN" },
  ];

  const onDark = tone === "onDark";

  return (
    <div
      role="group"
      aria-label={c.lang_switch}
      className={cn(
        "inline-flex items-center rounded-full p-0.5",
        onDark ? "bg-white/10 ring-1 ring-white/20" : "bg-surface-soft ring-1 ring-line",
        className,
      )}
    >
      {options.map((opt) => {
        const selected = locale === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setLocale(opt.value)}
            aria-pressed={selected}
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-bold transition-all duration-300",
              selected
                ? "bg-lime text-deep shadow-sm"
                : onDark
                  ? "text-white/70 hover:text-white"
                  : "text-ink-muted hover:text-forest",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
