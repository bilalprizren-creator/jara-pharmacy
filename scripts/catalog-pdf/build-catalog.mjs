#!/usr/bin/env node
/**
 * Baut den Produktkatalog als PDF.
 * --------------------------------
 * Aus den importierten SHEMO-Produkten wird eine A4-HTML-Datei gebaut und die
 * anschließend mit dem mitgelieferten Chromium in eine PDF gedruckt. Kein neues
 * npm-Paket, kein Server — nur Node, Python/Pillow fürs Verkleinern der Fotos
 * und ein Browser, der drucken kann.
 *
 * Warum das Skript im Git liegt: die PDF wurde schon einmal gebaut und der Code
 * dazu ging verloren, weil er nie committet wurde. Alles, was der Katalog über
 * die Produktdaten hinaus weiß — die schöneren Produktnamen und die Reihenfolge
 * der Kategorien — steht deshalb in catalog-names.json und nicht im Kopf.
 *
 * Aufruf:
 *   node scripts/catalog-pdf/build-catalog.mjs                 # alles
 *   node scripts/catalog-pdf/build-catalog.mjs --limit 3       # nur 3 Kategorien
 *   node scripts/catalog-pdf/build-catalog.mjs --html-only     # ohne Druck
 *   node scripts/catalog-pdf/build-catalog.mjs --out /tmp/k.pdf
 */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const CACHE = path.join(ROOT, ".catalog-cache");
const THUMBS = path.join(CACHE, "thumbs");
const PRODUCTS = path.join(ROOT, "src", "data", "imported", "shemo-products.json");
const NAMES = path.join(__dirname, "catalog-names.json");
const LOGO_CANDIDATES = [
  path.join(__dirname, "assets", "shemo-logo.svg"),
  path.join(__dirname, "assets", "shemo-logo.png"),
];

/** Der Browser, mit dem gedruckt wird. Erster Treffer gewinnt. */
const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/usr/bin/google-chrome",
];

// ---------------------------------------------------------------- Rasterwerte
// Ein Blatt trägt COLS × ROWS Produkte. Eine neue Kategorie fängt immer auf
// einer neuen Seite an — deshalb hat der Katalog mehr Seiten als
// Produkte ÷ Produkte-pro-Seite.
const COLS = 3;
const ROWS = 4;

// Jara-Hausfarben (tailwind.config.js): forest, das helle Grün der Code-Pille.
const FOREST = "#0A5C44";
const CODE_BG = "#E9F5EE";
const RULE = "#E4EDE8";
const INK = "#0F172A";
const MUTED = "#64748B";

