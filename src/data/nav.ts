import type { NavLink } from "@/types";

/** Primary navigation. Hrefs are in-page anchors for the one-page layout. */
export const navLinks: NavLink[] = [
  { id: "home", href: "#home", label: { al: "Ballina", en: "Home" } },
  { id: "products", href: "#products", label: { al: "Produkte", en: "Products" } },
  { id: "categories", href: "#categories", label: { al: "Kategoritë", en: "Categories" } },
  { id: "locations", href: "#locations", label: { al: "Lokacionet", en: "Locations" } },
  { id: "about", href: "#about", label: { al: "Rreth nesh", en: "About" } },
  { id: "blog", href: "#blog", label: { al: "Blog", en: "Blog" } },
  { id: "contact", href: "#contact", label: { al: "Kontakt", en: "Contact" } },
];
