import type { Location } from "@/types";
import { brand } from "./brand";

/**
 * Baseline branches from the brand references. The William Vokeri / William
 * Walker naming variant is modeled explicitly via `alias` so the UI shows the
 * screenshot-primary form while the data preserves both. New branches can be
 * appended without any refactor.
 */
export const locations: Location[] = [
  {
    id: "william-vokeri",
    name: "Rr. William Vokeri",
    city: "Prizren",
    address: brand.address.full,
    alias: "Rr. William Walker",
    mapsQuery: "Jara Pharmacy, Rr. William Vokeri, Prizren, Kosovo",
    phone: brand.phonePrimary.label,
    featured: true,
    note: { al: "Lokacioni kryesor", en: "Main location" },
  },
  {
    id: "joni",
    name: "Rr. Joni",
    city: "Prizren",
    address: "Rr. Joni, Prizren, Kosovo",
    mapsQuery: "Jara Pharmacy, Rr. Joni, Prizren, Kosovo",
  },
  {
    id: "galeria",
    name: "Galeria Shopping",
    city: "Prizren",
    address: "Galeria Shopping, Prizren, Kosovo",
    mapsQuery: "Jara Pharmacy, Galeria Shopping, Prizren, Kosovo",
    note: { al: "Brenda qendrës tregtare", en: "Inside the shopping mall" },
  },
  {
    id: "ahmet-prishtina",
    name: "Rr. Ahmet Prishtina",
    city: "Prizren",
    address: "Rr. Ahmet Prishtina, Prizren, Kosovo",
    mapsQuery: "Jara Pharmacy, Rr. Ahmet Prishtina, Prizren, Kosovo",
  },
  {
    id: "xerxe-qtx",
    name: "Xërxe QTX",
    city: "Xërxe",
    address: "Xërxe QTX, Rahovec, Kosovo",
    mapsQuery: "Jara Pharmacy, Xërxe QTX, Kosovo",
  },
  {
    id: "transit-landovice",
    name: "Transit-Landovicë",
    city: "Landovicë",
    address: "Transit, Landovicë, Prizren, Kosovo",
    mapsQuery: "Jara Pharmacy, Landovicë, Prizren, Kosovo",
  },
  {
    id: "uke-bytyqi",
    name: "Rr. Ukë Bytyqi",
    city: "Prizren",
    address: "Rr. Ukë Bytyqi, Prizren, Kosovo",
    mapsQuery: "Jara Pharmacy, Rr. Ukë Bytyqi, Prizren, Kosovo",
  },
];
