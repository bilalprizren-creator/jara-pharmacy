import { MessageCircle, PackageCheck, MapPin } from "lucide-react";
import type { IconFeature } from "@/types";

export const services: IconFeature[] = [
  {
    id: "advice",
    icon: MessageCircle,
    title: { al: "Këshillim mbi produktet", en: "Product guidance" },
    text: {
      al: "Na shkruani për këshillë mbi zgjedhjen e produktit të duhur për ju.",
      en: "Write to us for guidance on choosing the right product for you.",
    },
  },
  {
    id: "reserve",
    icon: PackageCheck,
    title: { al: "Rezervo një produkt", en: "Reserve a product" },
    text: {
      al: "Kontrolloni disponueshmërinë dhe rezervoni produktin përpara se të vini.",
      en: "Check availability and reserve a product before you visit.",
    },
  },
  {
    id: "visit",
    icon: MapPin,
    title: { al: "Vizitoni farmacinë më të afërt", en: "Visit your nearest branch" },
    text: {
      al: "Na gjeni në disa lokacione në Prizren, gjithmonë pranë jush.",
      en: "Find us at several locations across Prizren, always close by.",
    },
  },
];
