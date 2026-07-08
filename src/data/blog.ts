import { Droplets, GlassWater, Pill, Scissors, Sparkles, Zap } from "lucide-react";
import type { BlogArticle } from "@/types";

export const blogArticles: BlogArticle[] = [
  {
    id: "b1",
    slug: "kujdesi-per-lekuren-gjate-veres",
    icon: Droplets,
    accent: "rose",
    readMinutes: 4,
    category: { al: "Lëkurë", en: "Skincare" },
    title: {
      al: "Si të kujdeseni për lëkurën gjatë verës",
      en: "How to care for your skin during summer",
    },
    excerpt: {
      al: "Hidratim, mbrojtje dhe freski — hapat e thjeshtë për një lëkurë të shëndetshme në ditët e nxehta.",
      en: "Hydration, protection and freshness — simple steps for healthy skin on hot days.",
    },
  },
  {
    id: "b2",
    slug: "kur-duhet-te-perdorni-kolagjen",
    icon: GlassWater,
    accent: "rose",
    readMinutes: 5,
    category: { al: "Bukuri", en: "Beauty" },
    title: {
      al: "Kur duhet të përdorni kolagjen?",
      en: "When should you use collagen?",
    },
    excerpt: {
      al: "Çfarë është kolagjeni, kur ndihmon më shumë dhe si ta shtoni në rutinën tuaj të përditshme.",
      en: "What collagen is, when it helps most and how to add it to your daily routine.",
    },
  },
  {
    id: "b3",
    slug: "vitaminat-me-te-rendesishme-per-imunitet",
    icon: Pill,
    accent: "lime",
    readMinutes: 6,
    category: { al: "Shëndet", en: "Health" },
    title: {
      al: "Vitaminat më të rëndësishme për imunitet",
      en: "The most important vitamins for immunity",
    },
    excerpt: {
      al: "Nga Vitamina C te Zinku — mbështetje e thjeshtë për sistemin tuaj imunitar përgjatë vitit.",
      en: "From Vitamin C to Zinc — simple support for your immune system all year round.",
    },
  },
  {
    id: "b4",
    slug: "kujdesi-per-floke-te-forta",
    icon: Scissors,
    accent: "green",
    readMinutes: 4,
    category: { al: "Flokë", en: "Hair" },
    title: {
      al: "Kujdesi për flokë të fortë dhe të shëndetshëm",
      en: "Care for strong and healthy hair",
    },
    excerpt: {
      al: "Rutina me rozmarinë dhe kolagjen që ndihmon rrënjët, gjatësinë dhe shkëlqimin natyral.",
      en: "A rosemary and collagen routine that supports roots, lengths and natural shine.",
    },
  },
  {
    id: "b5",
    slug: "si-te-zgjidhni-produktin-e-duhur-per-fytyren",
    icon: Sparkles,
    accent: "teal",
    readMinutes: 5,
    category: { al: "Lëkurë", en: "Skincare" },
    title: {
      al: "Si të zgjidhni produktin e duhur për fytyrën?",
      en: "How to choose the right face product?",
    },
    excerpt: {
      al: "Njihni tipin e lëkurës suaj dhe përzgjidhni serum, krem apo spray sipas nevojës reale.",
      en: "Know your skin type and pick a serum, cream or spray based on your real needs.",
    },
  },
  {
    id: "b6",
    slug: "magnezi-dhe-roli-i-tij-per-energjine",
    icon: Zap,
    accent: "green",
    readMinutes: 4,
    category: { al: "Shëndet", en: "Health" },
    title: {
      al: "Magnezi dhe roli i tij për energjinë",
      en: "Magnesium and its role in energy",
    },
    excerpt: {
      al: "Pse magnezi është i rëndësishëm për energjinë, nervat dhe muskujt — dhe si ta merrni saktë.",
      en: "Why magnesium matters for energy, nerves and muscles — and how to take it right.",
    },
  },
];
