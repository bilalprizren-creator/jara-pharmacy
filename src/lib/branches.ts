// Relative, not "@/", on purpose: vite/seo imports these helpers to name the
// generated branch pages, and vite.config.ts is bundled by esbuild before
// Vite's `resolve.alias` exists. See the same note in ./routes.ts.
import { brand } from "../data/brand";
import { publicBranches } from "../data/locations";
import type { Location } from "@/types";

/** "Jara Pharmacy 3 — Rr. William Walker" (the depot has no branch number). */
export function branchName(branch: Location): string {
  return branch.branch === undefined
    ? `${brand.name} — ${branch.name}`
    : `${brand.name} ${branch.branch} — ${branch.name}`;
}

/** "Jara Pharmacy 3" — the registered name, as it reads on the Google profile. */
export function branchShortName(branch: Location): string {
  return branch.branch === undefined ? brand.name : `${brand.name} ${branch.branch}`;
}

/** Great-circle distance in kilometres between two branch pins. */
export function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

export interface NearbyBranch {
  branch: Location;
  km: number;
}

/**
 * The closest other customer-facing branches, nearest first. Every branch
 * page links to these so a visitor who landed on the wrong side of town has
 * somewhere to go — and so the pages link each other, which is what lets a
 * crawler reach all of them from any one.
 */
export function nearestBranches(origin: Location, count = 3): NearbyBranch[] {
  if (!origin.coords) return [];
  const from = origin.coords;
  return publicBranches
    .filter((branch) => branch.id !== origin.id && branch.coords)
    .map((branch) => ({ branch, km: distanceKm(from, branch.coords!) }))
    .sort((a, b) => a.km - b.km)
    .slice(0, count);
}

/**
 * The public branches in the order people expect to read them — by branch
 * number, 0 to 10. `publicBranches` itself keeps the featured branch first
 * because the homepage carousel wants it that way.
 */
export const branchesByNumber: Location[] = [...publicBranches].sort(
  (a, b) => (a.branch ?? Infinity) - (b.branch ?? Infinity),
);
