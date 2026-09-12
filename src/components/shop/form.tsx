import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

/** Label + control + inline error, same look as the contact form. */
export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-sm font-semibold text-ink-strong">{label}</span>
      {children}
      {hint && !error && <span className="text-xs text-ink-muted">{hint}</span>}
      {error && (
        <span role="alert" className="text-xs font-medium text-rose">
          {error}
        </span>
      )}
    </label>
  );
}

export function inputClass(hasError: boolean): string {
  return cn(
    "h-11 w-full rounded-xl border bg-white px-4 text-sm text-ink-strong outline-none transition",
    "placeholder:text-ink-muted focus:ring-2 focus:ring-lime/40",
    hasError ? "border-rose focus:border-rose" : "border-line focus:border-forest/40",
  );
}

type ChoiceCardProps = {
  icon: ReactNode;
  title: string;
  description?: string;
  /** Right-aligned extra, e.g. the delivery fee. */
  aside?: ReactNode;
  checked: boolean;
  className?: string;
} & Omit<ComponentPropsWithoutRef<"input">, "type" | "className" | "title">;

/**
 * A radio option drawn as a card — delivery method, payment method. The
 * input stays a real radio (keyboard, screen readers, form libraries); the
 * card is its label, the ring shows the checked state. forwardRef so
 * react-hook-form's `register()` reaches the input.
 */
export const ChoiceCard = forwardRef<HTMLInputElement, ChoiceCardProps>(function ChoiceCard(
  { icon, title, description, aside, checked, className, ...input },
  ref,
) {
  return (
    <label
      className={cn(
        "relative flex cursor-pointer items-start gap-3 rounded-xl border bg-white p-4 transition",
        checked
          ? "border-forest ring-2 ring-forest/15 shadow-card"
          : "border-line shadow-soft hover:border-forest/40",
        className,
      )}
    >
      <input ref={ref} type="radio" className="peer sr-only" checked={checked} {...input} />
      <span
        className={cn(
          "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors",
          checked ? "bg-forest text-white" : "bg-forest/5 text-forest",
        )}
        aria-hidden="true"
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-3">
          <span className="text-sm font-bold text-ink-strong">{title}</span>
          {aside && <span className="shrink-0 text-sm font-bold text-forest">{aside}</span>}
        </span>
        {description && (
          <span className="mt-0.5 block text-xs leading-relaxed text-ink-muted">{description}</span>
        )}
      </span>
      <span
        className={cn(
          "absolute -right-1.5 -top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-lime text-deep shadow-soft transition",
          checked ? "scale-100 opacity-100" : "scale-50 opacity-0",
          "peer-focus-visible:ring-2 peer-focus-visible:ring-lime peer-focus-visible:ring-offset-2",
        )}
        aria-hidden="true"
      >
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </span>
    </label>
  );
});

/** Numbered step title used by the checkout cards. */
export function StepTitle({ step, children }: { step: number; children: ReactNode }) {
  return (
    <h2 className="flex items-center gap-3 text-lg font-extrabold text-ink-strong">
      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-forest text-sm font-bold text-white">
        {step}
      </span>
      {children}
    </h2>
  );
}
