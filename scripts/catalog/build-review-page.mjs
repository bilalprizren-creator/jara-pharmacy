#!/usr/bin/env node
/**
 * Builds the photo review page that the pharmacy team works with.
 * ---------------------------------------------------------------
 * Input is one image-search report — normally the merged
 * `reports/te-gjitha.json` — plus the photos it refers to. There are two
 * outputs, for two situations.
 *
 * `--web` is the page the team actually works with, at the address in
 * `web.json` (jara-fotografite.vercel.app). A pharmacist compares the photo
 * with the pack in their hand, so the photo has to be big: every picture is
 * served as a file — 400 px on the card, 1200 px in the large view — from
 * Supabase Storage (`upload-photos.mjs` puts them there), and every decision
 * goes into a shared Supabase table (`supabase/vendimet.sql`), so the whole
 * team sees it without anyone needing an account. The page itself only carries
 * the product list. Where a product has other candidate photos, the large view
 * shows them as well, and the reviewer can take one of those instead of
 * losing the product.
 *
 * Without `--web` it builds the older, self-contained page: every thumbnail is
 * embedded, because the Artifact viewer blocks external images and caps a page
 * at 16 MB. It stays as the fallback, and sends its reader to the web page.
 *
 * The page is Albanian throughout: it is a working tool for the team in
 * Prizren, not a report for the maintainer.
 *
 * Usage:
 *   node scripts/catalog/build-review-page.mjs --web --report reports/te-gjitha.json --title "Fotografitë Jara" --seria "Të gjitha produktet me fotografi"
 *   node scripts/catalog/build-review-page.mjs --report reports/te-gjitha.json --title "Fotografitë Jara" --seria "Të gjitha produktet me fotografi"
 *   node scripts/catalog/build-review-page.mjs --title "Seria 02" --limit 50
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { prepareDerivatives } from "./lib/photo-derivatives.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..");
const OUT_DIR = path.join(ROOT, ".catalog-cache");
const WEB_DIR = path.join(OUT_DIR, "web");
const PHOTO_DIR = path.join(OUT_DIR, "fotot");
const CONFIG_FILE = path.join(HERE, "web.json");

const PAGE_LIMIT_MB = 16;
const DEFAULT_SITE = "https://jara-fotografite.vercel.app";

/**
 * Thumbnails shrink as the batch grows, because the whole Artifact page has to
 * stay under the 16 MB ceiling and a batch that overflows it cannot be
 * published at all. That ceiling is also why the team no longer works on this
 * page: at 170 px a photo shows that something is there, not what the pack
 * says. The web page has no ceiling; it serves real files.
 */
function thumbFor(count) {
  // Measured: a card costs roughly (size/40)² bytes in WebP, so the ceiling is
  // reached around 2.700 products at 200 px. The catalogue passed that once the
  // local shops came in, hence the two smaller steps.
  if (count > 4800) return { size: 150, quality: 58 };
  if (count > 3400) return { size: 170, quality: 62 };
  if (count > 2600) return { size: 200, quality: 66 };
  if (count > 1500) return { size: 240, quality: 70 };
  return { size: 300, quality: 74 };
}

async function main() {
  const args = readArgs(process.argv.slice(2));
  const reportPath = path.resolve(HERE, args.report);
  if (!fs.existsSync(reportPath)) {
    console.error(`\n  Bericht nicht gefunden: ${reportPath}\n`);
    process.exit(1);
  }

  const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
  const source = report.photos ?? report.products ?? [];
  const selected = args.limit ? source.slice(0, args.limit) : source;

  console.log(`\n  Prüfseite "${args.title}" — ${selected.length} Produkte${args.web ? " · Web" : ""}`);
  console.log(`  ${"-".repeat(60)}`);

  if (args.web) await buildWeb(args, report, selected);
  else await buildArtifact(args, report, selected);
}

/* ------------------------------------------------------------------ */
/*  Artifact: every thumbnail inside the page                          */
/* ------------------------------------------------------------------ */

async function buildArtifact(args, report, selected) {
  const thumb = thumbFor(selected.length);
  const items = [];
  const missing = [];
  const damaged = [];
  for (const [index, entry] of selected.entries()) {
    const file = path.join(ROOT, entry.file ?? "");
    if (!entry.file || !fs.existsSync(file)) {
      missing.push(entry.code);
      continue;
    }

    // One truncated download must not cost the whole batch: a photo that will
    // not decode is left out and listed, so it can be fetched again later.
    let picture;
    try {
      picture = await sharp(file)
        .resize(thumb.size, thumb.size, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: thumb.quality })
        .toBuffer();
    } catch {
      damaged.push({ code: entry.code, file: entry.file, bytes: fs.statSync(file).size });
      continue;
    }

    items.push({ ...describe(entry, index), foto: `data:image/webp;base64,${picture.toString("base64")}` });
    if ((index + 1) % 25 === 0) process.stdout.write(`     ${index + 1} Bilder aufbereitet\r`);
  }

  const siteUrl = readConfig({ required: false })?.siteUrl ?? DEFAULT_SITE;
  const { head, body } = renderPage({
    mode: "artifact",
    title: args.title,
    seria: args.seria,
    label: report.label ?? "seria",
    items,
    siteUrl,
  });
  const html = `${head}\n${body}`;
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const outFile = path.join(OUT_DIR, `${slug(args.title)}.html`);
  fs.writeFileSync(outFile, html, "utf8");

  // A second, standalone copy: the fragment above is what the Artifact host
  // wraps and publishes, but a plain .html file that opens on double-click is
  // the fallback when publishing is unavailable. Decisions are per-device
  // there, which the page states itself.
  const standalone =
    '<!doctype html><html lang="sq"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    `</head><body>${html}</body></html>`;
  const standaloneFile = path.join(OUT_DIR, `${slug(args.title)}-vetestrukturuar.html`);
  fs.writeFileSync(standaloneFile, standalone, "utf8");

  const megabytes = Buffer.byteLength(html, "utf8") / 1024 / 1024;
  console.log(`     ${items.length} Bilder eingebettet`);
  if (missing.length) console.log(`     ${missing.length} ohne Bilddatei: ${missing.slice(0, 5).join(", ")}`);
  if (damaged.length) {
    console.log(`     ${damaged.length} beschädigt, müssen neu geholt werden:`);
    for (const item of damaged) console.log(`        ${item.code} (${item.bytes} Byte) ${item.file}`);
  }
  console.log(`     Seitengröße ${megabytes.toFixed(1)} MB von ${PAGE_LIMIT_MB} MB erlaubt`);
  if (megabytes > PAGE_LIMIT_MB * 0.9) {
    console.log("     ACHTUNG: nahe am Limit — den Stapel kleiner schneiden (--limit).");
  }
  console.log(`\n  Geschrieben: ${path.relative(ROOT, outFile)}\n`);
}

/* ------------------------------------------------------------------ */
/*  Web: photos as files, decisions shared                             */
/* ------------------------------------------------------------------ */

