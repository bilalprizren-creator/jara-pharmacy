import type { SocialPost } from "@/types";
import { brand } from "./brand";

/**
 * Real Instagram posts from the brand's feed (cropped square from the actual
 * posts). Each keeps a generated `visual` as a fallback, but renders `image`
 * when set. Captions/categories are hand-authored bilingual `{ al, en }`.
 */
export const socialPosts: SocialPost[] = [
  {
    id: "beauty-gummy",
    handle: brand.instagramHandle,
    likes: 142,
    category: { al: "Bukuri", en: "Beauty" },
    caption: {
      al: "Bukuri që fillon nga brenda — kolagjen dhe biotinë për lëkurë, flokë e thonj. 💚",
      en: "Beauty that starts from within — collagen and biotin for skin, hair and nails. 💚",
    },
    visual: { form: "gummies", palette: "rose", label: "BEAUTY GUMMY" },
    image: "/social/s-beauty-gummy.jpg",
  },
  {
    id: "liquid-collagen",
    handle: brand.instagramHandle,
    likes: 118,
    category: { al: "Kolagjen", en: "Collagen" },
    caption: {
      al: "Kolagjen i lëngshëm 2500 mg me shije ananasi — bukuri dhe shëndet në çdo gotë. ✨",
      en: "Liquid collagen 2500 mg with pineapple flavor — beauty and health in every shot. ✨",
    },
    visual: { form: "bottle", palette: "teal", label: "LIQUID COLLAGEN" },
    image: "/social/s-liquid-collagen.jpg",
  },
  {
    id: "ivybears-mens-hair",
    handle: brand.instagramHandle,
    likes: 156,
    category: { al: "Flokë", en: "Hair" },
    caption: {
      al: "Flokë të shëndetshëm për meshkuj — forcë, vitalitet dhe rritje me IvyBears Men's Hair. 💪",
      en: "Healthy hair for men — strength, vitality and growth with IvyBears Men's Hair. 💪",
    },
    visual: { form: "gummies", palette: "green", label: "MEN'S HAIR" },
    image: "/social/s-ivybears-mens-hair.jpg",
  },
  {
    id: "ivybears-womens-hair",
    handle: brand.instagramHandle,
    likes: 149,
    category: { al: "Flokë", en: "Hair" },
    caption: {
      al: "Formula e avancuar për flokë të fortë dhe me shkëlqim — IvyBears Women's Hair. 💖",
      en: "Advanced formula for strong, shiny hair — IvyBears Women's Hair. 💖",
    },
    visual: { form: "gummies", palette: "rose", label: "WOMEN'S HAIR" },
    image: "/social/s-ivybears-womens-hair.jpg",
  },
  {
    id: "senti2-seawater",
    handle: brand.instagramHandle,
    likes: 103,
    category: { al: "Shëndet", en: "Health" },
    caption: {
      al: "Pastron dhe hidraton hundën në mënyrë natyrale — ujë deti izotonik Senti2. 🌊",
      en: "Naturally cleanses and hydrates the nose — Senti2 isotonic sea water. 🌊",
    },
    visual: { form: "spray", palette: "teal", label: "SEA WATER" },
    image: "/social/s-senti2-seawater.jpg",
  },
  {
    id: "senti2-lens",
    handle: brand.instagramHandle,
    likes: 96,
    category: { al: "Shëndet", en: "Health" },
    caption: {
      al: "Pastrim i thellë për lentet tuaja — kujdes i përditshëm, i butë dhe i sigurt. 👁️",
      en: "Deep cleaning for your lenses — gentle, safe everyday care. 👁️",
    },
    visual: { form: "bottle", palette: "teal", label: "LENS SOLUTION" },
    image: "/social/s-senti2-lens.jpg",
  },
];
