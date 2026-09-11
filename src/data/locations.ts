import type { Location, OpeningHours } from "@/types";

/**
 * Chain-wide opening hours, the same times the contact section has always
 * shown (Hën–Sht 08:00–22:00 · Diel 09:00–20:00), now as data so the branch
 * cards and the generated JSON-LD read from one source. A branch that keeps
 * different times just declares its own `hours` and wins over this default.
 */
const standardHours: OpeningHours[] = [
  {
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    opens: "08:00",
    closes: "22:00",
  },
  { days: ["Sunday"], opens: "09:00", closes: "20:00" },
];

/**
 * Real Jara Pharmacy branches, taken from the official branch list
 * (jara_pharmacy_locations_prizren.xlsx). Twelve locations in total: eleven
 * customer-facing pharmacies (Nr. 0–10) — mostly in the Prizren area, one in
 * Xërxë (Rahovec) — plus the JARA Pharmacy DEPO (warehouse). Addresses and map
 * queries are taken verbatim from that export. `mapsQuery` drives a resilient
 * Google Maps search; new branches can be appended without any refactor.
 *
 * `coords` are the pins from the branch Google Maps links, not estimates:
 * each one reverse-geocodes to the street and neighbourhood the registry
 * lists. The values before the August 2026 audit were off by 50 m to 6 km —
 * Nr. 5 sat in the village of Kobajë instead of on Rr. Afrim Gashi.
 * Nr. 4 in Xerxe was the last one to get a real link, and it was the worst of
 * them: nearly a kilometre out. The depot is its own unit some 17 m from
 * Nr. 8, not the same door, but it stays out of the public branch list (it is
 * a warehouse with pickup, not a shop to browse).
 */
