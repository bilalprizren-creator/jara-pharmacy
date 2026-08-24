import { brand } from "../../src/data/brand";
import { publicBranches } from "../../src/data/locations";
import { mapsHref } from "../../src/lib/links";
import { articlePath, branchPath, BRANCHES_HUB_PATH } from "../../src/lib/routes";
import type { BlogArticle, Location, OpeningHours } from "../../src/types";

/**
 * Schema.org graphs, built from the same data the app renders.
 *
 * The old markup was one hand-written `Pharmacy` node carrying a single address
 * for a twelve-branch business, with no coordinates and no opening hours — even
 * though every branch has had precise coordinates in src/data/locations.ts all
 * along. Everything here is derived, so it cannot fall out of date.
 *
 * One `@graph` per page, with `@id` cross-references, so the organisation is
 * described once and every other node points at it.
 */

export const SITE = brand.websiteUrl;

const ORG_ID = `${SITE}/#organization`;
const WEBSITE_ID = `${SITE}/#website`;
const OG_IMAGE = `${SITE}/jara-pharmacy-social-preview.png`;
const LOGO = `${SITE}/favicon-512.png`;

const TELEPHONE = [`+${brand.phonePrimary.e164}`, `+${brand.phoneSecondary.e164}`];

/** "Xërxë, Rahovec" → locality + region; plain "Prizren" → locality only. */
function splitCity(city: string): { locality: string; region?: string } {
  const [locality, region] = city.split(",").map((part) => part.trim());
  return region ? { locality, region } : { locality };
}

function postalAddress(streetAddress: string, city: string) {
  const { locality, region } = splitCity(city);
  return {
    "@type": "PostalAddress",
    streetAddress,
    addressLocality: locality,
    ...(region ? { addressRegion: region } : {}),
    ...(locality === "Prizren" ? { postalCode: brand.address.postalCode } : {}),
    addressCountry: "XK",
  };
}

function openingHoursSpecification(hours: OpeningHours[]) {
  return hours.map((slot) => ({
    "@type": "OpeningHoursSpecification",
    dayOfWeek: slot.days.map((day) => `https://schema.org/${day}`),
    opens: slot.opens,
    closes: slot.closes,
  }));
}

/** "Jara Pharmacy 3 — Rr. William Walker" (the depot has no branch number). */
export function branchName(branch: Location): string {
  return branch.branch === undefined
    ? `${brand.name} — ${branch.name}`
    : `${brand.name} ${branch.branch} — ${branch.name}`;
}

function branchId(branch: Location): string {
  return `${SITE}${branchPath(branch.id)}#pharmacy`;
}

/** A single branch as a visitable Pharmacy, complete with geo and hours. */
export function branchNode(branch: Location) {
  return {
    "@type": "Pharmacy",
    "@id": branchId(branch),
    name: branchName(branch),
    url: `${SITE}${branchPath(branch.id)}`,
    branchCode: branch.branch === undefined ? undefined : String(branch.branch),
    parentOrganization: { "@id": ORG_ID },
    address: postalAddress(branch.address, branch.city),
    ...(branch.coords
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: branch.coords.lat,
            longitude: branch.coords.lng,
          },
        }
      : {}),
    ...(branch.hours
      ? { openingHoursSpecification: openingHoursSpecification(branch.hours) }
      : {}),
    telephone: branch.phone ? branch.phone.replace(/\s/g, "") : TELEPHONE[0],
    hasMap: mapsHref(branch.mapsQuery),
    image: OG_IMAGE,
  };
}

function organizationNode() {
  return {
    "@type": "Organization",
    "@id": ORG_ID,
    name: brand.name,
    url: `${SITE}/`,
    logo: LOGO,
    image: OG_IMAGE,
    email: brand.email,
    telephone: TELEPHONE,
    address: postalAddress(brand.address.street, brand.address.city),
    areaServed: [
      { "@type": "City", name: "Prizren" },
      { "@type": "City", name: "Rahovec" },
    ],
    sameAs: [brand.instagramUrl, brand.facebookUrl],
  };
}

function websiteNode() {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: `${SITE}/`,
    name: brand.name,
    inLanguage: "sq",
    publisher: { "@id": ORG_ID },
  };
}

export function breadcrumbNode(trail: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: `${SITE}${crumb.path}`,
    })),
  };
}

function graph(nodes: unknown[]) {
  return { "@context": "https://schema.org", "@graph": nodes };
}

/** Homepage: the organisation, the site, and all eleven branches. */
export function homeGraph() {
  return graph([
    organizationNode(),
    websiteNode(),
    ...publicBranches.map(branchNode),
  ]);
}

export function hubGraph() {
  return graph([
    organizationNode(),
    breadcrumbNode([
      { name: "Ballina", path: "/" },
      { name: "Barnatore në Prizren", path: BRANCHES_HUB_PATH },
    ]),
    {
      "@type": "ItemList",
      name: "Barnatoret Jara Pharmacy në Prizren e Rahovec",
      numberOfItems: publicBranches.length,
      itemListElement: publicBranches.map((branch, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: branchNode(branch),
      })),
    },
  ]);
}

export function branchGraph(branch: Location) {
  return graph([
    organizationNode(),
    branchNode(branch),
    breadcrumbNode([
      { name: "Ballina", path: "/" },
      { name: "Barnatore në Prizren", path: BRANCHES_HUB_PATH },
      { name: branchName(branch), path: branchPath(branch.id) },
    ]),
  ]);
}

export function articleGraph(article: BlogArticle) {
  const path = articlePath(article.slug);
  return graph([
    organizationNode(),
    {
      "@type": "BlogPosting",
      "@id": `${SITE}${path}#article`,
      headline: article.seoTitle.al,
      description: article.seoDescription.al,
      articleSection: article.category.al,
      articleBody: article.paragraphs.al.join("\n\n"),
      inLanguage: "sq",
      mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE}${path}` },
      author: { "@id": ORG_ID },
      publisher: { "@id": ORG_ID },
      image: OG_IMAGE,
      // No datePublished on purpose: src/data/blog.ts carries no real dates and
      // inventing one would be a false signal. Add the field there to emit it.
    },
    breadcrumbNode([
      { name: "Ballina", path: "/" },
      { name: "Këshilla", path: "/#blog" },
      { name: article.seoTitle.al, path },
    ]),
  ]);
}

/**
 * Serialise a graph into a script tag. `<` is escaped so an article body can
 * never terminate the script element early.
 */
export function jsonLdScript(value: unknown): string {
  const json = JSON.stringify(value, null, 2).replace(/</g, "\\u003c");
  return `<script type="application/ld+json">\n${json}\n    </script>`;
}
