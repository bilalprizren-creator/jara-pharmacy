import { MapPin, Package, Users, MessageCircle } from "lucide-react";
import type { Stat } from "@/types";

/**
 * Display / social-proof values (not hard legal claims). Easily replaceable.
 */
export const stats: Stat[] = [
  {
    id: "locations",
    icon: MapPin,
    value: 12,
    label: { al: "Lokacione", en: "Locations" },
  },
  {
    id: "products",
    icon: Package,
    value: 1500,
    suffix: "+",
    label: { al: "Produkte", en: "Products" },
  },
  {
    id: "followers",
    icon: Users,
    value: 3000,
    suffix: "+",
    label: { al: "Ndjekës", en: "Followers" },
  },
  {
    id: "online",
    icon: MessageCircle,
    value: 0,
    display: "24/7",
    label: { al: "Pyetje online", en: "Online inquiries" },
  },
];