const branches: Location[] = [
  {
    id: "william-walker",
    branch: 3,
    name: "Rr. William Walker",
    city: "Prizren",
    address: "Rr. William Walker H1/L1, Nr. 8, Prizren",
    alias: "Rr. William Vokeri",
    mapsQuery: "Jara Pharmacy 3, Rr. William Walker H1/L1, Prizren, Kosovo",
    coords: { lat: 42.208539, lng: 20.724414 },
    phone: "+383 49 200 239",
    featured: true,
    note: { al: "Lokacioni kryesor", en: "Main location" },
  },
  {
    id: "rr-jonit",
    branch: 0,
    name: "Rr. Jonit",
    city: "Prizren",
    address: "JONI PN, Rr. Jonit, Prizren",
    mapsQuery: "Jara Pharmacy 0, JONI PN, Rr. Jonit, Prizren, Kosovo",
    coords: { lat: 42.215464, lng: 20.732547 },
    phone: "+383 49 500 763",
    note: { al: "Lokacioni primar", en: "Primary location" },
  },
  {
    id: "galeria",
    branch: 1,
    name: "Galeria Shopping Mall",
    city: "Prizren",
    address: "Galeria Shopping Mall, Rruga Tirana, Prizren",
    mapsQuery: "Jara Pharmacy 1, Galeria Shopping Mall, Rruga Tirana, Prizren, Kosovo",
    coords: { lat: 42.21516, lng: 20.725742 },
    phone: "+383 49 550 809",
    note: { al: "Brenda qendrës tregtare", en: "Inside the shopping mall" },
  },
  {
    id: "bazhdarhane",
    branch: 2,
    name: "Bazhdarhane",
    city: "Prizren",
    address: "Rr. Ahmet Prishtina Nr. 5, Bazhdarhane, Prizren",
    mapsQuery: "Jara Pharmacy 2, Rr. Ahmet Prishtina 5, Bazhdarhane, Prizren, Kosovo",
    coords: { lat: 42.217013, lng: 20.743241 },
    phone: "+383 49 200 840",
    note: { al: "Lagjja Bazhdarhane", en: "Bazhdarhane neighborhood" },
  },
  {
    id: "xerxe-qtx",
    branch: 4,
    name: "Xërxë — QTX",
    city: "Xërxë, Rahovec",
    address: "QTX, Rr. Egzodi 99, Xërxë, Rahovec",
    mapsQuery: "Jara Pharmacy 4, QTX, Rr. Egzodi 99, Xërxë, Rahovec, Kosovo",
    coords: { lat: 42.35745, lng: 20.561295 },
    phone: "+383 49 200 418",
    note: { al: "Qendra tregtare QTX", en: "QTX shopping center" },
  },
  {
    id: "transit-landovice",
    branch: 5,
    name: "Transiti — Landovicë",
    city: "Prizren",
    address: "Transiti PN, Rruga Afrim Gashi, Landovicë, Prizren",
    mapsQuery: "Jara Pharmacy 5, Transiti, Rruga Afrim Gashi, Landovicë, Prizren, Kosovo",
    coords: { lat: 42.251466, lng: 20.707742 },
    phone: "+383 48 550 012",
    note: { al: "Rruga e transitit", en: "On the transit road" },
  },
  {
    id: "uke-bytyqi",
    branch: 6,
    name: "Rr. Ukë Bytyqi",
    city: "Prizren",
    address: "Rr. Ukë Bytyqi PN, Prizren",
    mapsQuery: "Jara Pharmacy 6, Rr. Ukë Bytyqi, Prizren, Kosovo",
    coords: { lat: 42.231691, lng: 20.755972 },
    phone: "+383 43 580 645",
  },
  {
    id: "qazim-berisha",
    branch: 7,
    name: "Rr. Qazim Berisha 41",
    city: "Prizren",
    address: "Rr. Qazim Berisha Nr. 41, Prizren",
    mapsQuery: "Jara Pharmacy 7, Rr. Qazim Berisha 41, Prizren, Kosovo",
    coords: { lat: 42.21768, lng: 20.745664 },
    phone: "+383 48 300 318",
  },
  {
    id: "kadri-zeka",
    branch: 8,
    name: "Rr. Kadri Zeka",
    city: "Prizren",
    address: "Rr. Kadri Zeka PN, Prizren",
    mapsQuery: "Jara Pharmacy 8, Rr. Kadri Zeka, Prizren, Kosovo",
    coords: { lat: 42.232439, lng: 20.75914 },
    phone: "+383 48 550 002",
  },
  {
    id: "reshat-kajragliu",
    branch: 9,
    name: "Rr. Reshat Karjagdiu 7",
    city: "Prizren",
    address: "Rr. Reshat Karjagdiu Nr. 7, Prizren",
    mapsQuery: "Jara Pharmacy 9, Rr. Reshat Karjagdiu 7, Prizren, Kosovo",
    coords: { lat: 42.212556, lng: 20.734294 },
    phone: "+383 49 300 286",
  },
  {
    id: "shuaip-spahiu",
    branch: 10,
    name: "Rr. Shuaip Spahiu 22",
    city: "Prizren",
    address: "Rr. Shuaip Spahiu Nr. 22, Prizren",
    mapsQuery: "Jara Pharmacy 10, Rr. Shuaip Spahiu 22, Prizren, Kosovo",
    coords: { lat: 42.209409, lng: 20.738202 },
    phone: "+383 48 400 210",
  },
  {
    id: "depo",
    name: "JARA Pharmacy Depo",
    city: "Prizren",
    address: "Rr. Kadri Zeka PN, Prizren",
    mapsQuery: "Jara Pharmacy Depo, Rr. Kadri Zeka, Prizren, Kosovo",
    coords: { lat: 42.232472, lng: 20.758944 },
    note: { al: "Depo (magazina)", en: "Warehouse / depot" },
  },
];

/**
 * Every customer-facing branch carries the standard hours unless it declares
 * its own. The depot is deliberately left without hours: it is not a place
 * customers visit, which is also what keeps it out of the search-engine
 * structured data and out of the generated branch pages.
 */
export const locations: Location[] = branches.map((branch) =>
  branch.id === "depo" ? branch : { hours: standardHours, ...branch },
);

/** The eleven branches customers can actually walk into. */
export const publicBranches: Location[] = locations.filter(
  (branch) => branch.id !== "depo",
);