// Kontakt aus src/data/brand.ts — bewusst dieselben Nummern wie auf der Website.
const CONTACT = {
  phone: "+383 49 500 763",
  phoneE164: "38349500763",
  whatsapp: "38349500763",
  website: "https://jara-pharmacy.com",
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function readArgs(argv) {
  const flag = (name, fallback) => {
    const i = argv.indexOf(`--${name}`);
    return i === -1 || i + 1 >= argv.length ? fallback : argv[i + 1];
  };
  return {
    out: path.resolve(flag("out", path.join(CACHE, "jara-katalog.pdf"))),
    limit: Number(flag("limit", 0)) || 0,
    htmlOnly: argv.includes("--html-only"),
    skipThumbs: argv.includes("--skip-thumbs"),
  };
}

/**
 * Liest eine Datei als data:-URI. Schriften und Logo reisen so in der HTML mit,
 * damit sie auch beim Drucken ohne Netz da sind; die 1.569 Produktfotos dagegen
 * bleiben Dateien nebenan — eingebettet wäre die HTML über 40 MB groß.
 */
function dataUri(file, mime) {
  return `data:${mime};base64,${fs.readFileSync(file).toString("base64")}`;
}

function loadLogo() {
  const file = LOGO_CANDIDATES.find((candidate) => fs.existsSync(candidate));
  if (!file) return null;
  const mime = file.endsWith(".svg") ? "image/svg+xml" : "image/png";
  return { file, uri: dataUri(file, mime) };
}

/** Rohnamen aus der Warenwirtschaft: doppelte Leerzeichen, klein geschrieben. */
function tidyName(name) {
  const clean = String(name ?? "").replace(/\s+/g, " ").trim();
  return clean ? clean.charAt(0).toUpperCase() + clean.slice(1) : "";
}

/**
 * Die Kategorien in Katalogreihenfolge, jede mit ihren Produkten.
 * Steht in catalog-names.json eine Reihenfolge, gilt die — sie stammt aus der
 * bereits gedruckten PDF. Sonst die Reihenfolge, in der die Kategorien in den
 * Produktdaten zuerst auftauchen.
 */
function groupByCategory(products, overrides) {
  const groups = new Map();
  for (const product of products) {
    if (product.isActive === false) continue;
    const key = product.sourceCategory || "Të tjera";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(product);
  }

  const wanted = overrides?.categories ?? [];
  const ordered = [
    ...wanted.filter((name) => groups.has(name)),
    ...[...groups.keys()].filter((name) => !wanted.includes(name)),
  ];
  return ordered.map((name, index) => ({
    name,
    number: index + 1,
    products: groups.get(name),
  }));
}

/** Aus einer Kategorie werden so viele Seiten, wie das Raster braucht. */
function paginate(categories) {
  const perPage = COLS * ROWS;
  const pages = [];
  for (const category of categories) {
    for (let start = 0; start < category.products.length; start += perPage) {
      pages.push({ category, products: category.products.slice(start, start + perPage) });
    }
  }
  return pages;
}

function thumbFor(product) {
  if (!product.image) return null;
  const stem = path.basename(product.image, path.extname(product.image));
  const file = path.join(THUMBS, `${stem}.jpg`);
  return fs.existsSync(file) ? `thumbs/${stem}.jpg` : null;
}

function item(product, names) {
  const code = product.productCode ?? product.sku ?? "";
  const name = names[code] ?? tidyName(product.name);
  const thumb = thumbFor(product);
  const shot = thumb
    ? `<img src="${escapeHtml(thumb)}" alt="">`
    : `<span class="nophoto"></span>`;
  return `
        <figure class="item">
          <span class="shot">${shot}</span>
          <span class="code">${escapeHtml(code)}</span>
          <figcaption class="name">${escapeHtml(name)}</figcaption>
        </figure>`;
}

/** Die drei Fußzeilen-Symbole sind lucide-Icons, wie überall sonst auf der Seite. */
const ICONS = {
  phone:
    '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
  chat: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22z"/>',
  bag: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
};

const action = (href, icon, label) => `
          <a class="act" href="${escapeHtml(href)}">
            <svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[icon]}</svg>
            <span>${label}</span>
          </a>`;

function pageHtml(page, index, total, logo) {
  const mast = logo
    ? `<header class="mast"><img class="logo" src="${logo.uri}" alt="SHEMO"></header>`
    : "";
  return `
    <section class="page">
      ${mast}
      <div class="cat">
        <span class="num">${page.category.number}</span>
        <h2>${escapeHtml(page.category.name)}</h2>
      </div>
      <div class="grid">${page.products.map((product) => item(product, page.names)).join("")}
      </div>
      <footer class="foot">
        <div class="acts">${action(`tel:+${CONTACT.phoneE164}`, "phone", "Thirr")}${action(
          `https://wa.me/${CONTACT.whatsapp}`,
          "chat",
          "WhatsApp",
        )}${action(`${CONTACT.website}/#produktet`, "bag", "Produktet")}
        </div>
        <p class="pageno">${index + 1}/${total}</p>
      </footer>
    </section>`;
}

function documentHtml(pages, logo, fonts) {
  const total = pages.length;
  return `<!doctype html>
