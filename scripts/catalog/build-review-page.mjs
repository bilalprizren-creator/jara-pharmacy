#!/usr/bin/env node
/**
 * Builds the photo review page that the pharmacy team works with.
 * ---------------------------------------------------------------
 * Input is one image-search report (see `rescue-gpt-photos.mjs` and, later, the
 * image search) plus the photos it refers to. Output is a single self-contained
 * HTML file: every thumbnail is embedded, so the page needs no server, no
 * network and no login — it is published as a private Artifact and opened from
 * a link, including on a phone at the shelf.
 *
 * Why embedded and why batched: the Artifact viewer blocks external image
 * hosts, so photos have to travel inside the page, and a page may not exceed
 * 16 MB. Thumbnails are therefore re-encoded to WebP (~300 px) — roughly 12 KB
 * each, which keeps a 300-product batch well inside the limit.
 *
 * The page is Albanian throughout: it is a working tool for the team in
 * Prizren, not a report for the maintainer.
 *
 * Usage:
 *   node scripts/catalog/build-review-page.mjs
 *   node scripts/catalog/build-review-page.mjs --report reports/gpt-150.json
 *   node scripts/catalog/build-review-page.mjs --title "Seria 02" --limit 50
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..");
const OUT_DIR = path.join(ROOT, ".catalog-cache");

const THUMB_SIZE = 300;
const THUMB_QUALITY = 74;
const PAGE_LIMIT_MB = 16;

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

  console.log(`\n  Prüfseite "${args.title}" — ${selected.length} Produkte`);
  console.log(`  ${"-".repeat(60)}`);

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
    let thumb;
    try {
      thumb = await sharp(file)
        .resize(THUMB_SIZE, THUMB_SIZE, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: THUMB_QUALITY })
        .toBuffer();
    } catch {
      damaged.push({ code: entry.code, file: entry.file, bytes: fs.statSync(file).size });
      continue;
    }

    items.push({
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
      foto: `data:image/webp;base64,${thumb.toString("base64")}`,
    });
    if ((index + 1) % 25 === 0) process.stdout.write(`     ${index + 1} Bilder aufbereitet\r`);
  }

  const html = renderPage({ title: args.title, seria: args.seria, label: report.label ?? "seria", items });
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const outFile = path.join(OUT_DIR, `${slug(args.title)}.html`);
  fs.writeFileSync(outFile, html, "utf8");

  // A second, standalone copy: the fragment above is what the Artifact host
  // wraps and publishes, but a plain .html file that opens on double-click is
  // the fallback when publishing is unavailable — and it can simply be sent to
  // whoever needs to review, no account required. Decisions are per-device
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

/* ------------------------------------------------------------------ */
/*  The page                                                           */
/* ------------------------------------------------------------------ */

function renderPage({ title, seria, label, items }) {
  const data = JSON.stringify(items).replace(/</g, "\\u003c");
  return `<title>${escapeHtml(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700&display=swap">
<style>
${styles()}
</style>

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
      <input id="reviewer" type="text" placeholder="Emri yt" autocomplete="name" spellcheck="false">
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
  <p id="notice" class="notice" hidden></p>
  <div id="grid" class="grid"></div>
  <p id="empty" class="empty" hidden>Asnjë produkt nuk përputhet me kërkimin.</p>
</main>

<footer class="wrap foot">
  <p>Krahasoje fotografinë me paketimin e vërtetë para se ta pranosh. Vendimet ruhen vetë dhe i sheh i gjithë ekipi.</p>
</footer>

<script>
${script(data, label)}
</script>
`;
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
.empty { text-align: center; color: var(--ink-soft); padding: 40px 0; }
.foot { padding-block: 22px 40px; color: var(--ink-soft); font-size: 13px; }
.foot p { margin: 0; max-width: 62ch; }

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
}
@media (prefers-reduced-motion: reduce) {
  * { transition: none !important; animation: none !important; }
}
`;
}

/* ------------------------------------------------------------------ */

function script(data, label) {
  return `
const PRODUKTET = ${data};
const SERIA = ${JSON.stringify(label)};
const RUAJTJA = "jara-kontroll-" + SERIA;

const grid = document.getElementById("grid");
const search = document.getElementById("search");
const reviewer = document.getElementById("reviewer");
const notice = document.getElementById("notice");
const empty = document.getElementById("empty");
const barFill = document.getElementById("barFill");
const progressText = document.getElementById("progressText");

let vendimet = {};       // kodi -> { vendimi, nga, kur }
let db = null;           // shared store, when the viewer can reach it
let filtri = "pa";
let kerkimi = "";

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
reviewer.addEventListener("change", () => {
  try { localStorage.setItem("jara-kontrollues", reviewer.value.trim()); } catch (e) {}
});

