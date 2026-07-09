import type { Location } from "@/types";

/**
 * Real Jara Pharmacy branches, taken from the official branch list
 * ("addres Jara.xlsx", ALBTRIX export). Ten customer-facing pharmacies — nine
 * in the Prizren area and one in Xërxë (Rahovec). The internal DEPO (warehouse)
 * is intentionally not listed. `mapsQuery` drives a resilient Google Maps
 * search; new branches can be appended without any refactor.
 */
export const locations: Location[] = [
  {
    id: "william-walker",
    branch: 3,
    name: "Rr. William Walker",
    city: "Prizren",
    address: "Rr. William Walker Nr. 8, Prizren",
    alias: "Rr. William Vokeri",
    mapsQuery: "Jara Pharmacy 3, Rr. William Walker, Prizren, Kosovo",
    phone: "+383 49 500 763",
    featured: true,
    note: { al: "Lokacioni kryesor", en: "Main location" },
  },
  {
    id: "galeria",
    branch: 1,
    name: "Galeria Shopping Mall",
    city: "Prizren",
    address: "Galeria Shopping Mall, Prizren",
    mapsQuery: "Jara Pharmacy 1, Galeria Shopping Mall, Prizren, Kosovo",
    note: { al: "Brenda qendrës tregtare", en: "Inside the shopping mall" },
  },
  {
    id: "bazhdarhane",
    branch: 2,
    name: "Bazhdarhane",
    city: "Prizren",
    address: "Lagjja Bazhdarhane, Prizren",
    mapsQuery: "Jara Pharmacy 2, Bazhdarhane, Prizren, Kosovo",
    note: { al: "Lagjja Bazhdarhane", en: "Bazhdarhane neighborhood" },
  },
  {
    id: "xerxe-qtx",
    branch: 4,
    name: "Xërxë — QTX",
    city: "Xërxë, Rahovec",
    address: "QTX, Xërxë, Rahovec",
    mapsQuery: "Jara Pharmacy 4, QTX, Xërxë, Rahovec, Kosovo",
    note: { al: "Qendra tregtare QTX", en: "QTX shopping center" },
  },
  {
    id: "transit-landovice",
    branch: 5,
    name: "Transiti — Landovicë",
    city: "Prizren",
    address: "Transiti PN, Landovicë, Prizren",
    mapsQuery: "Jara Pharmacy 5, Landovicë, Prizren, Kosovo",
    note: { al: "Rruga e transitit", en: "On the transit road" },
  },
  {
    id: "uke-bytyqi",
    branch: 6,
    name: "Rr. Ukë Bytyqi",
    city: "Prizren",
    address: "Rr. Ukë Bytyqi, Prizren",
    mapsQuery: "Jara Pharmacy 6, Rr. Ukë Bytyqi, Prizren, Kosovo",
  },
  {
    id: "qazim-berisha",
    branch: 7,
    name: "Rr. Qazim Berisha 41",
    city: "Prizren",
    address: "Rr. Qazim Berisha Nr. 41, Prizren",
    mapsQuery: "Jara Pharmacy 7, Rr. Qazim Berisha, Prizren, Kosovo",
  },
  {
    id: "kadri-zeka",
    branch: 8,
    name: "Rr. Kadri Zeka",
    city: "Prizren",
    address: "Rr. Kadri Zeka pn, Prizren",
    mapsQuery: "Jara Pharmacy 8, Rr. Kadri Zeka, Prizren, Kosovo",
  },
  {
    id: "reshat-kajragliu",
    branch: 9,
    name: "Rr. Reshat Kajragliu 7",
    city: "Prizren",
    address: "Rr. Reshat Kajragliu Nr. 7, Prizren",
    mapsQuery: "Jara Pharmacy 9, Rr. Reshat Kajragliu, Prizren, Kosovo",
  },
  {
    id: "shuaip-spahiu",
    branch: 10,
    name: "Rr. Shuaip Spahiu 22",
    city: "Prizren",
    address: "Rr. Shuaip Spahiu Nr. 22, Prizren",
    mapsQuery: "Jara Pharmacy 10, Rr. Shuaip Spahiu, Prizren, Kosovo",
  },
];
