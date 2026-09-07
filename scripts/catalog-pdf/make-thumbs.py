#!/usr/bin/env python3
"""
Verkleinert die Produktfotos für den Katalog-PDF.
-------------------------------------------------
Die Packshots in public/products/ sind zusammen rund 316 MB PNG. In den Katalog
kommt jedes Foto nur etwa 33 mm breit — bei 300 dpi sind das keine 400 Pixel.
Unverkleinert wäre die PDF mehrere hundert Megabyte groß und ließe sich weder
per WhatsApp verschicken noch auf einem Handy öffnen.

Die Fotos sind auf Weiß fotografiert, transparente werden deshalb auf Weiß
gelegt und nicht auf den Seitenhintergrund — derselbe Studio-Look, den die
Website den Produktbildern gibt (src/components/ui/ProductMedia.tsx).

Wird von build-catalog.mjs automatisch aufgerufen, geht aber auch allein:
  pip install pillow
  python3 scripts/catalog-pdf/make-thumbs.py
"""

import argparse
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))

# 33 mm Bildbreite bei 300 dpi sind 390 px. 420 lässt Luft für hochformatige
# Packungen, die die Höhe ausreizen statt die Breite.
MAX_EDGE = 420
JPEG_QUALITY = 76


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--products", default=os.path.join(ROOT, "src", "data", "imported", "shemo-products.json"))
    ap.add_argument("--out", default=os.path.join(ROOT, ".catalog-cache", "thumbs"))
    ap.add_argument("--quiet", action="store_true")
    args = ap.parse_args()

    try:
        from PIL import Image
    except ImportError:
        sys.exit("Pillow fehlt — bitte 'pip install pillow' ausführen.")

    with open(args.products, encoding="utf-8") as fh:
        products = json.load(fh)

    os.makedirs(args.out, exist_ok=True)
    made = skipped = missing = failed = 0

    for product in products:
        source = product.get("image")
        if not source:
            missing += 1
            continue
        # "/products/xy.png" ist ein Web-Pfad, auf der Platte liegt es unter public/.
        source_path = os.path.join(ROOT, "public", source.lstrip("/"))
        stem = os.path.splitext(os.path.basename(source))[0]
        target = os.path.join(args.out, f"{stem}.jpg")
        if not os.path.exists(source_path):
            missing += 1
            continue
        # Ein einmal verkleinertes Bild wird nie erneut angefasst: der zweite
        # Lauf ist damit in Sekunden fertig statt in Minuten.
        if os.path.exists(target) and os.path.getmtime(target) >= os.path.getmtime(source_path):
            skipped += 1
            continue
        try:
            with Image.open(source_path) as im:
                im = im.convert("RGBA")
                im.thumbnail((MAX_EDGE, MAX_EDGE), Image.LANCZOS)
                canvas = Image.new("RGB", im.size, (255, 255, 255))
                canvas.paste(im, mask=im.split()[3])
                canvas.save(target, "JPEG", quality=JPEG_QUALITY, optimize=True)
            made += 1
        except Exception as exc:  # ein kaputtes Bild darf den Lauf nicht stoppen
            print(f"  ! {product.get('productCode')}: {exc}", file=sys.stderr)
            failed += 1

    if not args.quiet:
        print(f"Bilder: {made} neu verkleinert, {skipped} unverändert, {missing} ohne Foto, {failed} fehlerhaft")


if __name__ == "__main__":
    main()
