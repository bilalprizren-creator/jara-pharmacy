import { ShieldCheck, BadgeCheck, Stethoscope, MapPin, HeartPulse } from "lucide-react";
import type { IconFeature } from "@/types";

/** Value cards shown directly below the hero. */
export const trustFeatures: IconFeature[] = [
  {
    id: "quality",
    icon: ShieldCheck,
    title: { al: "Cilësi e garantuar", en: "Guaranteed quality" },
    text: {
      al: "Vetëm produkte origjinale nga marka të besueshme.",
      en: "Only original products from trusted brands.",
    },
  },
  {
    id: "selected",
    icon: BadgeCheck,
    title: { al: "Produkte të zgjedhura", en: "Carefully selected" },
    text: {
      al: "Përzgjedhje e kujdesshme për lëkurë, flokë dhe shëndet.",
      en: "A thoughtful selection for skin, hair and health.",
    },
  },
  {
    id: "advice",
    icon: Stethoscope,
    title: { al: "Këshillim profesional", en: "Professional guidance" },
    text: {
      al: "Staf i gatshëm t'ju udhëzojë me përgjegjësi.",
      en: "Staff ready to guide you responsibly.",
    },
  },
  {
    id: "near",
    icon: MapPin,
    title: { al: "Gjithmonë pranë jush", en: "Always near you" },
    text: {
      al: "10 lokacione në Prizren e Rahovec, kudo ku ju nevojitet.",
      en: "10 locations across Prizren and Rahovec, wherever you need us.",
    },
  },
  {
    id: "care",
    icon: HeartPulse,
    title: { al: "Kujdes për shëndetin", en: "Care for health & beauty" },
    text: {
      al: "Një vend për mirëqenien e përditshme të familjes.",
      en: "One place for your family's everyday wellbeing.",
    },
  },
];
