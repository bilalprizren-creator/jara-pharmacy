#!/usr/bin/env node
/**
 * Local preview of the built review pages.
 * ----------------------------------------
 * `build-review-page.mjs` writes page *fragments*: a title, styles, markup and
 * script, without the surrounding document, because the Artifact host supplies
 * that skeleton when publishing. A browser opening the file directly would show
 * an unstyled mess, so this server wraps the fragment in the same minimal
 * document and serves it — the only way to check a batch before the whole team
 * gets the link.
 *
 * The shared store is not available here (that is a published-page capability),
 * so the page falls back to per-device storage and says so. That is expected:
 * this preview is for layout and wording, not for real reviewing.
 *
 * Started through .claude/launch.json ("jara-kontroll") on port 5400.
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PAGES = path.resolve(HERE, "..", "..", ".catalog-cache");
const PORT = Number(process.env.PORT) || 5400;

const server = http.createServer((request, response) => {
  const url = new URL(request.url, `http://localhost:${PORT}`);
  const pages = listPages();

  if (url.pathname === "/" ) {
    if (pages.length === 1) return sendPage(response, pages[0]);
    return sendIndex(response, pages);
  }

  const name = decodeURIComponent(url.pathname.replace(/^\//, ""));
  if (pages.includes(name)) return sendPage(response, name);

  response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
  response.end("Nuk u gjet.");
});

server.listen(PORT, () => {
  const pages = listPages();
  console.log(`Pamja e faqeve: http://localhost:${PORT}`);
  console.log(pages.length ? `Faqe: ${pages.join(", ")}` : "Ende s'ka faqe — ndërtoje njërën me build-review-page.mjs");
});

function listPages() {
  if (!fs.existsSync(PAGES)) return [];
  return fs.readdirSync(PAGES).filter((file) => file.endsWith(".html")).sort();
}

function sendPage(response, name) {
  const fragment = fs.readFileSync(path.join(PAGES, name), "utf8");
  response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  response.end(
    `<!doctype html><html lang="sq"><head><meta charset="utf-8">` +
      `<meta name="viewport" content="width=device-width, initial-scale=1">` +
      `</head><body>${fragment}</body></html>`,
  );
}

function sendIndex(response, pages) {
  const links = pages.map((page) => `<li><a href="/${encodeURIComponent(page)}">${page}</a></li>`).join("");
  response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  response.end(
    `<!doctype html><html lang="sq"><head><meta charset="utf-8"><title>Faqet e kontrollit</title>` +
      `<style>body{font:16px system-ui;margin:40px;line-height:1.7}</style></head>` +
      `<body><h1>Faqet e kontrollit</h1><ul>${links || "<li>Ende s'ka faqe.</li>"}</ul></body></html>`,
  );
}
