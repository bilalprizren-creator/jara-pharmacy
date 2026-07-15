import type { SocialPost } from "@/types";
import { brand } from "./brand";

/**
 * Real Instagram posts from the brand's feed (cropped from the actual posts).
 * Each keeps a generated `visual` as a fallback, but renders `image` when set.
 */
export const socialPosts: SocialPost[] = [
  {
    id: "swiss-kids",
    handle: brand.instagramHandle,
    likes: 134,
    category: { al: "Fëmijë", en: "Kids" },
    caption: {
      al: "Shëndeti i fëmijëve fillon me kujdesin e duhur çdo ditë! 🌱💚",
      en: "Children's health starts with the right daily care! 🌱💚",
    },
    visual: { form: "bottle", palette: "green", label: "SWISS ENERGY" },
    image: "/social/s-swiss-kids.jpg",
  },
  {
    id: "swiss-bones",
    handle: brand.instagramHandle,
    likes: 121,
    category: { al: "Fëmijë", en: "Kids" },
    caption: {
      al: "Kocka të forta sot, një e ardhme më e shëndetshme nesër! 🦴✨",
      en: "Strong bones today, a healthier tomorrow! 🦴✨",
    },
    visual: { form: "bottle", palette: "green", label: "BONES & TEETH" },
    image: "/social/s-swiss-bones.jpg",
  },
  {
    id: "alpenlor-lollipops",
    handle: brand.instagramHandle,
    likes: 88,
    category: { al: "Fëmijë", en: "Kids" },
    caption: {
      al: "Shije natyrale, buzëqeshje të sinqerta dhe kujdes për çdo ditë! 🌿🍭💜",
      en: "Natural taste, genuine smiles and everyday care! 🌿🍭💜",
    },
    visual: { form: "box", palette: "violet", label: "LOLLIPOPS" },
    image: "/social/s-alpenlor-lollipops.jpg",
  },
  {
    id: "alpenlor-lozenges",
    handle: brand.instagramHandle,
    likes: 97,
    category: { al: "Shëndet", en: "Health" },
    caption: {
      al: "Lehtësim natyral për fytin tuaj — me 10 bimë dhe vitaminë C. 🌿💚",
      en: "Natural relief for your throat — with 10 herbs and vitamin C. 🌿💚",
    },
    visual: { form: "box", palette: "green", label: "LOZENGES" },
    image: "/social/s-alpenlor-lozenges.jpg",
  },
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
];