async function buildWeb(args, report, selected) {
  const config = readConfig({ required: true });
  const exists = (file) => Boolean(file) && fs.existsSync(path.join(ROOT, file));

  // Chosen photos and their alternatives go through the same mill: a reviewer
  // who turns the first photo down should see the others just as big.
  const files = [];
  const missing = new Set();
  for (const entry of selected) {
    if (!exists(entry.file)) {
      missing.add(entry.code);
      continue;
    }
    files.push(entry.file);
    for (const other of entry.alternatives ?? []) if (exists(other.file)) files.push(other.file);
  }

  const { keys, failed } = await prepareDerivatives(files, {
    root: ROOT,
    outDir: PHOTO_DIR,
    onProgress: (done, total) => {
      if (done % 100 === 0 || done === total) process.stdout.write(`     ${done}/${total} Fotos aufbereitet\r`);
    },
  });

  const items = [];
  const damaged = [];
  const used = new Set();
  for (const [index, entry] of selected.entries()) {
    if (missing.has(entry.code)) continue;
    const key = keys.get(entry.file);
    if (!key) {
      damaged.push(entry);
      continue;
    }
    const alt = [];
    for (const other of entry.alternatives ?? []) {
      const altKey = keys.get(other.file);
      if (altKey && altKey !== key && !alt.includes(altKey)) alt.push(altKey);
    }
    items.push({ ...describe(entry, index), k: key, alt });
    used.add(key);
    for (const altKey of alt) used.add(altKey);
  }

  const { head, body } = renderPage({
    mode: "web",
    title: args.title,
    seria: args.seria,
    label: report.label ?? "seria",
    items,
    config,
  });
  const html =
    '<!doctype html><html lang="sq"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<meta name="robots" content="noindex, nofollow">' +
    `${head}</head><body>${body}</body></html>`;

  fs.mkdirSync(WEB_DIR, { recursive: true });
  fs.writeFileSync(path.join(WEB_DIR, "index.html"), html, "utf8");
  // An internal tool with our article codes and the shops' addresses: it is
  // reached through the link, never through a search engine.
  fs.writeFileSync(path.join(WEB_DIR, "robots.txt"), "User-agent: *\nDisallow: /\n", "utf8");
  const headers = {
    headers: [{ source: "/(.*)", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }] }],
  };
  fs.writeFileSync(path.join(WEB_DIR, "vercel.json"), `${JSON.stringify(headers, null, 2)}\n`, "utf8");
  // What upload-photos.mjs has to put into storage: every photo a card or the
  // large view can ask for, and nothing else.
  const manifest = { generatedAt: new Date().toISOString(), keys: [...used].sort() };
  fs.writeFileSync(path.join(PHOTO_DIR, "te-perdorura.json"), `${JSON.stringify(manifest)}\n`, "utf8");

  const damagedFiles = new Set(damaged.map((entry) => entry.file));
  const lostAlternatives = failed.filter((item) => !damagedFiles.has(item.file)).length;
  const megabytes = Buffer.byteLength(html, "utf8") / 1024 / 1024;
  console.log(`     ${items.length} Produkte, ${used.size} Fotos in zwei Größen (400 px und 1200 px)          `);
  if (missing.size) console.log(`     ${missing.size} ohne Bilddatei: ${[...missing].slice(0, 5).join(", ")}`);
  if (damaged.length) {
    console.log(`     ${damaged.length} beschädigt, müssen neu geholt werden:`);
    for (const entry of damaged) console.log(`        ${entry.code} ${entry.file}`);
  }
  if (lostAlternatives) console.log(`     ${lostAlternatives} Alternativfotos ließen sich nicht lesen und fehlen in der Auswahl`);
  console.log(`     Seitengröße ${megabytes.toFixed(1)} MB`);
  console.log(`\n  Geschrieben: ${path.relative(ROOT, path.join(WEB_DIR, "index.html"))}`);
  console.log("  Weiter: node scripts/catalog/upload-photos.mjs, dann in .catalog-cache/web: vercel deploy --prod\n");
}

/* ------------------------------------------------------------------ */

/** The product facts both pages show; only how the photo travels differs. */
function describe(entry, index) {
  return {
    nr: entry.number ?? index + 1,
    kodi: entry.code,
    emri: entry.name,
    brendi: entry.brand || "",
    barkodi: entry.barcode || "",
    besueshmeria: entry.confidence || "",
    statusi: entry.status || "",
    shenimi: entry.note || "",
    burimi: entry.sourcePage || "",
    // Present only on the merged report: how much the picture looks like a
    // packshot. It is a hint for the reviewer, never a filter on our side.
    cilesia: typeof entry.quality === "number" ? entry.quality : null,
    vleresimi: entry.verdict || "",
  };
}

/**
 * `web.json` holds where the web page finds its photos and its decisions. The
 * key in it is Supabase's publishable key: it is meant to sit in a public page,
 * and the database rules in `supabase/vendimet.sql` decide what it may do.
 */
function readConfig({ required }) {
  const fail = (message) => {
    if (!required) return null;
    console.error(`\n  ${message}\n`);
    process.exit(1);
  };
  if (!fs.existsSync(CONFIG_FILE)) {
    return fail(`${path.relative(ROOT, CONFIG_FILE)} fehlt — dort stehen Supabase-Adresse und öffentlicher Schlüssel.`);
  }
  const config = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
  const absent = ["supabaseUrl", "publishableKey", "bucket", "siteUrl"].filter((field) => !config[field]);
  if (absent.length) return fail(`In web.json fehlt: ${absent.join(", ")}`);
  return config;
}

function readArgs(argv) {
  const flag = (name, fallback) => {
    const index = argv.indexOf(`--${name}`);
    return index >= 0 && argv[index + 1] ? argv[index + 1] : fallback;
  };
  return {
    report: flag("report", "reports/gpt-150.json"),
    // `title` names the published page (it is what the team sees in their list
    // of links); `seria` is the batch label printed in the header.
    title: flag("title", "Fotografitë Jara 01"),
    seria: flag("seria", "Seria 01"),
    limit: Number(flag("limit", 0)) || 0,
    web: argv.includes("--web"),
  };
}

const slug = (value) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const ICONS = {
  po: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
  ndoshta: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 17h.01M9.5 9a2.5 2.5 0 1 1 3.6 2.24c-.7.35-1.1 1-1.1 1.76"/></svg>',
  jo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  mbyll: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  para: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
  pas: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>',
  fillo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>',
};

/* ------------------------------------------------------------------ */
/*  The page                                                           */
/* ------------------------------------------------------------------ */

function renderPage({ mode, title, seria, label, items, config, siteUrl }) {
  const web = mode === "web";
  const data = JSON.stringify(items).replace(/</g, "\\u003c");
  const storage = web ? new URL(config.supabaseUrl).origin : "";
  const settings = web
    ? { supabaseUrl: config.supabaseUrl, publishableKey: config.publishableKey, bucket: config.bucket }
    : null;

  const head = `<title>${escapeHtml(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
${web ? `<link rel="preconnect" href="${storage}">\n<link rel="preconnect" href="${storage}" crossorigin>\n` : ""}<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700&display=swap">
<style>
${styles()}
</style>`;

  const intro = web
    ? `<div class="nisja">
    <p>Prek një fotografi për ta parë të madhe, ose fillo nga produkti i parë që s'është kontrolluar ende.</p>
    <button type="button" class="start" id="fillo">${ICONS.fillo} Fillo kontrollin</button>
  </div>`
    : `<p class="notice notice-info">Kontrolli i ekipit bëhet te <a href="${escapeHtml(siteUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(siteUrl.replace(/^https?:\/\//, ""))}</a> — atje fotografitë janë të mëdha dhe vendimet i sheh i gjithë ekipi.</p>`;

  const body = `
<header class="top">
  <div class="wrap top-inner">
    <div class="brand">
      <span class="mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
          <path d="M12 5v14M5 12h14"/>
        </svg>
      </span>
      <div>
        <h1>Kontrolli i fotografive</h1>
        <p class="sub">${escapeHtml(seria)} · ${items.length} produkte</p>
      </div>
    </div>

    <div class="who">
      <label for="reviewer">Kush po kontrollon?</label>
      <input id="reviewer" type="text" placeholder="Emri yt" autocomplete="name" spellcheck="false" maxlength="60">
    </div>
  </div>

  <div class="wrap">
    <div class="progress" role="group" aria-label="Ecuria e kontrollit">
      <div class="bar"><span id="barFill"></span></div>
      <p id="progressText" class="progress-text">0 nga ${items.length} të kontrolluara</p>
    </div>

    <div class="tools">
      <input id="search" class="search" type="search" placeholder="Kërko: emri, marka ose barkodi" aria-label="Kërko produkt">
      <div class="chips" id="filters" role="tablist">
        <button class="chip is-on" data-filter="pa" role="tab" aria-selected="true">Pa kontrolluar <span data-count="pa">0</span></button>
        <button class="chip" data-filter="te-gjitha" role="tab" aria-selected="false">Të gjitha <span data-count="te-gjitha">0</span></button>
        <button class="chip chip-yes" data-filter="pranuar" role="tab" aria-selected="false">Përshtaten <span data-count="pranuar">0</span></button>
        <button class="chip chip-maybe" data-filter="pasiguri" role="tab" aria-selected="false">Të pasigurta <span data-count="pasiguri">0</span></button>
        <button class="chip chip-no" data-filter="refuzuar" role="tab" aria-selected="false">Nuk përshtaten <span data-count="refuzuar">0</span></button>
        <button class="chip chip-weak" data-filter="dobet" role="tab" aria-selected="false">Foto e dobët <span data-count="dobet">0</span></button>
      </div>
    </div>
  </div>
</header>

<main class="wrap">
  ${intro}
  <p id="notice" class="notice" hidden></p>
  <div id="grid" class="grid"${web ? " data-web" : ""}></div>
  <div id="meShume" class="more" aria-hidden="true"></div>
  <p id="empty" class="empty" hidden>Asnjë produkt nuk përputhet me kërkimin.</p>
</main>

<footer class="wrap foot">
  <p>Krahasoje fotografinë me paketimin e vërtetë para se ta pranosh.${web ? " Prek fotografinë për ta parë të madhe." : ""} Vendimet ruhen vetë dhe i sheh i gjithë ekipi.</p>
</footer>
${web ? dialogMarkup() : ""}
<script>
${script(data, label, settings)}
</script>
`;
  return { head, body };
}

