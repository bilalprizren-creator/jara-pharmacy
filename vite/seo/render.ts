import { blogArticles } from "../../src/data/blog";
import { brand } from "../../src/data/brand";
import { copy } from "../../src/data/copy";
import { branchIntro, hubFaq, hubIntro } from "../../src/data/seoPages";
import { legalPages } from "../../src/data/legal";
import { shippingMethods } from "../../src/data/shipping";
import { branchesByNumber, nearestBranches } from "../../src/lib/branches";
import { formatHours } from "../../src/lib/hours";
import { mapsHref } from "../../src/lib/links";
import { formatEur } from "../../src/lib/money";
import {
  articlePath,
  BRANCHES_HUB_PATH,
  branchPath,
  legalPath,
  type SeoRoute,
} from "../../src/lib/routes";
import type { Location, OpeningHours } from "../../src/types";
import {
  articleGraph,
  branchGraph,
  branchName,
  homeGraph,
  hubGraph,
  jsonLdScript,
  SITE,
} from "./schema";

/**
 * Turns the built index.html into one real HTML file per address.
 *
 * The point is the markup a crawler receives *before* any JavaScript runs.
 * Today that is an empty `<div id="root">`, so a fetch of the live site comes
 * back with nothing but a title. Each generated page therefore ships its own
 * head and its actual text inside `#root`. React's `createRoot` clears the
 * container on mount, so the visitor still gets the normal app — the static
 * copy is what search engines and no-JS visitors read.
 */

