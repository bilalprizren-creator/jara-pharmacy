import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Centered content wrapper with the ~1280px max width and responsive gutters. */
export function Container({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-content px-5 sm:px-6 lg:px-8", className)}>
      {children}
    </div>
  );
}
