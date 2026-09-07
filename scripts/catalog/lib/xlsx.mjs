/**
 * Minimal .xlsx reader on top of `zip.mjs` — cells, sheets and embedded images.
 * ---------------------------------------------------------------------------
 * Only what this project's source files actually need, but that includes two
 * traps the JARA workbooks really contain:
 *
 *  1. **Formula cells without a cached value.** Rows 51-150 of the photo
 *     workbook store the article code as `<f>TEXT(115593,"000000")</f>` with an
 *     empty `<v>`. Excel computes those on open; a reader that trusts `<v>`
 *     sees blank codes and silently drops 100 products. `TEXT(n,"000")` and
 *     plain string literals are therefore evaluated here.
 *  2. **Images are not in the cells.** Photos live in `xl/media/` and are tied
 *     to a cell only through the drawing part, so `imageAnchors()` resolves
 *     drawing → relationship → media file for a given sheet.
 *
 * XML is scanned with regular expressions rather than a real parser. That is
 * safe here because the input is machine-written spreadsheet XML with a fixed
 * shape — not arbitrary documents.
 */
import { openZip } from "./zip.mjs";

export function readWorkbook(buffer) {
  const zip = openZip(buffer);
  const strings = readSharedStrings(zip);
  const sheets = readSheetIndex(zip);

  return {
    zip,
    sheets,
    /** Sheet contents as a Map of row number → { A: "…", B: "…" }. */
    rows: (sheet) => readRows(zip, resolveSheetPath(sheets, sheet), strings),
    /** Every embedded picture on a sheet: { row, column, part }. */
    imageAnchors: (sheet) => readImageAnchors(zip, resolveSheetPath(sheets, sheet)),
    /** Raw bytes of an archive part, e.g. an image found via imageAnchors. */
    part: (name) => zip.read(name),
  };
}

/* ------------------------------------------------------------------ */
/*  Sheets                                                             */
/* ------------------------------------------------------------------ */

function readSheetIndex(zip) {
  const rels = readRelationships(zip, "xl/_rels/workbook.xml.rels");
  const sheets = [];
  for (const tag of zip.readText("xl/workbook.xml").match(/<sheet\b[^>]*\/?>/g) ?? []) {
    const name = decodeEntities(attribute(tag, "name") ?? "");
    const target = rels.get(attribute(tag, "r:id") ?? "");
    if (target) sheets.push({ name, path: normalizePart(target, "xl") });
  }
  return sheets;
}

function resolveSheetPath(sheets, sheet) {
  const found =
    typeof sheet === "number" ? sheets[sheet] : sheets.find((s) => s.name === sheet);
  if (!found) {
    const available = sheets.map((s) => s.name).join(", ");
    throw new Error(`No sheet ${JSON.stringify(sheet)} in this workbook. Available: ${available}`);
  }
  return found.path;
}

/* ------------------------------------------------------------------ */
/*  Cells                                                              */
/* ------------------------------------------------------------------ */

function readSharedStrings(zip) {
  if (!zip.has("xl/sharedStrings.xml")) return [];
  const xml = zip.readText("xl/sharedStrings.xml");
  return (xml.match(/<si\b[^>]*?(?:\/>|>[\s\S]*?<\/si>)/g) ?? []).map(collectText);
}

/**
 * The `[^>]*?` in these patterns is lazy on purpose. Greedy, it swallows the
 * slash of an empty self-closing cell (`<c r="C2"/>`), the alternation then
 * falls through to the closing-tag branch, and the cell after it disappears —
 * which quietly mis-typed 955 articles the first time round.
 */
function readRows(zip, path, strings) {
  const xml = zip.readText(path);
  const rows = new Map();
  for (const rowXml of xml.match(/<row\b[^>]*?(?:\/>|>[\s\S]*?<\/row>)/g) ?? []) {
    const number = Number(attribute(rowXml, "r"));
    if (!number) continue;
    const cells = {};
    for (const cellXml of rowXml.match(/<c\b[^>]*?(?:\/>|>[\s\S]*?<\/c>)/g) ?? []) {
      const reference = attribute(cellXml, "r") ?? "";
      const column = reference.replace(/\d+$/, "");
      const value = cellValue(cellXml, strings);
      if (column && value !== "") cells[column] = value;
    }
    rows.set(number, cells);
  }
  return rows;
}

function cellValue(cellXml, strings) {
  const type = attribute(cellXml, "t");
  const inline = cellXml.match(/<is\b[^>]*>[\s\S]*?<\/is>/)?.[0];
  if (type === "inlineStr" && inline) return collectText(inline);

  const raw = cellXml.match(/<v\b[^>]*>([\s\S]*?)<\/v>/)?.[1];
  if (raw !== undefined && raw !== "") {
    return type === "s" ? strings[Number(raw)] ?? "" : decodeEntities(raw);
  }

  // No cached value: fall back to the formula itself (see the header note).
  const formula = cellXml.match(/<f\b[^>]*>([\s\S]*?)<\/f>/)?.[1];
  return formula ? evaluateFormula(decodeEntities(formula)) : "";
}

