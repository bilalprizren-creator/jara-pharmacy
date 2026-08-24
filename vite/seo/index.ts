import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { Plugin } from "vite";
import { seoRoutes } from "../../src/lib/routes";
import { renderPage } from "./render";
import { homeGraph, jsonLdScript, SITE } from "./schema";

/**
 * Gives the site addresses a search engine can actually reach.
 *
 * Two jobs, both at build time:
 *   1. fill the JSON-LD placeholder in index.html with a graph derived from
 *      src/data (organisation, site, and all eleven branches with coordinates
 *      and opening hours);
 *   2. write one static HTML file per entry in `seoRoutes`, plus the sitemap.
 *
 * Deliberately no SSR and no headless browser: the app uses Leaflet,
 * localStorage and IntersectionObserver, all of which would need shimming, and
 * a build that breaks here breaks the Vercel deploy.
 */

export const JSON_LD_PLACEHOLDER = "<!--jara:json-ld-->";

function sitemap(): string {
  const lastmod = new Date().toISOString().slice(0, 10);

  const entries = seoRoutes.map((route) => {
    const priority = route.kind === "home" ? "1.0" : route.kind === "hub" ? "0.9" : "0.7";
    const changefreq = route.kind === "article" ? "monthly" : "weekly";
    return [
      "  <url>",
      `    <loc>${SITE}${route.path}</loc>`,
      `    <lastmod>${lastmod}</lastmod>`,
      `    <changefreq>${changefreq}</changefreq>`,
      `    <priority>${priority}</priority>`,
      "  </url>",
    ].join("\n");
  });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    "</urlset>",
    "",
  ].join("\n");
}

export function seoPlugin(): Plugin {
  return {
    name: "jara-seo",

    // Runs in dev too, so what you see locally is what ships.
    transformIndexHtml(html) {
      return html.replace(JSON_LD_PLACEHOLDER, jsonLdScript(homeGraph()));
    },

    async writeBundle(options) {
      const outDir = options.dir;
      if (!outDir) return;

      const template = await readFile(join(outDir, "index.html"), "utf8");

      const pages = seoRoutes.filter((route) => route.kind !== "home");
      await Promise.all(
        pages.map(async (route) => {
          const file = join(outDir, route.path.slice(1), "index.html");
          await mkdir(dirname(file), { recursive: true });
          await writeFile(file, renderPage(template, route), "utf8");
        }),
      );

      await writeFile(join(outDir, "sitemap.xml"), sitemap(), "utf8");

      this.info(`wrote ${pages.length} static pages + sitemap.xml`);
    },
  };
}
