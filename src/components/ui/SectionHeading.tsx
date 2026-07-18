import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Reveal } from "./Reveal";

/** Consistent eyebrow + title + subtitle block used across all sections. */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
  tone = "dark",
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  align?: "center" | "left";
  tone?: "dark" | "light";
  className?: string;
}) {
  const light = tone === "light";
  return (
    <Reveal
      className={cn(
        "flex flex-col gap-3",
        align === "center" ? "items-center text-center" : "items-start text-left",
        className,
      )}
    >
      {eyebrow && (
        <span
          className={cn(
            "eyebrow",
            light && "text-lime-soft",
          )}
        >
          <span className={cn("h-1 w-1 rounded-full", light ? "bg-lime" : "bg-emerald2")} />
          {eyebrow}
        </span>
      )}
      <h2
        className={cn(
          "text-3xl font-extrabold sm:text-4xl lg:text-[2.75rem] lg:leading-[1.08]",
          light ? "text-white" : "text-ink-strong",
          align === "center" ? "max-w-3xl text-balance" : "max-w-2xl",
        )}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={cn(
            "max-w-2xl text-base leading-relaxed sm:text-lg text-pretty",
            light ? "text-white/70" : "text-ink-muted",
          )}
        >
          {subtitle}
        </p>
      )}
    </Reveal>
  );
}
