import type { SocialPost } from "@/types";
import { brand } from "./brand";

/**
 * Real Instagram posts from the brand's feed (cropped from the actual posts).
 * Each keeps a generated `visual` as a fallback, but renders `image` when set.
 */
export const socialPosts: SocialPost[] = [
  {
    id: "s1",
    handle: brand.instagramHandle,
    likes: 128,
    category: { al: "Flokë", en: "Hair" },
    caption: {
      al: "Flokët janë kurora e çdo mashkulli — kujdesu për ta çdo ditë. 💚",
      en: "Hair is every man's crown — care for it every day. 💚",
    },
    visual: { form: "gummies", palette: "green", label: "MEN'S HAIR" },
    image: "/social/s-mens-hair.jpg",
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
    image: "/social/s-rosemary.jpg",
  },
  {
    id: "s3",
    handle: brand.instagramHandle,
    likes: 143,
    category: { al: "Bukuri", en: "Beauty" },
    caption: {
      al: "Kur ta marrësh kolagjenin? Çdo ditë, pa përjashtim. ✨",
      en: "When to take your collagen? Every day, no exceptions. ✨",
    },
    visual: { form: "jar", palette: "violet", label: "COLLAGEN" },
    image: "/social/s-collagen.jpg",
  },
  {
    id: "s4",
    handle: brand.instagramHandle,
    likes: 76,
    category: { al: "Familje", en: "Family" },
    caption: {
      al: "Shije frutash + mbështetje e përditshme për rritje të shëndetshme. 🧸",
      en: "Fruity taste + daily support for healthy growth. 🧸",
    },
    visual: { form: "gummies", palette: "amber", label: "KIDS" },
    image: "/social/s-kids.jpg",
  },
  {
    id: "s5",
    handle: brand.instagramHandle,
    likes: 88,
    category: { al: "Energji", en: "Energy" },
    caption: {
      al: "Fuqia që e ndjen. Shija që e shijon. 💪",
      en: "Power you feel. Taste you enjoy. 💪",
    },
    visual: { form: "jar", palette: "amber", label: "PROTEIN" },
    image: "/social/s-protein.jpg",
  },
  {
    id: "s6",
    handle: brand.instagramHandle,
    likes: 64,
    category: { al: "Bukuri", en: "Beauty" },
    caption: {
      al: "Bukuri që nis nga brenda — IvyBears Women's Hair. 💗",
      en: "Beauty that starts from within — IvyBears Women's Hair. 💗",
    },
    visual: { form: "gummies", palette: "rose", label: "WOMEN'S HAIR" },
    image: "/social/s-womens-hair.jpg",
  },
];
