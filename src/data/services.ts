import {
  BadgeCheck,
  Droplets,
  Scissors,
  Pill,
  Baby,
  Leaf,
  Footprints,
  MessageCircle,
} from "lucide-react";
import type { IconFeature } from "@/types";

export const services: IconFeature[] = [
  {
    id: "guidance",
    icon: BadgeCheck,
    title: { al: "Këshillim për produkte", en: "Product guidance" },
    text: {
      al: "Ndihmë profesionale për të zgjedhur produktin e duhur.",
      en: "Professional help to choose the right product.",
    },
  },
  {
    id: "skincare",
    icon: Droplets,
    title: { al: "Produkte për lëkurë", en: "Skincare products" },
    text: {
      al: "Serume, kremra dhe spray për çdo tip lëkure.",
      en: "Serums, creams and sprays for every skin type.",
    },
  },
  {
    id: "haircare",
    icon: Scissors,
    title: { al: "Produkte për flokë", en: "Haircare products" },
    text: {
      al: "Kujdes me rozmarinë dhe kolagjen për flokë të fortë.",
      en: "Rosemary and collagen care for strong hair.",
    },
  },
  {
    id: "vitamins",
    icon: Pill,
    title: { al: "Vitamina dhe suplemente", en: "Vitamins and supplements" },
    text: {
      al: "Mbështetje për energji, imunitet dhe mirëqenie.",
      en: "Support for energy, immunity and wellbeing.",
    },
  },
  {
    id: "kids",
    icon: Baby,
    title: { al: "Kujdes për fëmijë", en: "Kids care" },
    text: {
      al: "Zgjedhje të buta dhe të sigurta për të vegjlit.",
      en: "Gentle, safe choices for the little ones.",
    },
  },
  {
    id: "natural",
    icon: Leaf,
    title: { al: "Produkte natyrale", en: "Natural products" },
    text: {
      al: "Alternativa me fokus natyral për rutinën tuaj.",
      en: "Nature-focused alternatives for your routine.",
    },
  },
  {
    id: "foot",
    icon: Footprints,
    title: { al: "Produkte për këmbë", en: "Foot care products" },
    text: {
      al: "Freski dhe komoditet për këmbë të shëndetshme.",
      en: "Freshness and comfort for healthy feet.",
    },
  },
  {
    id: "online",
    icon: MessageCircle,
    title: { al: "Porosi dhe pyetje online", en: "Online inquiries" },
    text: {
      al: "Na shkruani në WhatsApp për çdo produkt apo pyetje.",
      en: "Message us on WhatsApp for any product or question.",
    },
  },
];
