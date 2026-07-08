import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "lime" | "outline" | "ghost" | "whatsapp" | "dark" | "glass";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold leading-none " +
  "transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 " +
  "focus-visible:ring-lime focus-visible:ring-offset-2 disabled:opacity-60 " +
  "disabled:pointer-events-none active:scale-[0.98] whitespace-nowrap";

const variants: Record<Variant, string> = {
  primary:
    "bg-forest text-white shadow-soft hover:bg-forest-600 hover:shadow-lift",
  dark: "bg-deep text-white hover:bg-forest-800 shadow-soft",
  lime: "bg-lime text-deep shadow-soft hover:bg-lime-600 hover:shadow-glow",
  outline:
    "border border-line bg-white text-forest hover:border-forest/40 hover:bg-surface-soft",
  ghost: "text-forest hover:bg-forest/5",
  whatsapp: "bg-[#25D366] text-white shadow-soft hover:brightness-105 hover:shadow-lift",
  glass: "bg-white/10 text-white ring-1 ring-white/25 backdrop-blur hover:bg-white/20",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-[15px]",
  lg: "h-12 px-7 text-base",
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  className?: string;
  children: ReactNode;
}

type ButtonAsButton = CommonProps &
  Omit<ComponentPropsWithoutRef<"button">, "className" | "children"> & { href?: undefined };

type ButtonAsLink = CommonProps &
  Omit<ComponentPropsWithoutRef<"a">, "className" | "children"> & { href: string };

export function Button(props: ButtonAsButton | ButtonAsLink) {
  const {
    variant = "primary",
    size = "md",
    fullWidth,
    leftIcon,
    rightIcon,
    className,
    children,
    ...rest
  } = props;

  const classes = cn(base, variants[variant], sizes[size], fullWidth && "w-full", className);
  const content = (
    <>
      {leftIcon}
      {children}
      {rightIcon}
    </>
  );

  if ("href" in props && props.href !== undefined) {
    return (
      <a className={classes} {...(rest as ComponentPropsWithoutRef<"a">)}>
        {content}
      </a>
    );
  }

  return (
    <button className={classes} {...(rest as ComponentPropsWithoutRef<"button">)}>
      {content}
    </button>
  );
}