/** The large view: one product at a time, as big as the screen allows. */
function dialogMarkup() {
  return `
<dialog id="pamja" class="pamja" aria-labelledby="pamjaEmri">
  <div class="pamja-top">
    <button type="button" class="btn-ikon" data-veprim="mbyll" aria-label="Mbyll">${ICONS.mbyll}</button>
    <p id="pamjaPozita" class="pamja-pozita"></p>
    <div class="pamja-nav">
      <button type="button" class="btn-ikon" data-veprim="para" aria-label="E mëparshmja">${ICONS.para}</button>
      <button type="button" class="btn-ikon" data-veprim="pas" aria-label="Tjetra">${ICONS.pas}</button>
    </div>
  </div>
  <div class="pamja-trup">
    <div id="pamjaFoto" class="pamja-foto">
      <button type="button" id="pamjaZoom" class="pamja-zoom" aria-label="Zmadho fotografinë"><img id="pamjaImg" alt="" decoding="async"></button>
    </div>
    <div class="pamja-info">
      <p id="pamjaFlamuri" class="pamja-flamuri"></p>
      <h2 id="pamjaEmri" class="pamja-emri"></h2>
      <p id="pamjaMeta" class="meta"></p>
      <p id="pamjaBarkod" class="pamja-barkod"></p>
      <label id="pamjaKush" class="pamja-kush" hidden>
        <span>Kush po kontrollon? Shkruaj emrin tënd:</span>
        <input id="pamjaReviewer" type="text" placeholder="Emri yt" autocomplete="name" spellcheck="false" maxlength="60">
      </label>
      <div class="actions">
        <button type="button" class="act act-yes" data-vendim="pranuar">${ICONS.po} <span id="pamjaPo">Përshtatet</span></button>
        <button type="button" class="act act-maybe" data-vendim="pasiguri" title="I pasigurt" aria-label="I pasigurt">${ICONS.ndoshta}</button>
        <button type="button" class="act act-no" data-vendim="refuzuar" title="Nuk përshtatet" aria-label="Nuk përshtatet">${ICONS.jo}</button>
      </div>
      <p id="pamjaNga" class="by"></p>
      <div id="pamjaAlt" class="pamja-alt" hidden>
        <p class="pamja-alt-titull">Fotografi të tjera</p>
        <div id="pamjaAltLista" class="pamja-alt-lista" role="group" aria-label="Fotografi të tjera"></div>
      </div>
      <p id="pamjaShenimi" class="note" hidden></p>
      <a id="pamjaBurimi" class="src" target="_blank" rel="noopener noreferrer" hidden>Shiko burimin</a>
    </div>
  </div>
</dialog>`;
}

/* ------------------------------------------------------------------ */

