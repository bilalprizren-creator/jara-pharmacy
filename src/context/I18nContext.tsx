import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { copy, type CopyKey } from "@/data/copy";
import type { Bilingual, Locale } from "@/types";

const STORAGE_KEY = "jara.locale";

interface I18nValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  toggleLocale: () => void;
  /** Copy dictionary for the active locale (e.g. c.hero_title). */
  c: (typeof copy)[Locale];
  /** Resolve a bilingual value to the active language. */
  tr: (value: Bilingual) => string;
  /** Copy with {count}-style interpolation. */
  fmt: (key: CopyKey, vars: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

function getInitialLocale(): Locale {
  if (typeof window === "undefined") return "al";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "en" ? "en" : "al";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);

  useEffect(() => {
    document.documentElement.lang = locale === "al" ? "sq" : "en";
    window.localStorage.setItem(STORAGE_KEY, locale);
  }, [locale]);

  const setLocale = useCallback((l: Locale) => setLocaleState(l), []);
  const toggleLocale = useCallback(
    () => setLocaleState((prev) => (prev === "al" ? "en" : "al")),
    [],
  );

  const value = useMemo<I18nValue>(() => {
    const dict = copy[locale];
    return {
      locale,
      setLocale,
      toggleLocale,
      c: dict,
      tr: (v: Bilingual) => v[locale],
      fmt: (key, vars) =>
        Object.entries(vars).reduce(
          (str, [k, val]) => str.replace(`{${k}}`, String(val)),
          dict[key] as string,
        ),
    };
  }, [locale, setLocale, toggleLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within <I18nProvider>");
  return ctx;
}
