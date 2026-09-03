#!/usr/bin/env python3
"""
Downscale fetched product images into preview thumbnails.
---------------------------------------------------------
The preview page carries its images inside itself, so it can be opened from a
link or a file without a server. Full-size packshots would make that page tens
of megabytes; these thumbnails keep it a few.

Packshots are photographed on white, so the transparent ones are flattened onto
white rather than onto the page background — the same studio look the website
gives product photos.

Called automatically by build-preview.mjs; can also be run on its own:
  pip install pillow
  python3 scripts/product-images/make-thumbs.py \
      --report scripts/reports/product-images-batch1.json
"""

import argparse
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))

MAX_EDGE = 480
JPEG_QUALITY = 82


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--report", required=True)
    ap.add_argument("--out", default=os.path.join(ROOT, ".image-cache", "thumbs"))
    args = ap.parse_args()

    try:
        from PIL import Image
    except ImportError:
        sys.exit("Pillow fehlt — bitte 'pip install pillow' ausführen.")

    with open(args.report, encoding="utf-8") as fh:
        report = json.load(fh)

    os.makedirs(args.out, exist_ok=True)
    made = skipped = failed = 0

    for product in report["products"]:
        source = product.get("file")
        if not source:
            continue
        source_path = os.path.join(ROOT, source)
        target = os.path.join(args.out, f"{product['code']}.jpg")
        if not os.path.exists(source_path):
            failed += 1
            continue
        if os.path.exists(target) and os.path.getmtime(target) >= os.path.getmtime(
            source_path
        ):
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
        except Exception as exc:  # a corrupt download must not stop the batch
            print(f"  ! {product['code']}: {exc}", file=sys.stderr)
            failed += 1

    print(f"Thumbnails: {made} neu, {skipped} unverändert, {failed} fehlerhaft")


if __name__ == "__main__":
    main()
