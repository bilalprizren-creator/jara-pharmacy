#!/usr/bin/env node
/**
 * Local preview of the built review pages.
 * ----------------------------------------
 * `build-review-page.mjs` writes Artifact pages as *fragments*: a title,
 * styles, markup and script, without the surrounding document, because the
 * Artifact host supplies that skeleton when publishing. A browser opening the
 * file directly would show an unstyled mess, so this server wraps the fragment
 * in the same minimal document and serves it — the only way to check a batch
 * before the whole team gets the link.
 *
 * The web page (`--web`) is a complete document already. It is served as it is
 * under /web/, and its photos under /fotot/ — open http://localhost:5400/web/?lokal
 * and it takes its photos from here, so a build can be checked before a single
 * file is uploaded. Its decisions still go to the real shared table.
 *
 * The Artifact's shared store is not available here (that is a published-page
 * capability), so an Artifact page falls back to per-device storage and says
 * so. That is expected: this preview is for layout and wording.
 *
 * Started through .claude/launch.json ("jara-kontroll") on port 5400.
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PAGES = path.resolve(HERE, "..", "..", ".catalog-cache");
const WEB = path.join(PAGES, "web");
const PHOTOS = path.join(PAGES, "fotot");
const PORT = Number(process.env.PORT) || 5400;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".webp": "image/webp",
  ".txt": "text/plain; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

const server = http.createServer((request, response) => {
  const url = new URL(request.url, `http://localhost:${PORT}`);
  const pages = listPages();

  if (url.pathname === "/" ) {
    if (pages.length === 1 && !fs.existsSync(WEB)) return sendPage(response, pages[0]);
    return sendIndex(response, pages);
  }
  if (url.pathname === "/web") {
    response.writeHead(301, { location: `/web/${url.search}` });
    return response.end();
  }
  if (url.pathname.startsWith("/web/")) return sendFile(response, WEB, url.pathname.slice("/web/".length));
  if (url.pathname.startsWith("/fotot/")) return sendFile(response, PHOTOS, url.pathname.slice("/fotot/".length));

  const name = decodeURIComponent(url.pathname.replace(/^\//, ""));
  if (pages.includes(name)) return sendPage(response, name);

  notFound(response);
});

server.listen(PORT, () => {
  const pages = listPages();
  console.log(`Pamja e faqeve: http://localhost:${PORT}`);
  console.log(pages.length ? `Faqe: ${pages.join(", ")}` : "Ende s'ka faqe — ndërtoje njërën me build-review-page.mjs");
  if (fs.existsSync(WEB)) console.log(`Faqja web: http://localhost:${PORT}/web/?lokal`);
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

function sendFile(response, base, relative) {
  const target = path.resolve(base, decodeURIComponent(relative) || "index.html");
  // Nothing outside the folder it was asked for, whatever the address says.
  if (!target.startsWith(base + path.sep) || !fs.existsSync(target) || !fs.statSync(target).isFile()) {
    return notFound(response);
  }
  response.writeHead(200, { "content-type": TYPES[path.extname(target)] ?? "application/octet-stream" });
  fs.createReadStream(target).pipe(response);
}

function sendIndex(response, pages) {
  const links = pages.map((page) => `<li><a href="/${encodeURIComponent(page)}">${page}</a></li>`).join("");
  const web = fs.existsSync(WEB) ? `<li><a href="/web/?lokal">Faqja web (fotot nga ky kompjuter)</a></li>` : "";
  response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  response.end(
    `<!doctype html><html lang="sq"><head><meta charset="utf-8"><title>Faqet e kontrollit</title>` +
      `<style>body{font:16px system-ui;margin:40px;line-height:1.7}</style></head>` +
      `<body><h1>Faqet e kontrollit</h1><ul>${web}${links || (web ? "" : "<li>Ende s'ka faqe.</li>")}</ul></body></html>`,
  );
}

function notFound(response) {
  response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
  response.end("Nuk u gjet.");
}