function styles() {
  return `
:root {
  --forest: #0A5C44;
  --deep: #073B2D;
  --emerald: #0F7A57;
  --lime: #B7E532;
  --lime-soft: #DDF38A;
  --ground: #F7FAF8;
  --card: #FFFFFF;
  --ink: #04241C;
  --ink-soft: #4A6B5F;
  --line: #DCE7E1;
  --yes: #0F7A57;
  --yes-soft: #EAF8F0;
  --maybe: #A9761B;
  --maybe-soft: #FFF6D8;
  --no: #B3453C;
  --no-soft: #FBEBE9;
  --shadow: 0 1px 2px rgba(7,59,45,.06), 0 8px 24px rgba(7,59,45,.06);
  --radius: 20px;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --ground: #04211A;
    --card: #073126;
    --ink: #EAF4EF;
    --ink-soft: #9FC0B2;
    --line: #124636;
    --yes-soft: #06382A;
    --maybe-soft: #3A2E0C;
    --no-soft: #40201D;
    --maybe: #E2B75C;
    --no: #E98D83;
    --yes: #6FD3A8;
    --shadow: 0 1px 2px rgba(0,0,0,.3), 0 8px 24px rgba(0,0,0,.25);
  }
}
:root[data-theme="dark"] {
  --ground: #04211A;
  --card: #073126;
  --ink: #EAF4EF;
  --ink-soft: #9FC0B2;
  --line: #124636;
  --yes-soft: #06382A;
  --maybe-soft: #3A2E0C;
  --no-soft: #40201D;
  --maybe: #E2B75C;
  --no: #E98D83;
  --yes: #6FD3A8;
  --shadow: 0 1px 2px rgba(0,0,0,.3), 0 8px 24px rgba(0,0,0,.25);
}

* { box-sizing: border-box; }
body {
  margin: 0;
  background: var(--ground);
  color: var(--ink);
  font-family: Inter, system-ui, -apple-system, "Segoe UI", sans-serif;
  font-size: 15px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}
.wrap { width: min(1180px, 100%); margin-inline: auto; padding-inline: 16px; }

/* ---- header ---- */
.top {
  position: sticky; top: 0; z-index: 20;
  background: color-mix(in srgb, var(--ground) 92%, transparent);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--line);
  padding-block: 14px 12px;
}
.top-inner { display: flex; flex-wrap: wrap; gap: 14px; align-items: center; justify-content: space-between; }
.brand { display: flex; align-items: center; gap: 12px; }
.mark {
  display: grid; place-items: center; width: 38px; height: 38px; flex: none;
  border-radius: 12px; background: var(--forest); color: var(--lime);
}
.mark svg { width: 20px; height: 20px; }
h1 {
  margin: 0;
  font-family: "Bricolage Grotesque", Inter, system-ui, sans-serif;
  font-size: clamp(19px, 3.6vw, 24px);
  font-weight: 700; letter-spacing: -0.02em; text-wrap: balance;
}
.sub { margin: 1px 0 0; color: var(--ink-soft); font-size: 13px; }

.who { display: flex; align-items: center; gap: 8px; }
.who label { font-size: 12px; color: var(--ink-soft); text-transform: uppercase; letter-spacing: .06em; font-weight: 600; }
.who input {
  width: 148px; padding: 8px 12px; border-radius: 999px;
  border: 1px solid var(--line); background: var(--card); color: var(--ink);
  font: inherit; font-size: 14px;
}
.who input:focus-visible, .search:focus-visible { outline: 2px solid var(--emerald); outline-offset: 1px; }

.progress { display: flex; align-items: center; gap: 12px; margin-top: 12px; }
.bar { flex: 1; height: 7px; border-radius: 999px; background: var(--line); overflow: hidden; }
.bar span { display: block; height: 100%; width: 0%; border-radius: 999px; background: linear-gradient(90deg, var(--emerald), var(--lime)); transition: width .35s ease; }
.progress-text { margin: 0; font-size: 13px; color: var(--ink-soft); font-variant-numeric: tabular-nums; white-space: nowrap; }

.tools { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-top: 12px; }
.search {
  flex: 1 1 240px; min-width: 0; padding: 10px 14px; border-radius: 999px;
  border: 1px solid var(--line); background: var(--card); color: var(--ink); font: inherit; font-size: 14px;
}
.chips { display: flex; gap: 6px; flex-wrap: wrap; }
.chip {
  border: 1px solid var(--line); background: var(--card); color: var(--ink-soft);
  padding: 8px 13px; border-radius: 999px; font: inherit; font-size: 13px; font-weight: 500;
  cursor: pointer; display: inline-flex; gap: 6px; align-items: center;
}
.chip span { font-variant-numeric: tabular-nums; opacity: .65; font-size: 12px; }
.chip:hover { border-color: var(--emerald); }
.chip.is-on { background: var(--forest); border-color: var(--forest); color: #fff; }
.chip.is-on span { opacity: .8; }
.chip:focus-visible { outline: 2px solid var(--emerald); outline-offset: 2px; }

/* ---- grid ---- */
.grid {
  display: grid; gap: 14px; padding-block: 18px;
  grid-template-columns: repeat(auto-fill, minmax(232px, 1fr));
}
.card {
  background: var(--card); border: 1px solid var(--line); border-radius: var(--radius);
  box-shadow: var(--shadow); overflow: hidden; display: flex; flex-direction: column;
}
.card.done-pranuar { border-color: color-mix(in srgb, var(--yes) 55%, var(--line)); }
.card.done-refuzuar { border-color: color-mix(in srgb, var(--no) 55%, var(--line)); }
.card.done-pasiguri { border-color: color-mix(in srgb, var(--maybe) 55%, var(--line)); }

.shot {
  position: relative; aspect-ratio: 1; display: grid; place-items: center; padding: 10%;
  background: linear-gradient(180deg, #FFFFFF 0%, #F1F6F3 100%);
}
.shot img { max-width: 100%; max-height: 100%; object-fit: contain; }
.flag {
  position: absolute; inset-block-start: 9px; inset-inline-start: 9px;
  padding: 4px 9px; border-radius: 999px; font-size: 11px; font-weight: 600;
  background: var(--maybe-soft); color: var(--maybe); border: 1px solid color-mix(in srgb, var(--maybe) 35%, transparent);
}
.flag.hard { background: var(--no-soft); color: var(--no); border-color: color-mix(in srgb, var(--no) 35%, transparent); }
.flag.weak {
  inset-inline-start: auto; inset-inline-end: 9px;
  background: var(--card); color: var(--ink-soft); border-color: var(--line);
}
.chip-weak.is-on { background: var(--maybe); border-color: var(--maybe); }

.body { padding: 12px 13px 13px; display: flex; flex-direction: column; gap: 7px; flex: 1; }
.name { margin: 0; font-size: 14px; font-weight: 600; line-height: 1.32; text-wrap: balance; }
.meta { margin: 0; font-size: 12px; color: var(--ink-soft); display: flex; flex-wrap: wrap; gap: 4px 8px; }
.meta b { font-weight: 600; color: var(--ink); }
.code { font-variant-numeric: tabular-nums; letter-spacing: .01em; }
.note { margin: 0; font-size: 12px; color: var(--maybe); }
.src { font-size: 12px; color: var(--emerald); text-decoration: none; word-break: break-all; }
.src:hover { text-decoration: underline; }

.actions { display: grid; grid-template-columns: 1fr auto auto; gap: 6px; margin-top: auto; padding-top: 4px; }
.act {
  border: 1px solid var(--line); background: var(--card); color: var(--ink);
  border-radius: 999px; padding: 10px 12px; font: inherit; font-size: 13px; font-weight: 600;
  cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  min-height: 42px;
}
.act:focus-visible { outline: 2px solid var(--emerald); outline-offset: 2px; }
.act-yes.is-on { background: var(--yes-soft); border-color: var(--yes); color: var(--yes); }
.act-maybe.is-on { background: var(--maybe-soft); border-color: var(--maybe); color: var(--maybe); }
.act-no.is-on { background: var(--no-soft); border-color: var(--no); color: var(--no); }
.act-maybe, .act-no { width: 44px; padding-inline: 0; }
.act svg { width: 17px; height: 17px; }

.by { margin: 0; font-size: 11px; color: var(--ink-soft); min-height: 14px; }

.notice {
  margin: 16px 0 0; padding: 11px 14px; border-radius: 14px;
  background: var(--maybe-soft); color: var(--maybe); font-size: 13px;
  border: 1px solid color-mix(in srgb, var(--maybe) 30%, transparent);
}
.notice-info { background: var(--yes-soft); color: var(--yes); border-color: color-mix(in srgb, var(--yes) 30%, transparent); }
.notice-info a { color: inherit; font-weight: 600; }
.empty { text-align: center; color: var(--ink-soft); padding: 40px 0; }
.foot { padding-block: 22px 40px; color: var(--ink-soft); font-size: 13px; }
.foot p { margin: 0; max-width: 62ch; }
.more { height: 1px; }

/* ---- web page: the photo fills the card and opens large ---- */
.grid[data-web] .shot { padding: 4%; }
.grid[data-web] .shot img { width: 100%; height: 100%; }
button.shot {
  width: 100%; margin: 0; border: 0; border-radius: 0;
  font: inherit; color: inherit; cursor: zoom-in;
  -webkit-tap-highlight-color: transparent;
}
button.shot:focus-visible { outline: 2px solid var(--emerald); outline-offset: -3px; }
.flag.below {
  inset-block-start: auto; inset-block-end: 9px;
  background: var(--card); color: var(--ink-soft); border-color: var(--line);
}
.flag.taken { background: var(--yes-soft); color: var(--yes); border-color: color-mix(in srgb, var(--yes) 35%, transparent); }

.nisja {
  display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px 16px;
  margin-top: 16px; padding: 12px 14px 12px 16px; border-radius: var(--radius);
  background: var(--card); border: 1px solid var(--line); box-shadow: var(--shadow);
}
.nisja p { margin: 0; flex: 1 1 260px; font-size: 14px; color: var(--ink-soft); }
.start {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  min-height: 44px; padding: 10px 18px; border: 0; border-radius: 999px;
  background: var(--forest); color: #fff; font: inherit; font-size: 14px; font-weight: 600; cursor: pointer;
}
.start:hover { background: var(--deep); }
.start:focus-visible { outline: 2px solid var(--emerald); outline-offset: 2px; }
.start svg { width: 17px; height: 17px; }

/* ---- the large view ---- */
html.pamja-hapur { overflow: hidden; }
.pamja {
  width: 100%; max-width: 100%;
  height: 100%; height: 100dvh; max-height: 100%; max-height: 100dvh;
  margin: 0; padding: 0; border: 0;
  background: var(--card); color: var(--ink);
}
.pamja[open] { display: flex; flex-direction: column; }
.pamja::backdrop { background: rgba(4, 36, 28, .6); }
.pamja-top {
  flex: none; display: flex; align-items: center; justify-content: space-between; gap: 10px;
  padding: 10px 12px; border-bottom: 1px solid var(--line);
}
.pamja-pozita { margin: 0; font-size: 13px; color: var(--ink-soft); font-variant-numeric: tabular-nums; }
.pamja-nav { display: flex; gap: 8px; }
.btn-ikon {
  display: grid; place-items: center; flex: none; width: 44px; height: 44px; padding: 0;
  border: 1px solid var(--line); border-radius: 999px; background: var(--card); color: var(--ink); cursor: pointer;
}
.btn-ikon svg { width: 20px; height: 20px; }
.btn-ikon:hover { border-color: var(--emerald); }
.btn-ikon:disabled { opacity: .35; cursor: default; border-color: var(--line); }
.btn-ikon:focus-visible { outline: 2px solid var(--emerald); outline-offset: 2px; }
.pamja-trup { flex: 1; min-height: 0; display: flex; flex-direction: column; }
/* The photo sits on white in both themes: packshots are made for white, and a
   transparent one would otherwise take the dark ground for its background. */
.pamja-foto {
  flex: 1 1 55%; min-height: 0; overflow: auto; overscroll-behavior: contain;
  display: grid; place-items: center; background: #FFFFFF;
}
.pamja-zoom {
  display: grid; place-items: center; width: 100%; height: 100%; margin: 0; padding: 12px;
  border: 0; background: none; cursor: zoom-in;
}
.pamja-zoom:disabled { cursor: default; }
.pamja-zoom:focus-visible { outline: 2px solid var(--emerald); outline-offset: -4px; }
.pamja-zoom img { width: 100%; height: 100%; object-fit: contain; }
.pamja-foto.is-zoom { place-items: start; }
.pamja-foto.is-zoom .pamja-zoom { width: max-content; height: max-content; padding: 0; cursor: zoom-out; }
.pamja-foto.is-zoom .pamja-zoom img { width: auto; height: auto; max-width: none; max-height: none; }
.pamja-info {
  flex: 0 1 auto; max-height: 50%; overflow: auto; overscroll-behavior: contain;
  display: flex; flex-direction: column; gap: 9px; padding: 14px 16px 18px;
  border-top: 1px solid var(--line);
}
.pamja-flamuri { display: flex; flex-wrap: wrap; gap: 6px; margin: 0; }
.pamja-flamuri:empty { display: none; }
.pamja .flag { position: static; display: inline-block; }
.pamja-emri { margin: 0; font-size: 18px; font-weight: 600; line-height: 1.3; text-wrap: balance; }
.pamja-barkod { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: .05em; font-variant-numeric: tabular-nums; }
.pamja-alt-titull {
  margin: 0 0 6px; font-size: 12px; font-weight: 600; color: var(--ink-soft);
  text-transform: uppercase; letter-spacing: .06em;
}
.pamja-alt-lista { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 2px; }
.alt-foto {
  display: flex; flex-direction: column; align-items: center; gap: 3px; flex: none; width: 78px;
  padding: 5px 5px 4px; border: 2px solid var(--line); border-radius: 14px; background: #FFFFFF;
  font: inherit; cursor: pointer;
}
.alt-foto img { width: 64px; height: 64px; object-fit: contain; }
.alt-foto span { font-size: 10px; font-weight: 600; color: #4A6B5F; }
.alt-foto[aria-pressed="true"] {
  border-color: var(--emerald);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--emerald) 25%, transparent);
}
.alt-foto:focus-visible { outline: 2px solid var(--emerald); outline-offset: 2px; }
.pamja-kush { display: flex; flex-direction: column; gap: 6px; font-size: 13px; font-weight: 600; color: var(--maybe); }
.pamja-kush input {
  padding: 10px 14px; border-radius: 999px; border: 1px solid var(--maybe);
  background: var(--card); color: var(--ink); font: inherit; font-size: 15px;
}
.pamja-kush input:focus-visible { outline: 2px solid var(--emerald); outline-offset: 1px; }
.pamja .actions { margin-top: 2px; }
@media (min-width: 900px) {
  .pamja {
    width: min(1180px, calc(100% - 48px)); height: min(880px, calc(100% - 48px)); max-height: calc(100% - 48px);
    margin: auto; border-radius: 24px; overflow: hidden; box-shadow: 0 24px 80px rgba(4, 36, 28, .35);
  }
  .pamja-trup { flex-direction: row; }
  .pamja-foto { flex: 1 1 auto; }
  .pamja-info { flex: 0 0 380px; max-height: none; border-top: 0; border-inline-start: 1px solid var(--line); }
}

/* On a phone the header is competing with the products for a small screen,
   and it is sticky — so it gets tighter, and the filters become one
   swipeable row instead of stacking into three. */
@media (max-width: 560px) {
  .top { padding-block: 10px 8px; }
  .top-inner { gap: 10px; }
  .mark { width: 32px; height: 32px; border-radius: 10px; }
  .sub { font-size: 12px; }
  .who { width: 100%; }
  .who label {
    position: absolute; width: 1px; height: 1px; overflow: hidden;
    clip-path: inset(50%); white-space: nowrap;
  }
  .who input { flex: 1; width: auto; padding-block: 7px; }
  .progress { margin-top: 9px; }
  .tools { margin-top: 9px; gap: 8px; }
  .search { padding-block: 8px; }
  /* Bleed to the screen edges with negative margins, never 100vw: with a
     scrollbar present 100vw is wider than the viewport and pushes the whole
     page sideways. */
  .chips {
    flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none;
    margin-inline: -16px; padding-inline: 16px;
  }
  .chips::-webkit-scrollbar { display: none; }
  .chip { flex: none; padding: 7px 11px; }
  .grid { grid-template-columns: repeat(auto-fill, minmax(158px, 1fr)); gap: 10px; padding-block: 12px; }
  /* Three buttons in a row do not fit a half-screen card: the main answer gets
     its own full-width row, the two rarer ones share the next one. Every target
     stays comfortably tappable. */
  .actions { grid-template-columns: 1fr 1fr; }
  .act-yes { grid-column: 1 / -1; }
  .act-maybe, .act-no { width: auto; }
  .name { font-size: 13px; }
  .meta { font-size: 11px; }
  .body { padding: 10px 11px 11px; gap: 6px; }
  .nisja { padding: 12px; }
  .start { width: 100%; }
  .pamja-barkod { font-size: 20px; }
}
@media (prefers-reduced-motion: reduce) {
  * { transition: none !important; animation: none !important; }
}
`;
}