<html lang="sq">
<head>
<meta charset="utf-8">
<title>Jara Pharmacy — Katalogu i produkteve</title>
<style>
  @font-face {
    font-family: "Inter"; font-style: normal; font-weight: 100 900; font-display: block;
    src: url(${fonts.latin}) format("woff2");
    unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC,
      U+0304, U+0308, U+0329, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF;
  }
  @font-face {
    font-family: "Inter"; font-style: normal; font-weight: 100 900; font-display: block;
    src: url(${fonts.latinExt}) format("woff2");
    unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304,
      U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0,
      U+2113, U+2C60-2C7F, U+A720-A7FF;
  }

  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #fff; }
  body {
    font-family: Inter, system-ui, -apple-system, "Segoe UI", sans-serif;
    color: ${INK};
    -webkit-font-smoothing: antialiased;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  @page { size: A4; margin: 0; }

  /* 296.8mm statt 297: eine volle Seitenhöhe rundet Chromium beim Drucken
     gelegentlich auf und schiebt jede zweite Seite leer dazwischen. */
  .page {
    position: relative; width: 210mm; height: 296.8mm; overflow: hidden;
    padding: 8mm 12mm 7mm; display: flex; flex-direction: column;
    break-after: page; page-break-after: always;
  }
  .page:last-child { break-after: auto; page-break-after: auto; }
  @media screen {
    body { background: #E8EDEA; }
    .page { margin: 8mm auto; background: #fff; box-shadow: 0 6px 24px rgba(7,59,45,.16); }
  }

  /* ------------------------------------------------------------ Seitenkopf */
  .mast { flex: none; display: flex; justify-content: center; padding-bottom: 4mm; }
  .logo { height: 11mm; width: auto; max-width: 70mm; object-fit: contain; }

  .cat { flex: none; display: flex; align-items: center; gap: 3mm; padding-bottom: 2.5mm; }
  .num {
    display: inline-grid; place-items: center;
    width: 6.5mm; height: 6.5mm; border-radius: 2mm;
    background: ${FOREST}; color: #fff;
    font-size: 9pt; font-weight: 700; line-height: 1;
  }
  .cat h2 { margin: 0; font-size: 13pt; font-weight: 700; letter-spacing: -.01em; }

  /* ---------------------------------------------------------------- Raster */
  .grid {
    flex: 1; min-height: 0;
    display: grid;
    grid-template-columns: repeat(${COLS}, 1fr);
    grid-template-rows: repeat(${ROWS}, 1fr);
    gap: 5mm 7mm;
    border-top: 0.3mm solid ${RULE};
    padding-top: 4mm;
  }
  .item {
    margin: 0; min-height: 0;
    display: flex; flex-direction: column; align-items: center;
  }
  /* Das Foto wird absolut in seinen Kasten gelegt: nur so rechnet der Browser
     die Prozenthöhen gegen die Rasterzeile und nicht gegen die Bildgröße —
     sonst wächst ein hohes Packungsfoto über den Code und den Namen hinaus. */
  .shot { position: relative; flex: 1; min-height: 0; width: 100%; }
  .shot img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; }
  .nophoto {
    position: absolute; inset: 15%; border-radius: 2mm;
    background: repeating-linear-gradient(45deg, #fff 0 3mm, #F1F5F3 3mm 6mm);
  }
  .code {
    align-self: flex-start; margin-top: 2.5mm;
    padding: 0.7mm 2mm; border-radius: 1.2mm;
    background: ${CODE_BG}; color: ${FOREST};
    font-size: 7.5pt; font-weight: 600; line-height: 1.3;
    font-variant-numeric: tabular-nums;
  }
  .name {
    margin: 1.8mm 0 0; text-align: center;
    font-size: 8pt; line-height: 1.32; color: ${INK};
    /* Drei Zeilen sind das Meiste, was in eine Rasterzelle passt — und die Höhe
       steht fest, damit Code-Pille und Name in einer Reihe auf gleicher Linie
       sitzen, egal ob der Name eine Zeile lang ist oder drei. */
    height: 3.96em;
    display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
  }

  /* -------------------------------------------------------------- Fußzeile */
  .foot { flex: none; border-top: 0.3mm solid ${RULE}; padding-top: 3.5mm; }
  .acts { display: grid; grid-template-columns: repeat(3, 1fr); }
  .act {
    display: flex; flex-direction: column; align-items: center; gap: 1.2mm;
    text-decoration: none; color: ${FOREST};
    font-size: 8pt; font-weight: 600;
  }
  .act svg {
    width: 4.6mm; height: 4.6mm;
    fill: none; stroke: currentColor; stroke-width: 1.9;
    stroke-linecap: round; stroke-linejoin: round;
  }
  .pageno {
    margin: 2.5mm 0 0; text-align: right;
    font-size: 8.5pt; color: ${MUTED}; font-variant-numeric: tabular-nums;
  }
</style>
</head>
<body>
${pages.map((page, index) => pageHtml(page, index, total, logo)).join("\n")}
</body>
</html>
`;
}

function makeThumbs() {
  const run = spawnSync("python3", [path.join(__dirname, "make-thumbs.py")], { encoding: "utf8" });
  if (run.status === 0) process.stdout.write(run.stdout);
  else console.warn("Hinweis: Bilder nicht verkleinert (Pillow fehlt?)\n" + (run.stderr || ""));
}

function printPdf(htmlFile, out) {
  const chrome = CHROME_CANDIDATES.find((candidate) => candidate && fs.existsSync(candidate));
  if (!chrome) {
    console.warn(`Kein Chromium gefunden — HTML liegt unter ${htmlFile}, drucken musst du selbst.`);
    return false;
  }
  const run = spawnSync(
    chrome,
    [
      "--headless",
      "--disable-gpu",
      "--no-sandbox",
      "--no-pdf-header-footer",
      "--virtual-time-budget=120000",
      `--print-to-pdf=${out}`,
      `file://${htmlFile}`,
    ],
    { encoding: "utf8", timeout: 15 * 60 * 1000 },
  );
  if (!fs.existsSync(out)) {
    console.error(run.stderr || "Chromium hat keine PDF geschrieben.");
    return false;
  }
  return true;
}