/* ---- local fallback so the page always works ---- */
function ruajLokal() {
  try { localStorage.setItem(RUAJTJA, JSON.stringify(vendimet)); } catch (e) {}
}
try { vendimet = JSON.parse(localStorage.getItem(RUAJTJA) || "{}"); } catch (e) { vendimet = {}; }

/* ---- shared store ---- */
(async () => {
  try {
    db = await window.claude?.use?.("db");
  } catch (e) { db = null; }

  if (!db) {
    njoftimQendrueshem("Vendimet po ruhen vetëm në këtë pajisje — ekipi nuk i sheh. Hape faqen nga linku i ndarë që të punoni së bashku.");
    return;
  }
  try {
    db.collection("vleresimet").onSnapshot((docs) => {
      const nga_serveri = {};
      for (const doc of docs) {
        const d = doc.data ? doc.data() : doc;
        if (d && d.kodi) nga_serveri[d.kodi] = d;
      }
      vendimet = { ...vendimet, ...nga_serveri };
      ruajLokal();
      vizato();
    });
  } catch (e) {
    njoftimQendrueshem("Lidhja me ruajtjen e përbashkët nuk funksionoi. Vendimet ruhen në këtë pajisje.");
  }
})();

/* ---- deciding ---- */
async function vendos(kodi, vendimi) {
  const nga = reviewer.value.trim();
  if (!nga) {
    reviewer.focus();
    njofto("Shkruaj emrin tënd lart, që të dihet kush e ka kontrolluar.");
    return;
  }
  njofto("");

  const ekzistuese = vendimet[kodi];
  // Clicking the same answer again clears it — a mis-tap is easy to undo.
  const iRi = ekzistuese && ekzistuese.vendimi === vendimi
    ? null
    : { kodi, vendimi, nga, kur: new Date().toISOString(), seria: SERIA };

  if (iRi) vendimet[kodi] = iRi; else delete vendimet[kodi];
  ruajLokal();
  vizato();

  if (!db) return;
  try {
    if (iRi) await db.doc("vleresimet/" + kodi).set(iRi);
    else await db.doc("vleresimet/" + kodi).delete();
  } catch (e) {
    njofto("Vendimi u ruajt në pajisje, por nuk arriti te ekipi. Provo përsëri më vonë.");
  }
}

/* ---- rendering ---- */
const ikona = {
  po: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
  ndoshta: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 17h.01M9.5 9a2.5 2.5 0 1 1 3.6 2.24c-.7.35-1.1 1-1.1 1.76"/></svg>',
  jo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>'
};

function karta(p) {
  const v = vendimet[p.kodi];
  const vendimi = v ? v.vendimi : "";
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

  el.innerHTML =
    '<div class="shot">' + flamur + shenjaCilesise +
      '<img src="' + p.foto + '" alt="Fotografia e produktit ' + esc(p.emri) + '" loading="lazy" decoding="async">' +
    '</div>' +
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
      '<p class="by">' + (v ? esc(v.nga) + " · " + dataShkurt(v.kur) : "") + '</p>' +
    '</div>';
  return el;
}

function vizato() {
  const q = kerkimi.trim().toLowerCase();
  const listi = PRODUKTET.filter((p) => {
    const v = vendimet[p.kodi];
    const vendimi = v ? v.vendimi : "";
    if (filtri === "dobet") {
      if (p.vleresimi !== "Jo fotografi produkti") return false;
    } else {
      if (filtri === "pa" && vendimi) return false;
      if (filtri !== "pa" && filtri !== "te-gjitha" && vendimi !== filtri) return false;
    }
    if (!q) return true;
    return (p.emri + " " + p.brendi + " " + p.barkodi + " " + p.kodi).toLowerCase().includes(q);
  });

  grid.replaceChildren(...listi.map(karta));
  empty.hidden = listi.length > 0;

  const numra = { pa: 0, "te-gjitha": PRODUKTET.length, pranuar: 0, pasiguri: 0, refuzuar: 0, dobet: 0 };
  for (const p of PRODUKTET) {
    const v = vendimet[p.kodi];
    if (!v) numra.pa += 1; else numra[v.vendimi] = (numra[v.vendimi] || 0) + 1;
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

grid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-vendim]");
  if (button) vendos(button.dataset.kodi, button.dataset.vendim);
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

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function dataShkurt(iso) {
  try { return new Date(iso).toLocaleDateString("sq-AL", { day: "2-digit", month: "2-digit" }); }
  catch (e) { return ""; }
}

vizato();
`;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
