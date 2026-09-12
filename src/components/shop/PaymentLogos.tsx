import { cn } from "@/lib/cn";

/**
 * The accepted payment marks, drawn inline: the card schemes' own brand
 * files are heavy and their usage rules fussy, and a bank audit only asks
 * that the accepted brands be visible. Rendered small, grey-bordered pills,
 * so they read as a trust strip rather than advertising.
 */
export function PaymentLogos({ className, tone = "light" }: { className?: string; tone?: "light" | "dark" }) {
  const pill = cn(
    "inline-flex h-7 items-center rounded-md border px-2 text-[11px] font-extrabold tracking-tight",
    tone === "dark" ? "border-white/15 bg-white/10 text-white" : "border-line bg-white text-ink-strong",
  );
  return (
    <ul className={cn("flex flex-wrap items-center gap-2", className)} aria-label="Visa, Mastercard, Apple Pay, Google Pay">
      <li className={pill}>
        <span className="italic text-[#1A1F71]" style={tone === "dark" ? { color: "#fff" } : undefined}>
          VISA
        </span>
      </li>
      <li className={pill} aria-label="Mastercard">
        <svg width="26" height="16" viewBox="0 0 26 16" aria-hidden="true">
          <circle cx="9" cy="8" r="7" fill="#EB001B" />
          <circle cx="17" cy="8" r="7" fill="#F79E1B" fillOpacity="0.9" />
        </svg>
      </li>
      <li className={pill}>
        {/* Apple's own glyph has no font on most Windows machines; a small outline does. */}
        <svg width="11" height="13" viewBox="0 0 11 13" aria-hidden="true" fill="currentColor">
          <path d="M9.1 6.9c0-1.4 1.1-2 1.2-2.1-.7-1-1.7-1.1-2-1.1-.9-.1-1.7.5-2.1.5-.4 0-1.1-.5-1.8-.5C3.4 3.7 2.5 4.2 2 5c-1.1 1.9-.3 4.7.8 6.2.5.8 1.1 1.6 1.9 1.6.8 0 1.1-.5 2-.5s1.2.5 2 .5c.8 0 1.4-.8 1.9-1.5.6-.9.8-1.7.8-1.8 0 0-1.6-.6-1.6-2.6zM7.7 2.8c.4-.5.7-1.2.6-1.8-.6 0-1.3.4-1.7.9-.4.4-.7 1.1-.6 1.8.6 0 1.3-.4 1.7-.9z" />
        </svg>
        <span className="ml-0.5">Pay</span>
      </li>
      <li className={pill}>
        <span className="text-[#4285F4]" style={tone === "dark" ? { color: "#fff" } : undefined}>
          G
        </span>
        <span className="ml-0.5">Pay</span>
      </li>
    </ul>
  );
}
