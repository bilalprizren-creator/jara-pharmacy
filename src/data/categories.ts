import {
  Droplets,
  Scissors,
  Pill,
  Sparkles,
  Baby,
  Leaf,
  Smile,
  HeartPulse,
  Footprints,
  GlassWater,
} from "lucide-react";
import type { Category } from "@/types";

export const categories: Category[] = [
  {
    slug: "skincare",
    icon: Droplets,
    accent: "rose",
    title: { al: "Kujdes për lëkurën", en: "Skincare" },
    description: {
      al: "Kujdes i përditshëm për një lëkurë të pastër, të hidratuar dhe me shkëlqim.",
      en: "Daily care for clean, hydrated and glowing skin.",
    },
  },
  {
    slug: "haircare",
    icon: Scissors,
    accent: "green",
    title: { al: "Kujdes për flokë", en: "Hair Care" },
    description: {
      al: "Formulime të zgjedhura për flokë të fortë, të shëndetshëm dhe të ushqyer.",
      en: "Selected formulas for strong, healthy and nourished hair.",
    },
  },
  {
    slug: "vitamins",
    icon: Pill,
    accent: "lime",
    title: { al: "Vitamina & suplemente", en: "Vitamins & Supplements" },
    description: {
      al: "Mbështetje për energji, imunitet dhe mirëqenie të përditshme.",
      en: "Support for energy, immunity and everyday wellbeing.",
    },
  },
  {
    slug: "beauty",
    icon: Sparkles,
    accent: "rose",
    title: { al: "Bukuri & kozmetikë", en: "Beauty & Cosmetics" },
    description: {
      al: "Produkte elegante që plotësojnë rutinën tuaj të bukurisë.",
      en: "Elegant products that complete your beauty routine.",
    },
  },
  {
    slug: "mother-baby",
    icon: Baby,
    accent: "cream",
    title: { al: "Nënë & bebe", en: "Mother & Baby" },
    description: {
      al: "Kujdes i butë dhe i sigurt për nënat dhe të vegjlit.",
      en: "Gentle, safe care for mothers and little ones.",
    },
  },
  {
    slug: "natural",
    icon: Leaf,
    accent: "green",
    title: { al: "Produkte natyrale", en: "Natural Products" },
    description: {
      al: "Zgjedhje me fokus natyral për trupin, lëkurën dhe rutinën tuaj.",
      en: "Nature-focused choices for your body, skin and routine.",
    },
  },
  {
    slug: "oral-care",
    icon: Smile,
    accent: "teal",
    title: { al: "Kujdes oral", en: "Oral Care" },
    description: {
      al: "Higjienë dhe freski për një buzëqeshje të shëndetshme.",
      en: "Hygiene and freshness for a healthy smile.",
    },
  },
  {
    slug: "health-care",
    icon: HeartPulse,
    accent: "green",
    title: { al: "Kujdes shëndetësor", en: "Health Care" },
    description: {
      al: "Produkte të përditshme që mbështetin shëndetin e familjes.",
      en: "Everyday products that support your family's health.",
    },
  },
  {
    slug: "foot-care",
    icon: Footprints,
    accent: "teal",
    title: { al: "Kujdes për këmbët", en: "Foot Care" },
    description: {
      al: "Freski dhe komoditet për këmbë të shëndetshme çdo ditë.",
      en: "Freshness and comfort for healthy feet every day.",
    },
  },
  {
    slug: "collagen",
    icon: GlassWater,
    accent: "rose",
    title: { al: "Kolagjen & bukuri nga brenda", en: "Collagen & Beauty" },
    description: {
      al: "Suplemente bukurie që mbështesin lëkurën, flokët dhe thonjtë.",
      en: "Beauty supplements that support skin, hair and nails.",
    },
  },
];
