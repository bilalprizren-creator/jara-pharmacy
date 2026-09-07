#!/usr/bin/env python3
"""
Rettet Produktnamen und Kategorie-Reihenfolge aus einer fertigen Katalog-PDF.
-----------------------------------------------------------------------------
In der Warenwirtschaft heißt ein Artikel „Accu check aparat". Im gedruckten
Katalog steht „Aparat ACCU-CHECK ACTIVE – për matjen e nivelit të glukozës në
gjak". Diese ausformulierten Namen sind Handarbeit und stecken nur in der PDF —
dieses Skript holt sie da heraus und schreibt sie nach catalog-names.json,
damit build-catalog.mjs sie beim nächsten Bauen wieder verwenden kann.

Erkannt wird ein Produkt daran, dass eine Zeile genau einem Artikelcode aus
src/data/imported/shemo-products.json entspricht; alles bis zum nächsten Code
ist sein Name.

  pip install pymupdf
  python3 scripts/catalog-pdf/extract-names.py "SHEMO PHARM _ Produktet.pdf"
  python3 scripts/catalog-pdf/extract-names.py katalog.pdf --page 4   # nur ansehen
"""

import argparse
import datetime as dt
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
PRODUCTS = os.path.join(ROOT, "src", "data", "imported", "shemo-products.json")
OUT = os.path.join(HERE, "catalog-names.json")

# Zeilen, die zur Seite gehören und nicht zu einem Produkt.
FOOTER = {"Thirr", "WhatsApp", "Produktet"}
PAGENO = re.compile(r"^\d+\s*/\s*\d+$")
CATNO = re.compile(r"^\d{1,2}$")


def page_lines(page):
    """Textzeilen der Seite in Lesereihenfolge, leere und Fußzeilen raus."""
    lines = []
    for raw in page.get_text("text").splitlines():
        line = " ".join(raw.split())
        if not line or line in FOOTER or PAGENO.match(line):
            continue
        lines.append(line)
    return lines


def parse_page(lines, codes):
    """Gibt (Kategorie, [(Code, Name), …]) für eine Seite zurück."""
    items = []
    head = []
    current = None
    parts = []

    for line in lines:
        if line in codes:
            if current:
                items.append((current, " ".join(parts)))
            current, parts = line, []
            continue
        if current:
            parts.append(line)
        else:
            head.append(line)

    if current:
        items.append((current, " ".join(parts)))

    # Alles vor dem ersten Artikelcode ist Seitenkopf. Darin steht die
    # Kategorienummer im Kästchen und direkt daneben der Kategoriename — an der
    # Nummer hängt sich der Name am sichersten auf, denn ein Logo kann davor
    # noch eigenen Text abwerfen.
    category = None
    for index, line in enumerate(head):
        if CATNO.match(line) and index + 1 < len(head):
            category = head[index + 1]
            break
    if category is None:
        rest = [line for line in head if not CATNO.match(line)]
        category = rest[-1] if rest else None
    return category, items


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("pdf", help="die bereits gedruckte Katalog-PDF")
    ap.add_argument("--out", default=OUT)
    ap.add_argument("--page", type=int, help="nur diese Seite zeigen, nichts schreiben")
    args = ap.parse_args()

    try:
        import pymupdf
    except ImportError:  # ältere Installationen kennen nur den alten Namen
        try:
            import fitz as pymupdf
        except ImportError:
            sys.exit("PyMuPDF fehlt — bitte 'pip install pymupdf' ausführen.")

    with open(PRODUCTS, encoding="utf-8") as fh:
        products = json.load(fh)
    codes = {str(p.get("productCode") or p.get("sku") or "") for p in products}
    codes.discard("")

    doc = pymupdf.open(args.pdf)

    if args.page:
        lines = page_lines(doc[args.page - 1])
        category, items = parse_page(lines, codes)
        print(f"Seite {args.page} · Kategorie: {category!r} · {len(items)} Produkte")
        for code, name in items:
            print(f"  {code}  {name}")
        return

    categories = []
    names = {}
    per_page = []
    unknown_pages = 0

    for page in doc:
        category, items = parse_page(page_lines(page), codes)
        if category and category not in categories:
            categories.append(category)
        if not category:
            unknown_pages += 1
        if items:
            per_page.append(len(items))
        for code, name in items:
            # Steht ein Code zweimal im Katalog, gewinnt der längere Name: der
            # kürzere ist meist ein Umbruch, der beim Extrahieren verloren ging.
            if len(name) > len(names.get(code, "")):
                names[code] = name

    payload = {
        "source": os.path.basename(args.pdf),
        "extractedAt": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
        "pages": doc.page_count,
        "perPage": max(per_page) if per_page else 0,
        "categories": categories,
        "names": dict(sorted(names.items())),
    }
    with open(args.out, "w", encoding="utf-8") as fh:
        json.dump(payload, fh, ensure_ascii=False, indent=2)
        fh.write("\n")

    print(
        f"{doc.page_count} Seiten gelesen · {len(categories)} Kategorien · "
        f"{len(names)} Namen · höchstens {payload['perPage']} Produkte je Seite"
    )
    if unknown_pages:
        print(f"  Hinweis: {unknown_pages} Seiten ohne erkennbare Kategorie")
    print(f"Geschrieben: {args.out}")


if __name__ == "__main__":
    main()