/** Albanian hours line — the same helper and labels the branch cards use. */
function hoursText(hours: OpeningHours[] | undefined): string {
  return formatHours(hours, copy.al);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

interface PageContent {
  title: string;
  description: string;
  body: string;
  jsonLd: string;
}

/** The three closest other branches, as the app lists them under the hero. */
function nearbyList(branch: Location): string {
  const items = nearestBranches(branch, 3)
    .map(
      ({ branch: other, km }) => `
          <li><a href="${branchPath(other.id)}">${escapeHtml(branchName(other))}</a> — ${escapeHtml(other.address)} (${km.toFixed(1).replace(".", ",")} km)</li>`,
    )
    .join("");
  return items
    ? `
        <h2>${escapeHtml(copy.al.route_nearby_title)}</h2>
        <ul>${items}
        </ul>`
    : "";
}

function branchArticle(branch: Location): string {
  const hours = hoursText(branch.hours);
  const phone = branch.phone ?? brand.phonePrimary.label;
  return `
      <article>
        <p class="seo-eyebrow">Barnatore në ${escapeHtml(branch.city)}</p>
        <h1>${escapeHtml(branchName(branch))}</h1>
        <p>${branch.note ? `${escapeHtml(branch.note.al)}. ` : ""}${escapeHtml(branchIntro(branch, "al"))}</p>
        <dl>
          <dt>Adresa</dt>
          <dd>${escapeHtml(branch.address)}</dd>
          ${hours ? `<dt>Orari</dt>\n          <dd>${escapeHtml(hours)}</dd>` : ""}
          <dt>Telefoni</dt>
          <dd><a href="tel:${escapeHtml(phone.replace(/\s/g, ""))}">${escapeHtml(phone)}</a></dd>
        </dl>
        <p><a href="${escapeHtml(mapsHref(branch.mapsQuery))}">Hap në Google Maps</a></p>${nearbyList(branch)}
        <nav>
          <a href="${BRANCHES_HUB_PATH}">Të gjitha barnatoret në Prizren</a> ·
          <a href="/">Ballina</a>
        </nav>
      </article>`;
}

function hubArticle(): string {
  const items = branchesByNumber
    .map((branch) => {
      const hours = hoursText(branch.hours);
      return `
          <li>
            <h2><a href="${branchPath(branch.id)}">${escapeHtml(branchName(branch))}</a></h2>
            <p>${escapeHtml(branch.address)}</p>
            ${hours ? `<p>Orari: ${escapeHtml(hours)}</p>` : ""}
            <p><a href="${escapeHtml(mapsHref(branch.mapsQuery))}">Hap në Google Maps</a></p>
          </li>`;
    })
    .join("");

  const intro = hubIntro
    .map(
      (paragraph) => `
        <p>${escapeHtml(paragraph.al)}</p>`,
    )
    .join("");

  const faq = hubFaq
    .map(
      (item) => `
          <dt>${escapeHtml(item.q.al)}</dt>
          <dd>${escapeHtml(item.a.al)}</dd>`,
    )
    .join("");

  return `
      <article>
        <p class="seo-eyebrow">Lokacionet</p>
        <h1>${escapeHtml(copy.al.route_hub_title)}</h1>${intro}
        <h2>${escapeHtml(copy.al.route_branches_title)}</h2>
        <ul>${items}
        </ul>
        <h2>${escapeHtml(copy.al.route_faq_title)}</h2>
        <dl>${faq}
        </dl>
        <nav><a href="/">Ballina</a></nav>
      </article>`;
}

/**
 * The homepage's crawlable table of contents. The app renders these links
 * too, but only after JavaScript runs; in the raw response the homepage used
 * to be an empty div, so nothing led from the one address a crawler starts at
 * to the other eighteen. React clears this on mount like everything else.
 */
function homeNav(): string {
  const link = (href: string, label: string) => `
          <li><a href="${href}">${escapeHtml(label)}</a></li>`;
  const branches = branchesByNumber
    .map((branch) => link(branchPath(branch.id), branchName(branch)))
    .join("");
  const articles = blogArticles
    .map((article) => link(articlePath(article.slug), article.title.al))
    .join("");
  return `
      <nav aria-label="${escapeHtml(copy.al.footer_quicklinks)}">
        <h2><a href="${BRANCHES_HUB_PATH}">${escapeHtml(copy.al.route_hub_title)}</a></h2>
        <ul>${branches}
        </ul>
        <h2>${escapeHtml(copy.al.section_blog)}</h2>
        <ul>${articles}
        </ul>
      </nav>`;
}

function articleArticle(route: Extract<SeoRoute, { kind: "article" }>): string {
  const { article } = route;
  const paragraphs = article.paragraphs.al
    .map((paragraph) => `\n        <p>${escapeHtml(paragraph)}</p>`)
    .join("");

  return `
      <article>
        <p class="seo-eyebrow">${escapeHtml(article.category.al)} · ${article.readMinutes} min lexim</p>
        <h1>${escapeHtml(article.title.al)}</h1>
        <p><strong>${escapeHtml(article.excerpt.al)}</strong></p>${paragraphs}
        <p><em>Përmbajtja ka karakter informues dhe nuk zëvendëson këshillën,
        diagnozën ose trajtimin nga mjeku apo farmacisti.</em></p>
        <nav>
          <a href="/#blog">Kthehu te këshillat</a> ·
          <a href="${BRANCHES_HUB_PATH}">Barnatore në Prizren</a> ·
          <a href="/">Ballina</a>
        </nav>
      </article>`;
}

/** Delivery fee table for /info/dergesa-dhe-kthimi, from the same data the checkout charges. */
function shippingTable(): string {
  const rows = shippingMethods
    .filter((m) => m.enabled)
    .map((m) => {
      const fee = m.feeCents === 0 ? copy.al.checkout_free : formatEur(m.feeCents, "al");
      const free =
        m.freeFromCents != null
          ? ` (${copy.al.checkout_free_from.replace("{amount}", formatEur(m.freeFromCents, "al"))})`
          : "";
      return `
          <tr><td>${escapeHtml(m.title.al)}</td><td>${escapeHtml(fee)}${escapeHtml(free)}</td><td>${escapeHtml(m.eta.al)}</td></tr>`;
    })
    .join("");
  return `
        <table>
          <thead><tr><th>${escapeHtml(copy.al.legal_method)}</th><th>${escapeHtml(copy.al.legal_fee)}</th><th>${escapeHtml(copy.al.legal_eta)}</th></tr></thead>
          <tbody>${rows}
          </tbody>
        </table>`;
}

function legalArticle(route: Extract<SeoRoute, { kind: "legal" }>): string {
  const { page } = route;
  const sections = page.sections
    .map(
      (section) => `
        <h2>${escapeHtml(section.title.al)}</h2>${section.paragraphs.al
          .map((p) => `\n        <p>${escapeHtml(p)}</p>`)
          .join("")}`,
    )
    .join("");
  const others = legalPages
    .filter((p) => p.slug !== page.slug)
    .map((p) => `<a href="${legalPath(p.slug)}">${escapeHtml(p.title.al)}</a>`)
    .join(" ·\n          ");

  return `
      <article>
        <p class="seo-eyebrow">${escapeHtml(copy.al.legal_eyebrow)}</p>
        <h1>${escapeHtml(page.title.al)}</h1>
        <p><strong>${escapeHtml(page.intro.al)}</strong></p>${page.showShippingTable ? shippingTable() : ""}${sections}
        <p><em>${escapeHtml(copy.al.legal_updated.replace("{date}", page.updated))}</em></p>
        <nav>
          ${others} ·
          <a href="/">Ballina</a>
        </nav>
      </article>`;
}

function contentFor(route: SeoRoute): PageContent {
  switch (route.kind) {
    case "shop":
      // A shell only: the app renders the checkout or the order page from
      // the path the moment it mounts. The text here is for the second before.
      return {
        title: `${copy.al.checkout_title} · ${brand.name}`,
        description: copy.al.checkout_subtitle,
        body: `
      <article>
        <p class="seo-eyebrow">${escapeHtml(copy.al.checkout_eyebrow)}</p>
        <h1>${escapeHtml(copy.al.checkout_title)}</h1>
        <p>${escapeHtml(copy.al.checkout_subtitle)}</p>
        <nav><a href="/#products">${escapeHtml(copy.al.checkout_back)}</a></nav>
      </article>`,
        jsonLd: jsonLdScript(homeGraph()),
      };
    case "legal":
      return {
        title: `${route.page.title.al} · ${brand.name}`,
        description: route.page.intro.al,
        body: legalArticle(route),
        jsonLd: jsonLdScript(homeGraph()),
      };
    case "hub":
      return {
        title: `Barnatore në Prizren — të gjitha lokacionet | ${brand.name}`,
        description:
          "Të gjitha barnatoret Jara Pharmacy në Prizren dhe Rahovec: adresa, orari i punës dhe udhëzime në hartë për secilin lokacion.",
        body: hubArticle(),
        jsonLd: jsonLdScript(hubGraph()),
      };
    case "branch": {
      const { branch } = route;
      const hours = hoursText(branch.hours);
      return {
        // Keyword first, and `branchName` already carries the brand — appending
        // it again would both duplicate the name and overrun the ~60 characters
        // Google shows.
        title: `Barnatore në ${branch.city}: ${branchName(branch)}`,
        description: `Barnatore Jara Pharmacy në ${branch.address}.${hours ? ` Orari: ${hours}.` : ""} Këshillim profesional.`,
        body: branchArticle(branch),
        jsonLd: jsonLdScript(branchGraph(branch)),
      };
    }
    case "article":
      return {
        title: `${route.article.seoTitle.al} · ${brand.name}`,
        description: route.article.seoDescription.al,
        body: articleArticle(route),
        jsonLd: jsonLdScript(articleGraph(route.article)),
      };
    case "home":
      return {
        title: "",
        description: "",
        body: homeNav(),
        jsonLd: jsonLdScript(homeGraph()),
      };
  }
}

/**
 * Readable defaults for the static copy. Deliberately plain: the app replaces
 * this markup the moment it mounts, so this only ever has to serve a crawler
 * or a visitor whose JavaScript did not run.
 *
 * Every selector is anchored on `#root>article` (or `#root>nav` for the
 * homepage's link list) — the static copy's own wrapper — and never on
 * `#root` alone. React mounts *into* `#root`, and an id
 * selector outranks any Tailwind class, so a bare `#root a{color:…}` kept
 * repainting every link in the running app: on each generated page the footer
 * links turned forest-on-deep-green and unreadable, list spacing tripled, and
 * every `<nav>` picked up a stray margin. Anchoring on the wrapper makes the
 * rules stop matching the instant `createRoot` clears the container.
 */
const STATIC_STYLE = `<style>
      #root>article{max-width:44rem;margin:0 auto;padding:6rem 1.25rem 4rem;
        font:16px/1.65 Inter,system-ui,sans-serif;color:#14342a}
      #root>article h1{font-size:1.9rem;line-height:1.25;margin:.25rem 0 1rem;color:#0A5C44}
      #root>article h2{font-size:1.15rem;margin:0 0 .35rem}
      #root>article .seo-eyebrow{text-transform:uppercase;letter-spacing:.08em;font-size:.75rem;
        font-weight:600;color:#0A5C44;margin:0}
      #root>article li{margin:0 0 1.75rem}
      #root>article ul{list-style:none;padding:0}
      #root>article dt{font-weight:600;margin-top:.75rem}
      #root>article dd{margin:0}
      #root>article a{color:#0A5C44}
      #root>article nav{margin-top:2.5rem;font-size:.9rem}
      #root>article table{border-collapse:collapse;width:100%;margin:1rem 0;font-size:.95rem}
      #root>article th,#root>article td{text-align:left;padding:.5rem .6rem;border-bottom:1px solid #dce7e1}
      #root>nav{max-width:44rem;margin:0 auto;padding:6rem 1.25rem 4rem;
        font:16px/1.65 Inter,system-ui,sans-serif;color:#14342a}
      #root>nav h2{font-size:1.15rem;margin:1.5rem 0 .5rem;color:#0A5C44}
      #root>nav ul{list-style:none;padding:0;margin:0}
      #root>nav li{margin:0 0 .35rem}
      #root>nav a{color:#0A5C44}
    </style>
    <noscript><style>#jara-splash{display:none!important}</style></noscript>`;

/** Swap a single-or-multi-line tag matched by `pattern` for `replacement`. */
function swap(html: string, pattern: RegExp, replacement: string): string {
  if (!pattern.test(html)) {
    throw new Error(`[jara-seo] template no longer matches ${pattern}`);
  }
  return html.replace(pattern, () => replacement);
}

/** Build one page's HTML from the built index.html. */
export function renderPage(template: string, route: SeoRoute): string {
  const { title, description, body, jsonLd } = contentFor(route);
  const url = `${SITE}${route.path}`;

  let html = swap(
    template,
    /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
    jsonLd,
  );

  if (route.kind === "home") {
    return swap(html, /<div id="root"><\/div>/, `${STATIC_STYLE}\n    <div id="root">${body}\n    </div>`);
  }

  html = swap(
    html,
    /<title>[\s\S]*?<\/title>/,
    `<title>${escapeHtml(title)}</title>${
      route.kind === "shop" ? '\n    <meta name="robots" content="noindex, nofollow" />' : ""
    }`,
  );
  html = swap(
    html,
    /<meta\s+name="description"[\s\S]*?\/>/,
    `<meta name="description" content="${escapeHtml(description)}" />`,
  );
  html = swap(
    html,
    /<link rel="canonical"[^>]*\/>/,
    `<link rel="canonical" href="${url}" />`,
  );
  html = swap(
    html,
    /<meta property="og:title"[\s\S]*?\/>/,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
  );
  html = swap(
    html,
    /<meta\s+property="og:description"[\s\S]*?\/>/,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
  );
  html = swap(
    html,
    /<meta property="og:url"[^>]*\/>/,
    `<meta property="og:url" content="${url}" />`,
  );
  html = swap(
    html,
    /<meta name="twitter:title"[^>]*\/>/,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
  );
  html = swap(
    html,
    /<meta\s+name="twitter:description"[\s\S]*?\/>/,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`,
  );
  html = swap(html, /<div id="root"><\/div>/, `${STATIC_STYLE}\n    <div id="root">${body}\n    </div>`);

  return html;
}
