import type { SocialPost } from "@/types";
import { brand } from "./brand";

/**
 * Designed, brand-consistent "Instagram-inspired" cards — not raw embeds.
 * Each reuses the generated product-visual system for its imagery.
 */
export const socialPosts: SocialPost[] = [
  {
    id: "s1",
    handle: brand.instagramHandle,
    likes: 128,
    category: { al: "Lëkurë", en: "Skincare" },
    caption: {
      al: "Lëkura që shkëlqen nuk është fat — është kujdesi i duhur. ✨",
      en: "Glowing skin isn't luck — it's the right care. ✨",
    },
    visual: { form: "spray", palette: "rose", label: "FACE SPRAY" },
  },
  {
    id: "s2",
    handle: brand.instagramHandle,
    likes: 95,
    category: { al: "Flokë", en: "Hair" },
    caption: {
      al: "Fuqia e rozmarinës për flokë të fortë, të dendur dhe plot jetë. 🌿",
      en: "The power of rosemary for strong, full and vibrant hair. 🌿",
    },
    visual: { form: "bottle", palette: "green", label: "ROSEMARY" },
  },
  {
    id: "s3",
    handle: brand.instagramHandle,
    likes: 143,
    category: { al: "Bukuri", en: "Beauty" },
    caption: {
      al: "Bukuri që nis nga brenda — rutina jote ditore e kolagjenit. 💚",
      en: "Beauty that starts from within — your daily collagen routine. 💚",
    },
    visual: { form: "jar", palette: "violet", label: "COLLAGEN" },
  },
  {
    id: "s4",
    handle: brand.instagramHandle,
    likes: 76,
    category: { al: "Familje", en: "Family" },
    caption: {
      al: "Mbështetje e lehtë dhe e shijshme për rutinën e fëmijëve. 🧸",
      en: "Easy, tasty support for children's daily routine. 🧸",
    },
    visual: { form: "gummies", palette: "amber", label: "KIDS" },
  },
  {
    id: "s5",
    handle: brand.instagramHandle,
    likes: 88,
    category: { al: "Shëndet", en: "Health" },
    caption: {
      al: "Magnezi: mbështetje e përditshme për energji, nerva dhe muskuj. ⚡",
      en: "Magnesium: daily support for energy, nerves and muscles. ⚡",
    },
    visual: { form: "box", palette: "amber", label: "MAGNESIUM" },
  },
  {
    id: "s6",
    handle: brand.instagramHandle,
    likes: 64,
    category: { al: "Këmbë", en: "Foot care" },
    caption: {
      al: "Këmbët tuaja meritojnë pak freski — veprim i menjëhershëm çdo ditë. 🌬️",
      en: "Your feet deserve some freshness — instant action every day. 🌬️",
    },
    visual: { form: "spray", palette: "orange", label: "FOOT GUARD" },
  },
];