function main() {
  const args = readArgs(process.argv.slice(2));
  const products = JSON.parse(fs.readFileSync(PRODUCTS, "utf8"));
  const overrides = fs.existsSync(NAMES) ? JSON.parse(fs.readFileSync(NAMES, "utf8")) : null;
  const names = overrides?.names ?? {};

  if (!args.skipThumbs) makeThumbs();

  let categories = groupByCategory(products, overrides);
  if (args.limit) categories = categories.slice(0, args.limit);
  const pages = paginate(categories).map((page) => ({ ...page, names }));

  const logo = loadLogo();
  if (!logo) {
    console.warn(
      "Kein Logo gefunden — lege es als scripts/catalog-pdf/assets/shemo-logo.png (oder .svg) ab.\n" +
        "Die Seiten werden ohne Logo gebaut.",
    );
  }

  const fonts = {
    latin: dataUri(path.join(ROOT, "public", "fonts", "inter-latin.woff2"), "font/woff2"),
    latinExt: dataUri(path.join(ROOT, "public", "fonts", "inter-latin-ext.woff2"), "font/woff2"),
  };

  fs.mkdirSync(CACHE, { recursive: true });
  const htmlFile = path.join(CACHE, "katalog.html");
  fs.writeFileSync(htmlFile, documentHtml(pages, logo, fonts));

  const withPhoto = pages.reduce(
    (sum, page) => sum + page.products.filter((product) => thumbFor(product)).length,
    0,
  );
  const shown = pages.reduce((sum, page) => sum + page.products.length, 0);
  console.log(
    `${categories.length} Kategorien · ${shown} Produkte · ${pages.length} Seiten` +
      ` · ${shown - withPhoto} ohne Foto`,
  );

  if (args.htmlOnly) {
    console.log(`HTML geschrieben: ${htmlFile}`);
    return;
  }

  fs.mkdirSync(path.dirname(args.out), { recursive: true });
  if (printPdf(htmlFile, args.out)) {
    const mb = (fs.statSync(args.out).size / 1024 / 1024).toFixed(1);
    console.log(`PDF geschrieben: ${args.out} (${mb} MB)`);
    if (Number(mb) > 40) console.warn("Achtung: über 40 MB — für WhatsApp zu groß.");
  }
}

main();
