/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    // Documented, mobile-first breakpoints (Tailwind defaults, made explicit).
    screens: {
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    container: {
      center: true,
      padding: {
        DEFAULT: "1.25rem",
        sm: "1.5rem",
        lg: "2rem",
      },
      screens: {
        "2xl": "1280px", // content max-width ~1280px
      },
    },
    extend: {
      colors: {
        // ---- Brand greens (derived from the storefront + logo) ----
        forest: {
          DEFAULT: "#0A5C44", // Brand Forest — primary
          50: "#EAF4EF",
          100: "#CFE7DC",
          200: "#9FCFB9",
          300: "#66B294",
          400: "#2E8C6C",
          500: "#0A5C44",
          600: "#084C38",
          700: "#073B2D", // Brand Deep
          800: "#052E23",
          900: "#04241C",
        },
        emerald2: {
          DEFAULT: "#0F7A57", // Brand Emerald — secondary
          400: "#159A6E",
          500: "#0F7A57",
          600: "#0C6349",
        },
        deep: "#073B2D",
        lime: {
          DEFAULT: "#B7E532", // Brand Lime — highlights / accents
          soft: "#DDF38A", // Brand Lime Soft
          300: "#CDEE63",
          500: "#B7E532",
          600: "#9CCB1E",
        },
        // ---- Beauty / skincare accents ----
        rose: {
          DEFAULT: "#E975A8",
          blush: "#F7D8E5",
        },
        // ---- Surfaces ----
        surface: {
          white: "#FFFFFF",
          soft: "#F7FAF8",
          cream: "#F4F0E8",
        },
        // ---- Text ----
        ink: {
          strong: "#0F172A",
          muted: "#64748B",
        },
        line: "#DCE7E1", // Border Soft
        successsoft: "#EAF8F0",
        warningsoft: "#FFF6D8",
      },
      fontFamily: {
        sans: [
          "Inter",
          "Plus Jakarta Sans",
          "Manrope",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      fontSize: {
        // role: [size, { lineHeight, letterSpacing, fontWeight }]
        "display-xl": ["2.5rem", { lineHeight: "1.05", letterSpacing: "-0.02em", fontWeight: "800" }],
        "display-l": ["2rem", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "800" }],
        label: ["0.75rem", { lineHeight: "1.4", letterSpacing: "0.08em", fontWeight: "600" }],
      },
      borderRadius: {
        sm: "12px",
        DEFAULT: "16px",
        lg: "20px",
        xl: "24px",
        "2xl": "28px",
        "3xl": "32px",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(7, 59, 45, 0.04), 0 8px 24px rgba(7, 59, 45, 0.06)",
        card: "0 2px 6px rgba(7, 59, 45, 0.05), 0 14px 40px rgba(7, 59, 45, 0.08)",
        lift: "0 8px 18px rgba(7, 59, 45, 0.10), 0 24px 60px rgba(7, 59, 45, 0.14)",
        glow: "0 0 0 1px rgba(183, 229, 50, 0.35), 0 10px 40px rgba(183, 229, 50, 0.25)",
        fab: "0 10px 30px rgba(7, 59, 45, 0.28)",
      },
      spacing: {
        "4.5": "1.125rem",
        18: "4.5rem",
        22: "5.5rem",
        30: "7.5rem",
      },
      maxWidth: {
        content: "1280px",
        prose2: "68ch",
      },
      backgroundImage: {
        "hero-forest":
          "radial-gradient(120% 120% at 15% 10%, #0F7A57 0%, #0A5C44 42%, #073B2D 100%)",
        "brand-panel":
          "linear-gradient(135deg, #0A5C44 0%, #0C6349 55%, #073B2D 100%)",
        "lime-sheen":
          "linear-gradient(135deg, #DDF38A 0%, #B7E532 100%)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-16px)" },
        },
        sheen: {
          "0%": { transform: "translateX(-120%)" },
          "60%, 100%": { transform: "translateX(220%)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.9)", opacity: "0.6" },
          "70%, 100%": { transform: "scale(1.6)", opacity: "0" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "float-slow": "float-slow 8s ease-in-out infinite",
        sheen: "sheen 3.2s ease-in-out infinite",
        "pulse-ring": "pulse-ring 2.4s cubic-bezier(0.4, 0, 0.2, 1) infinite",
      },
    },
  },
  plugins: [],
};