/* ------------------------------------------------------------------ */

function script(data, label, settings) {
  const pageIcons = { po: ICONS.po, ndoshta: ICONS.ndoshta, jo: ICONS.jo };
  return `
const PRODUKTET = ${data};
const SERIA = ${JSON.stringify(label)};
const KONFIG = ${JSON.stringify(settings)};
const WEB = KONFIG !== null;
const RUAJTJA = "jara-kontroll-" + SERIA;
const RADHA = "jara-radha-" + SERIA;
const ikona = ${JSON.stringify(pageIcons)};

const grid = document.getElementById("grid");
const search = document.getElementById("search");
const reviewer = document.getElementById("reviewer");
const notice = document.getElementById("notice");
const empty = document.getElementById("empty");
const barFill = document.getElementById("barFill");
const progressText = document.getElementById("progressText");
const meShume = document.getElementById("meShume");

const sipasKodit = new Map(PRODUKTET.map((p) => [p.kodi, p]));
// kodi -> { kodi, vendimi, foto, nga, kur }. An answer taken back stays here
// with vendimi null, so an older copy of it arriving late cannot revive it.
let vendimet = {};
let filtri = "pa";
let kerkimi = "";
let listi = [];           // what the current filter and search show
let shfaqur = 0;          // how much of it is drawn
const kartat = new Map(); // kodi -> its card on screen

// Two kinds of message share one bar: a standing one about where decisions are
// being stored, and short-lived hints. A hint must never erase the standing
// message, or the reviewer stops knowing that the team cannot see their work.
let njoftimiQendrueshem = "";
function njofto(tekst) {
  notice.textContent = tekst || njoftimiQendrueshem;
  notice.hidden = !(tekst || njoftimiQendrueshem);
}
function njoftimQendrueshem(tekst) {
  njoftimiQendrueshem = tekst;
  njofto("");
}

/* ---- who is reviewing (remembered on this device only) ---- */
try { reviewer.value = localStorage.getItem("jara-kontrollues") || ""; } catch (e) {}
function emri() { return reviewer.value.trim(); }
function ruajEmrin(vlera) {
  reviewer.value = vlera;
  try { localStorage.setItem("jara-kontrollues", vlera.trim()); } catch (e) {}
}
reviewer.addEventListener("change", () => ruajEmrin(reviewer.value));

/* ---- this device's copy, so the page always works ---- */
function ruajLokal() {
  try { localStorage.setItem(RUAJTJA, JSON.stringify(vendimet)); } catch (e) {}
}
try { vendimet = JSON.parse(localStorage.getItem(RUAJTJA) || "{}"); } catch (e) { vendimet = {}; }

function vendimiI(kodi) {
  const v = vendimet[kodi];
  return v && v.vendimi ? v.vendimi : "";
}

/* ---- photos (web page) ---- */
// With ?lokal the photos come from the preview server, so a build can be
// looked at before a single file is uploaded.
const FOTOT = !WEB ? "" : new URLSearchParams(location.search).has("lokal")
  ? "/fotot/"
  : KONFIG.supabaseUrl + "/storage/v1/object/public/" + KONFIG.bucket + "/";
function foto(madhesia, celesi) { return FOTOT + madhesia + "/" + celesi + ".webp"; }
// The card shows the photo the team took — an alternative, once one was.
function fotoEKartes(p) {
  const v = vendimet[p.kodi];
  return v && v.vendimi === "pranuar" && v.foto ? v.foto : p.k;
}

/* ---- the web page's shared store: Supabase ---- */
const API = WEB ? KONFIG.supabaseUrl + "/rest/v1/" : "";
let radha = [];           // answers given here that the server has not confirmed yet
try { radha = JSON.parse(localStorage.getItem(RADHA) || "[]"); } catch (e) { radha = []; }
function ruajRadhen() {
  try { localStorage.setItem(RADHA, JSON.stringify(radha)); } catch (e) {}
}
let iFunditMs = 0;        // the newest server time seen
let ngarkuar = false;     // has the full list come down once?
let lidhja = true;        // did the last exchange with the server work?
let neSinkronizim = false;
let perseri = false;

function riId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
function kohaMs(iso) {
  const koha = Date.parse(iso || "");
  return isNaN(koha) ? 0 : koha;
}

async function kerko(rruga, opsione) {
  const o = opsione || {};
  const pergjigja = await fetch(API + rruga, {
    method: o.method || "GET",
    headers: Object.assign({ apikey: KONFIG.publishableKey, "Content-Type": "application/json" }, o.headers || {}),
    body: o.body,
    cache: "no-store",
  });
  if (!pergjigja.ok) {
    const gabim = new Error("HTTP " + pergjigja.status);
    gabim.status = pergjigja.status;
    throw gabim;
  }
  return pergjigja.status === 204 ? null : pergjigja.json();
}

// The API hands out at most 1000 rows at a time.
async function merrFaqet(rruga) {
  const rreshtat = [];
  for (let fillimi = 0; ; fillimi += 1000) {
    const faqja = await kerko(rruga + "&limit=1000&offset=" + fillimi);
    for (const rresht of faqja) rreshtat.push(rresht);
    if (faqja.length < 1000) return rreshtat;
  }
}

// A server row replaces what this device knows — unless this device holds a
// newer answer of its own that is still on its way.
function zbato(rresht) {
  const tani = vendimet[rresht.kodi];
  if (tani && tani.pritje) return false;
  if (tani && kohaMs(tani.kur) > kohaMs(rresht.kur)) return false;
  if (tani && tani.kur === rresht.kur && tani.vendimi === rresht.vendimi && tani.foto === rresht.foto) return false;
  vendimet[rresht.kodi] = { kodi: rresht.kodi, vendimi: rresht.vendimi, foto: rresht.foto, nga: rresht.nga, kur: rresht.kur, ok: true };
  return true;
}

async function dergo() {
  while (radha.length) {
    const rresht = radha[0];
    let ruajtur = null;
    try {
      const pergjigja = await kerko("vendimet?select=kodi,vendimi,foto,nga,kur", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({ kodi: rresht.kodi, vendimi: rresht.vendimi, foto: rresht.foto, nga: rresht.nga, seria: SERIA }),
      });
      ruajtur = pergjigja && pergjigja[0];
    } catch (gabim) {
      // A row the table itself refuses would hold up every answer behind it for
      // good, so it is set aside. No network, or a server asleep, is waited out.
      if (gabim.status !== 400 && gabim.status !== 409 && gabim.status !== 422) throw gabim;
      console.warn("Serveri nuk e pranoi vendimin", rresht);
    }
    radha.shift();
    ruajRadhen();
    const tani = vendimet[rresht.kodi];
    if (tani && tani.pritje && tani.id === rresht.id) {
      const burimi = ruajtur || tani;
      vendimet[rresht.kodi] = { kodi: burimi.kodi, vendimi: burimi.vendimi, foto: burimi.foto, nga: burimi.nga, kur: burimi.kur, ok: true };
      ruajLokal();
    }
  }
}

async function sinkronizo() {
  if (!WEB) return;
  if (neSinkronizim) {
    perseri = true;
    return;
  }
  neSinkronizim = true;
  try {
    await dergo();
    // After the first full list, only what is new — fetched with two minutes
    // of overlap, because an answer can become visible a moment after the time
    // stamped on it, and applying one twice changes nothing.
    const rreshtat = ngarkuar
      ? await merrFaqet("vendimet?select=kodi,vendimi,foto,nga,kur&order=kur.asc&kur=gt." + encodeURIComponent(new Date(Math.max(0, iFunditMs - 120000)).toISOString()))
      : await merrFaqet("vendimet_aktuale?select=kodi,vendimi,foto,nga,kur&order=kodi.asc");
    ngarkuar = true;
    lidhja = true;
    const ndryshuan = [];
    for (const rresht of rreshtat) {
      if (zbato(rresht)) ndryshuan.push(rresht.kodi);
      iFunditMs = Math.max(iFunditMs, kohaMs(rresht.kur));
    }
    if (ndryshuan.length) {
      ruajLokal();
      for (const kodi of ndryshuan) perditesoKarten(kodi);
      numero();
      if (pamja && pamja.open) perditesoVendimin();
    }
  } catch (gabim) {
    lidhja = false;
  } finally {
    neSinkronizim = false;
    tregoGjendjen();
    if (perseri) {
      perseri = false;
      sinkronizo();
    }
  }
}

function tregoGjendjen() {
  if (lidhja) {
    njoftimQendrueshem("");
    return;
  }
  const sa = radha.length;
  njoftimQendrueshem(sa === 1
    ? "Pa lidhje — 1 vendim ruhet në këtë pajisje dhe dërgohet vetë kur të kthehet lidhja."
    : "Pa lidhje — " + (sa ? sa + " vendime ruhen" : "vendimet e reja ruhen") + " në këtë pajisje dhe dërgohen vetë kur të kthehet lidhja.");
}

/* ---- the Artifact page's shared store ---- */
let db = null;
// The Artifact store allows only a few characters in a document name; the code
// itself travels inside the document.
function idDok(kodi) {
  return String(kodi).replace(/[^A-Za-z0-9_.~:@+-]/g, (c) => "~" + c.charCodeAt(0).toString(16));
}

/* ---- deciding ---- */
// "pa-emer" when nobody has said who they are, "hequr" when a second click
// took the answer back, "vendosur" otherwise.
function vendos(kodi, vendimi, celesi) {
  const nga = emri();
  if (!nga) return "pa-emer";
  njofto("");

  const p = sipasKodit.get(kodi);
  const tani = vendimet[kodi];
  // Clicking the same answer again clears it — a mis-tap is easy to undo. On
  // the web page "the same" also means the same photo: yes to an alternative
  // is a new answer, not a repeat.
  const hiq = Boolean(tani && tani.vendimi === vendimi && (!WEB || (tani.foto || p.k) === celesi));

  if (WEB) {
    const rresht = {
      id: riId(), kodi, vendimi: hiq ? null : vendimi, foto: hiq ? null : celesi,
      nga, kur: new Date().toISOString(), pritje: true,
    };
    vendimet[kodi] = rresht;
    radha.push(rresht);
    ruajRadhen();
    ruajLokal();
    perditesoKarten(kodi);
    numero();
    sinkronizo();
    return hiq ? "hequr" : "vendosur";
  }

  const iRi = hiq ? null : { kodi, vendimi, nga, kur: new Date().toISOString(), seria: SERIA };
  if (iRi) vendimet[kodi] = iRi; else delete vendimet[kodi];
  ruajLokal();
  perditesoKarten(kodi);
  numero();
  if (db) {
    const ref = db.doc("vleresimet/" + idDok(kodi));
    (iRi ? ref.set(iRi) : ref.delete()).catch(() => {
      njofto("Vendimi u ruajt në pajisje, por nuk arriti te ekipi. Provo përsëri më vonë.");
    });
  }
  return iRi ? "vendosur" : "hequr";
}

/* ---- rendering ---- */
const HAPI = 120;         // cards drawn at a time: a phone should not build 4.600 of them up front

function karta(p) {
  const v = vendimet[p.kodi];
  const vendimi = v && v.vendimi ? v.vendimi : "";
  const dyshim = p.statusi === "Mospërputhje";
  const ipasigurt = p.besueshmeria === "E mesme" || p.besueshmeria === "E ulët";

  const el = document.createElement("article");
  el.className = "card" + (vendimi ? " done-" + vendimi : "");

  const foto_dobet = p.vleresimi === "Jo fotografi produkti";
  const flamur = dyshim
    ? '<span class="flag hard">Mospërputhje</span>'
    : (ipasigurt ? '<span class="flag">' + esc(p.besueshmeria) + '</span>' : "");
  // A weak picture is a different problem from a wrong product, so it gets its
  // own mark on the other corner instead of competing for the same badge.
  const shenjaCilesise = foto_dobet ? '<span class="flag weak">Foto e dobët</span>' : "";

  let shot;
  if (WEB) {
    const celesi = fotoEKartes(p);
    // The bottom corner says whether the team took another photo, or how many
    // others there are to look at.
    const poshte = celesi !== p.k
      ? '<span class="flag below taken">Foto alternative</span>'
      : (p.alt.length ? '<span class="flag below">+' + p.alt.length + " foto</span>" : "");
    shot = '<button type="button" class="shot" data-hap="' + esc(p.kodi) + '" aria-label="Zmadho fotografinë: ' + esc(p.emri) + '">' +
      flamur + shenjaCilesise + poshte +
      '<img src="' + foto("t", celesi) + '" alt="" loading="lazy" decoding="async">' +
    "</button>";
  } else {
    shot = '<div class="shot">' + flamur + shenjaCilesise +
      '<img src="' + p.foto + '" alt="Fotografia e produktit ' + esc(p.emri) + '" loading="lazy" decoding="async">' +
    "</div>";
  }

  el.innerHTML =
    shot +
    '<div class="body">' +
      '<h2 class="name">' + esc(p.emri) + '</h2>' +
      '<p class="meta">' +
        (p.brendi ? '<b>' + esc(p.brendi) + '</b>' : '') +
        '<span class="code">' + esc(p.barkodi || "pa barkod") + '</span>' +
        '<span class="code">#' + esc(p.kodi) + '</span>' +
      '</p>' +
      // The note explains why this photo is uncertain, so it belongs on every
      // card that is not a clean barcode match - not only on the outright
      // mismatches.
      ((dyshim || ipasigurt) && p.shenimi ? '<p class="note">' + esc(p.shenimi) + '</p>' : '') +
      (p.burimi ? '<a class="src" href="' + esc(p.burimi) + '" target="_blank" rel="noopener noreferrer">Shiko burimin</a>' : '') +
      '<div class="actions">' +
        '<button class="act act-yes' + (vendimi === "pranuar" ? " is-on" : "") + '" data-kodi="' + esc(p.kodi) + '" data-vendim="pranuar">' + ikona.po + ' Përshtatet</button>' +
        '<button class="act act-maybe' + (vendimi === "pasiguri" ? " is-on" : "") + '" data-kodi="' + esc(p.kodi) + '" data-vendim="pasiguri" title="I pasigurt" aria-label="I pasigurt">' + ikona.ndoshta + '</button>' +
        '<button class="act act-no' + (vendimi === "refuzuar" ? " is-on" : "") + '" data-kodi="' + esc(p.kodi) + '" data-vendim="refuzuar" title="Nuk përshtatet" aria-label="Nuk përshtatet">' + ikona.jo + '</button>' +
      '</div>' +
      '<p class="by">' + (vendimi ? esc(v.nga) + " · " + dataShkurt(v.kur) : "") + '</p>' +
    '</div>';
  return el;
}

function perputhet(p, q) {
  const vendimi = vendimiI(p.kodi);
  if (filtri === "dobet") {
    if (p.vleresimi !== "Jo fotografi produkti") return false;
  } else {
    if (filtri === "pa" && vendimi) return false;
    if (filtri !== "pa" && filtri !== "te-gjitha" && vendimi !== filtri) return false;
  }
  if (!q) return true;
  return (p.emri + " " + p.brendi + " " + p.barkodi + " " + p.kodi).toLowerCase().includes(q);
}

function vizato() {
  const q = kerkimi.trim().toLowerCase();
  listi = PRODUKTET.filter((p) => perputhet(p, q));
  kartat.clear();
  grid.replaceChildren();
  shfaqur = 0;
  shtoKarta();
  empty.hidden = listi.length > 0;
  numero();
  mbushEkranin();
}

function shtoKarta() {
  const pjesa = listi.slice(shfaqur, shfaqur + HAPI);
  const fragment = document.createDocumentFragment();
  for (const p of pjesa) {
    const el = karta(p);
    kartat.set(p.kodi, el);
    fragment.append(el);
  }
  grid.append(fragment);
  shfaqur += pjesa.length;
}

// More cards are added as the reviewer scrolls towards the end; the loop covers
// a screen tall enough to swallow a whole batch at once.
function mbushEkranin() {
  for (let hapa = 0; hapa < 40 && shfaqur < listi.length && meShume.getBoundingClientRect().top < innerHeight + 1500; hapa += 1) {
    shtoKarta();
  }
}
new IntersectionObserver(mbushEkranin, { rootMargin: "0px 0px 1500px 0px" }).observe(meShume);
// Scrolling asks as well, in case a browser lets the observer fall behind.
addEventListener("scroll", mbushEkranin, { passive: true });

// A decided card is redrawn where it stands. It does not leave the "Pa
// kontrolluar" list until the filter changes: cards jumping away under the
// reviewer's finger is how the wrong one gets tapped.
function perditesoKarten(kodi) {
  const vjeter = kartat.get(kodi);
  if (!vjeter) return;
  const aktiv = vjeter.contains(document.activeElement) ? (document.activeElement.dataset || {}).vendim : "";
  const eRe = karta(sipasKodit.get(kodi));
  vjeter.replaceWith(eRe);
  kartat.set(kodi, eRe);
  if (aktiv) {
    const butoni = eRe.querySelector('[data-vendim="' + aktiv + '"]');
    if (butoni) butoni.focus();
  }
}

function numero() {
  const numra = { pa: 0, "te-gjitha": PRODUKTET.length, pranuar: 0, pasiguri: 0, refuzuar: 0, dobet: 0 };
  for (const p of PRODUKTET) {
    const vendimi = vendimiI(p.kodi);
    if (!vendimi) numra.pa += 1; else numra[vendimi] = (numra[vendimi] || 0) + 1;
    if (p.vleresimi === "Jo fotografi produkti") numra.dobet += 1;
  }
  for (const [key, count] of Object.entries(numra)) {
    const slot = document.querySelector('[data-count="' + key + '"]');
    if (slot) slot.textContent = count;
  }

  const bere = PRODUKTET.length - numra.pa;
  barFill.style.width = (PRODUKTET.length ? (bere / PRODUKTET.length) * 100 : 0) + "%";
  progressText.textContent = bere + " nga " + PRODUKTET.length + " të kontrolluara";
}

/* ---- the large view (web page) ---- */
const pamja = document.getElementById("pamja");
const pamjaFoto = document.getElementById("pamjaFoto");
const pamjaZoom = document.getElementById("pamjaZoom");
const pamjaImg = document.getElementById("pamjaImg");
const pamjaPo = document.getElementById("pamjaPo");
const pamjaKush = document.getElementById("pamjaKush");
const pamjaReviewer = document.getElementById("pamjaReviewer");
const EMRAT = { pranuar: "Përshtatet", pasiguri: "I pasigurt", refuzuar: "Nuk përshtatet" };
let pamjaListi = [];      // what it steps through: the list the grid showed when it opened
let pamjaIndeksi = 0;
let pamjaCelesi = "";     // the photo on screen — the chosen one or an alternative
let pamjaNgarkimi = 0;    // so a slow large photo cannot land on the next product
let pamjaHapi = 0;

function hapPamjen(kodi) {
  pamjaListi = listi.slice();
  let indeksi = pamjaListi.findIndex((p) => p.kodi === kodi);
  if (indeksi < 0) {
    pamjaListi = [sipasKodit.get(kodi)];
    indeksi = 0;
  }
  pamjaIndeksi = indeksi;
  pamjaReviewer.value = reviewer.value;
  pamjaKush.hidden = Boolean(emri());
  if (!pamja.open) {
    document.documentElement.classList.add("pamja-hapur");
    pamja.showModal();
  }
  shfaqProduktin();
}

function shfaqProduktin() {
  const p = pamjaListi[pamjaIndeksi];
  pamjaCelesi = fotoEKartes(p);
  // Once a name has been given, the question about it can go.
  if (emri()) pamjaKush.hidden = true;
  document.getElementById("pamjaPozita").textContent = (pamjaIndeksi + 1) + " nga " + pamjaListi.length;
  pamja.querySelector('[data-veprim="para"]').disabled = pamjaIndeksi === 0;
  pamja.querySelector('[data-veprim="pas"]').disabled = pamjaIndeksi >= pamjaListi.length - 1;

  const dyshim = p.statusi === "Mospërputhje";
  const ipasigurt = p.besueshmeria === "E mesme" || p.besueshmeria === "E ulët";
  document.getElementById("pamjaFlamuri").innerHTML =
    (dyshim ? '<span class="flag hard">Mospërputhje</span>' : ipasigurt ? '<span class="flag">' + esc(p.besueshmeria) + "</span>" : "") +
    (p.vleresimi === "Jo fotografi produkti" ? '<span class="flag weak">Foto e dobët</span>' : "");
  document.getElementById("pamjaEmri").textContent = p.emri;
  document.getElementById("pamjaMeta").innerHTML =
    (p.brendi ? "<b>" + esc(p.brendi) + "</b>" : "") + '<span class="code">#' + esc(p.kodi) + "</span>";
  document.getElementById("pamjaBarkod").textContent = p.barkodi || "pa barkod";
  const shenimi = document.getElementById("pamjaShenimi");
  shenimi.textContent = p.shenimi || "";
  shenimi.hidden = !p.shenimi;
  const burimi = document.getElementById("pamjaBurimi");
  burimi.hidden = !p.burimi;
  if (p.burimi) burimi.href = p.burimi;

  vendosFoton();
  vizatoAlternativat();
  perditesoVendimin();
  pamja.querySelector(".pamja-info").scrollTop = 0;
  // The next product's large photo is fetched while this one is looked at.
  const tjetri = pamjaListi[pamjaIndeksi + 1];
  if (tjetri) new Image().src = foto("m", fotoEKartes(tjetri));
}

function vendosFoton() {
  const p = pamjaListi[pamjaIndeksi];
  const numri = ++pamjaNgarkimi;
  pamjaFoto.classList.remove("is-zoom");
  pamjaZoom.disabled = true;
  pamjaZoom.setAttribute("aria-label", "Zmadho fotografinë");
  pamjaImg.alt = "Fotografia e produktit " + p.emri;
  // The card's photo is already in the browser: something to look at at once,
  // swapped for the large one the moment it has arrived.
  pamjaImg.src = foto("t", pamjaCelesi);
  const madhe = new Image();
  madhe.onload = () => {
    if (numri === pamjaNgarkimi) pamjaImg.src = madhe.src;
  };
  madhe.src = foto("m", pamjaCelesi);
}

// Zooming in only makes sense when the photo has more pixels than the screen shows.
function perditesoZoomin() {
  if (!pamjaImg.naturalWidth || !pamjaImg.clientWidth) return;
  const shkalla = Math.min(pamjaImg.clientWidth / pamjaImg.naturalWidth, pamjaImg.clientHeight / pamjaImg.naturalHeight);
  pamjaZoom.disabled = shkalla > 0.87;
}

function vizatoAlternativat() {
  const p = pamjaListi[pamjaIndeksi];
  const lista = document.getElementById("pamjaAltLista");
  document.getElementById("pamjaAlt").hidden = !p.alt.length;
  lista.innerHTML = !p.alt.length ? "" : [p.k].concat(p.alt).map((celesi, i) =>
    '<button type="button" class="alt-foto" data-celesi="' + celesi + '" aria-pressed="' + (celesi === pamjaCelesi) + '">' +
      '<img src="' + foto("t", celesi) + '" alt="" decoding="async">' +
      "<span>" + (i === 0 ? "E zgjedhura" : "Alternativa " + i) + "</span>" +
    "</button>"
  ).join("");
}

function perditesoVendimin() {
  const p = pamjaListi[pamjaIndeksi];
  if (!p) return;
  const v = vendimet[p.kodi];
  const vendimi = v && v.vendimi ? v.vendimi : "";
  // The buttons light up for the photo the answer was given on; another photo
  // of the same product starts from a clean slate.
  const iKesaj = vendimi && (v.foto || p.k) === pamjaCelesi ? vendimi : "";
  for (const butoni of pamja.querySelectorAll(".pamja-info [data-vendim]")) {
    butoni.classList.toggle("is-on", butoni.dataset.vendim === iKesaj);
  }
  pamjaPo.textContent = pamjaCelesi === p.k ? "Përshtatet" : "Përdor këtë foto";
  document.getElementById("pamjaNga").textContent = vendimi
    ? EMRAT[vendimi] + (v.foto && v.foto !== p.k ? " (foto alternative)" : "") + " — " + v.nga + " · " + dataShkurt(v.kur)
    : "";
}

function mbyllPamjen() {
  if (pamja.open) pamja.close();
  pastroPasMbylljes();
}

function pastroPasMbylljes() {
  clearTimeout(pamjaHapi);
  if (!document.documentElement.classList.contains("pamja-hapur")) return;
  document.documentElement.classList.remove("pamja-hapur");
  const p = pamjaListi[pamjaIndeksi];
  if (p) shfaqKarten(p.kodi);
}

function leviz(hapi) {
  clearTimeout(pamjaHapi);
  const indeksi = pamjaIndeksi + hapi;
  if (indeksi < 0 || indeksi >= pamjaListi.length) return;
  pamjaIndeksi = indeksi;
  shfaqProduktin();
}

// Back in the grid, the reviewer lands on the product they were looking at.
function shfaqKarten(kodi) {
  const indeksi = listi.findIndex((p) => p.kodi === kodi);
  if (indeksi < 0) return;
  while (shfaqur <= indeksi) shtoKarta();
  const el = kartat.get(kodi);
  if (el) el.scrollIntoView({ block: "center" });
}

/* ---- events ---- */
grid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-vendim]");
  if (button) {
    const p = sipasKodit.get(button.dataset.kodi);
    if (vendos(p.kodi, button.dataset.vendim, WEB ? fotoEKartes(p) : null) === "pa-emer") {
      reviewer.focus();
      njofto("Shkruaj emrin tënd lart, që të dihet kush e ka kontrolluar.");
    }
    return;
  }
  const hap = event.target.closest("[data-hap]");
  if (hap) hapPamjen(hap.dataset.hap);
});
document.getElementById("filters").addEventListener("click", (event) => {
  const chip = event.target.closest("[data-filter]");
  if (!chip) return;
  filtri = chip.dataset.filter;
  for (const c of document.querySelectorAll("[data-filter]")) {
    const on = c === chip;
    c.classList.toggle("is-on", on);
    c.setAttribute("aria-selected", String(on));
  }
  vizato();
});
search.addEventListener("input", () => { kerkimi = search.value; vizato(); });

if (WEB) {
  document.getElementById("fillo").addEventListener("click", () => {
    const p = listi.find((x) => !vendimiI(x.kodi));
    if (!p) {
      njofto("Të gjitha produktet e kësaj liste janë kontrolluar.");
      return;
    }
    hapPamjen(p.kodi);
  });

  pamja.addEventListener("click", (event) => {
    if (event.target === pamja) {
      mbyllPamjen();              // the dimmed area around it
      return;
    }
    const veprimi = event.target.closest("[data-veprim]");
    if (veprimi) {
      if (veprimi.dataset.veprim === "mbyll") mbyllPamjen();
      else leviz(veprimi.dataset.veprim === "pas" ? 1 : -1);
      return;
    }
    const alternativa = event.target.closest("[data-celesi]");
    if (alternativa) {
      pamjaCelesi = alternativa.dataset.celesi;
      for (const b of alternativa.parentNode.children) b.setAttribute("aria-pressed", String(b === alternativa));
      vendosFoton();
      perditesoVendimin();
      return;
    }
    const butoni = event.target.closest("[data-vendim]");
    if (!butoni) return;
    const p = pamjaListi[pamjaIndeksi];
    const rezultati = vendos(p.kodi, butoni.dataset.vendim, pamjaCelesi);
    if (rezultati === "pa-emer") {
      pamjaKush.hidden = false;
      pamjaReviewer.focus();
      return;
    }
    perditesoVendimin();
    clearTimeout(pamjaHapi);
    // A moment to see the answer register, then the next product.
    if (rezultati === "vendosur" && pamjaIndeksi < pamjaListi.length - 1) {
      pamjaHapi = setTimeout(() => leviz(1), 350);
    }
  });

  pamjaZoom.addEventListener("click", (event) => {
    if (pamjaFoto.classList.contains("is-zoom")) {
      pamjaFoto.classList.remove("is-zoom");
      pamjaZoom.setAttribute("aria-label", "Zmadho fotografinë");
      return;
    }
    // Zoom in where the finger was, so the detail being looked at stays in view.
    const kutia = pamjaImg.getBoundingClientRect();
    const ngaTastiera = event.detail === 0;
    const rx = ngaTastiera ? 0.5 : Math.min(1, Math.max(0, (event.clientX - kutia.left) / kutia.width));
    const ry = ngaTastiera ? 0.5 : Math.min(1, Math.max(0, (event.clientY - kutia.top) / kutia.height));
    pamjaFoto.classList.add("is-zoom");
    pamjaZoom.setAttribute("aria-label", "Zvogëlo fotografinë");
    pamjaFoto.scrollLeft = rx * pamjaFoto.scrollWidth - pamjaFoto.clientWidth / 2;
    pamjaFoto.scrollTop = ry * pamjaFoto.scrollHeight - pamjaFoto.clientHeight / 2;
  });

  pamja.addEventListener("keydown", (event) => {
    // Escape closes the view here explicitly; the browser's own handling of it
    // did not react in testing.
    if (event.key === "Escape") {
      event.preventDefault();
      mbyllPamjen();
      return;
    }
    if (event.target.closest("input")) return;
    if (event.key === "ArrowRight") { event.preventDefault(); leviz(1); }
    if (event.key === "ArrowLeft") { event.preventDefault(); leviz(-1); }
  });

  // A browser may also close the view on its own (the back gesture on a
  // phone); the tidying up then runs from here. Our own ways out do it
  // themselves, because the close event did not arrive in testing.
  pamja.addEventListener("close", pastroPasMbylljes);
  // Whichever photo has just arrived decides whether zooming in is worth it.
  pamjaImg.addEventListener("load", perditesoZoomin);

  pamjaReviewer.addEventListener("input", () => ruajEmrin(pamjaReviewer.value));
}

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function dataShkurt(iso) {
  try { return new Date(iso).toLocaleDateString("sq-AL", { day: "2-digit", month: "2-digit" }); }
  catch (e) { return ""; }
}

/* ---- start ---- */
vizato();

if (WEB) {
  // Answers given on the earlier copy of this page stayed on the phone they
  // were given on; they are sent now, so that work is not lost.
  for (const v of Object.values(vendimet)) {
    if (!v || !v.vendimi || v.ok || v.pritje) continue;
    const p = sipasKodit.get(v.kodi);
    if (!p) continue;
    const rresht = {
      id: riId(), kodi: v.kodi, vendimi: v.vendimi, foto: v.foto || p.k,
      nga: String(v.nga || "pa emër").slice(0, 60), kur: v.kur || new Date().toISOString(), pritje: true,
    };
    vendimet[v.kodi] = rresht;
    radha.push(rresht);
  }
  ruajRadhen();
  ruajLokal();
  sinkronizo();
  setInterval(() => { if (document.visibilityState === "visible") sinkronizo(); }, 20000);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") sinkronizo(); });
  window.addEventListener("online", () => sinkronizo());
} else {
  (async () => {
    try {
      db = await window.claude?.use?.("db");
    } catch (e) { db = null; }

    if (!db) {
      njoftimQendrueshem("Vendimet po ruhen vetëm në këtë pajisje — ekipi nuk i sheh. Hape faqen nga linku i ndarë që të punoni së bashku.");
      return;
    }
    try {
      db.collection("vleresimet").onSnapshot((snap) => {
        const docs = Array.isArray(snap) ? snap : (snap && snap.docs) || [];
        const ndryshuan = [];
        for (const doc of docs) {
          const d = doc.data ? doc.data() : doc;
          if (!d || !d.kodi) continue;
          const tani = vendimet[d.kodi];
          if (tani && tani.vendimi === d.vendimi && tani.nga === d.nga && tani.kur === d.kur) continue;
          vendimet[d.kodi] = d;
          ndryshuan.push(d.kodi);
        }
        if (!ndryshuan.length) return;
        ruajLokal();
        for (const kodi of ndryshuan) perditesoKarten(kodi);
        numero();
      });
    } catch (e) {
      njoftimQendrueshem("Lidhja me ruajtjen e përbashkët nuk funksionoi. Vendimet ruhen në këtë pajisje.");
    }
  })();
}
`;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