/**
 * Evaluates only the two formula shapes the JARA workbooks use to keep long
 * numeric codes from being mangled into scientific notation. Anything else
 * returns an empty string rather than a guess.
 */
function evaluateFormula(formula) {
  const padded = formula.match(/^TEXT\(\s*(\d+)\s*,\s*"(0+)"\s*\)$/);
  if (padded) return padded[1].padStart(padded[2].length, "0");
  const literal = formula.match(/^"([\s\S]*)"$/);
  if (literal) return literal[1].replace(/""/g, '"');
  return "";
}

/* ------------------------------------------------------------------ */
/*  Embedded images                                                    */
/* ------------------------------------------------------------------ */

function readImageAnchors(zip, sheetPath) {
  const sheetRels = relsPathFor(sheetPath);
  if (!zip.has(sheetRels)) return [];

  const drawingRel = [...readRelationships(zip, sheetRels).values()].find((target) =>
    target.includes("drawing"),
  );
  if (!drawingRel) return [];

  const drawingPath = normalizePart(drawingRel, dirname(sheetPath));
  const drawingRels = readRelationships(zip, relsPathFor(drawingPath));
  const xml = zip.readText(drawingPath);

  // Excel writes these elements with an "xdr:" prefix, but a workbook produced
  // by a library may put the drawing namespace on the root and leave the
  // children bare — which is exactly what the JARA photo workbook does. Both
  // spellings have to match, or every picture goes silently missing.
  const anchors = [];
  const pattern = /<(?:xdr:)?(?:two|one)CellAnchor\b[\s\S]*?<\/(?:xdr:)?(?:two|one)CellAnchor>/g;
  for (const block of xml.match(pattern) ?? []) {
    const embed = block.match(/<(?:a:)?blip\b[^>]*\b(?:r:)?embed="([^"]+)"/)?.[1];
    const row = block.match(/<(?:xdr:)?from>[\s\S]*?<(?:xdr:)?row>(\d+)<\/(?:xdr:)?row>/)?.[1];
    const column = block.match(/<(?:xdr:)?from>[\s\S]*?<(?:xdr:)?col>(\d+)<\/(?:xdr:)?col>/)?.[1];
    const target = embed ? drawingRels.get(embed) : undefined;
    if (!target || row === undefined) continue;
    anchors.push({
      // Drawing anchors are zero-based; sheet rows are one-based.
      row: Number(row) + 1,
      column: Number(column ?? 0),
      part: normalizePart(target, dirname(drawingPath)),
    });
  }
  return anchors.sort((a, b) => a.row - b.row);
}

/* ------------------------------------------------------------------ */
/*  Small helpers                                                      */
/* ------------------------------------------------------------------ */

function readRelationships(zip, path) {
  const map = new Map();
  if (!zip.has(path)) return map;
  for (const tag of zip.readText(path).match(/<Relationship\b[^>]*\/?>/g) ?? []) {
    const id = attribute(tag, "Id");
    const target = attribute(tag, "Target");
    if (id && target) map.set(id, decodeEntities(target));
  }
  return map;
}

const dirname = (path) => path.slice(0, path.lastIndexOf("/"));
const relsPathFor = (path) =>
  `${dirname(path)}/_rels/${path.slice(path.lastIndexOf("/") + 1)}.rels`;

/**
 * Resolves a relationship target to an archive path. Targets come in both
 * flavours in the wild: relative to the part's own folder ("../media/x.png")
 * and absolute from the package root ("/xl/worksheets/sheet1.xml", which the
 * JARA photo workbook uses). Prefixing an absolute target with the base folder
 * would produce "xl/xl/…", so the leading slash decides.
 */
function normalizePart(target, baseDir) {
  const absolute = target.startsWith("/");
  const segments = (absolute ? target.slice(1) : `${baseDir}/${target}`).split("/");
  const out = [];
  for (const segment of segments) {
    if (segment === "." || segment === "") continue;
    if (segment === "..") out.pop();
    else out.push(segment);
  }
  return out.join("/");
}

const attribute = (tag, name) =>
  tag.match(new RegExp(`\\b${name.replace(":", "\\:")}="([^"]*)"`))?.[1];

const collectText = (xml) =>
  (xml.match(/<t\b[^>]*>([\s\S]*?)<\/t>/g) ?? [])
    .map((part) => decodeEntities(part.replace(/^<t\b[^>]*>/, "").replace(/<\/t>$/, "")))
    .join("");

function decodeEntities(text) {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}
