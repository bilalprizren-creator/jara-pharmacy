#!/usr/bin/env python3
"""Fotografitë e serive që erdhën si PDF (Seria 008, 009, 010, …).

Seritë e mëparshme erdhën si .xlsx dhe lexohen nga `rescue-gpt-photos.mjs`.
Seritë 008 e 009 erdhën si PDF, dhe një PDF nuk lexohet me mjetet e projektit:
teksti i tij është brenda rrjedhave të ngjeshura dhe fotografitë janë objekte
më vete, pa asnjë lidhje me rreshtin përveç vendit ku ndodhen në faqe.

Prandaj ky është i vetmi skript me Python këtu, dhe e bën punën një herë:

    pip install pymupdf
    python scripts/catalog/rescue-pdf-photos.py "9460 Produkte/JARA_..._008.pdf" --label gpt-008

Çka bën, dhe pse ashtu:

- **Përputhja bëhet sipas vendit në faqe, jo sipas radhës.** Nëse numërohen
  fotografitë dhe rreshtat veç e veç dhe pastaj çiftëzohen sipas radhës, mjafton
  një fotografi e humbur që të gjitha të tjerat të rrëshqasin një rresht poshtë —
  dhe secili produkt të marrë fotografinë e fqinjit. Këtu secila fotografi merr
  rreshtin brenda të cilit ndodhet vërtet.
- **Rreshti kontrollohet kundrejt listës ALBTRIX**: a ekziston shifra, a është
  mall tregtar, a përputhet barkodi që shkruan PDF-ja me tonin.
- **Merren vetëm artikujt pa fotografi te ne**, që të mos përsëritet puna.
- **Origjinali në vend të miniaturës.** Fotografitë brenda PDF-së janë
  miniatura 174–229 px, shumë pak për pamjen e madhe të kontrollit. Por kolona
  "URL e fotografisë" e shënon adresën e plotë të secilës, prandaj merret
  origjinali prej aty. Kur burimi nuk përgjigjet, mbetet miniatura;
  `--thumbnails` e anashkalon shkarkimin fare.

Raporti del në `reports/<label>.json`, në të njëjtën formë si burimet e tjera,
dhe fotografitë te `.image-cache/<label>/`.
"""

import argparse
import json
import re
import sys
import time
import urllib.request
from pathlib import Path
from urllib.parse import urlparse

try:
    import fitz  # PyMuPDF
except ImportError:  # pragma: no cover - varet nga mjedisi
    sys.exit("Duhet PyMuPDF:  pip install pymupdf")

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "scripts" / "catalog" / "data" / "albtrix-products.json"
REPORT_DIR = ROOT / "scripts" / "catalog" / "reports"

MIN_IMAGE_BYTES = 3000
USER_AGENT = "JaraPharmacy-ImageBot/1.0 (+https://jara-pharmacy.com)"
# Shifra jonë është ose numër, ose numër me shkronja (L543, SCF099/22).
CODE = r"[A-Z0-9][A-Z0-9./-]*"
ROW = re.compile(rf"^\s*(\d{{1,5}})\s+({CODE})\s+(.+?)\s+(\d{{8,14}})\s*$")
# Kolona e fundit e emërton secilën fotografi sipas rreshtit: "451_8058664109715.jpeg".
FILE_NAME = re.compile(r"^(\d{1,5})_(\d{8,14})\.(?:jpe?g|png|webp|gif|avif)$", re.IGNORECASE)
# Shënimi i një rreshti pa fotografi: URL-ja para tij nuk i takon asnjë fotografie.
NOT_USED = re.compile(r"nuk u përdor|lënë bosh", re.IGNORECASE)


def known_codes(label: str) -> set:
    """Shifrat që kanë tashmë një fotografi nga një burim tjetër."""
    codes = set()
    if not REPORT_DIR.exists():
        return codes
    for path in REPORT_DIR.glob("*.json"):
        # Edhe raporti i vetë kësaj serie: po të numërohej, një ekzekutim i dytë
        # me të njëjtin emër do t'i gjente të gjitha "të kryera" dhe do ta
        # mbishkruante raportin me zero fotografi.
        if path.name in ("te-gjitha.json", f"{label}.json"):
            continue
        try:
            report = json.loads(path.read_text(encoding="utf-8"))
        except (ValueError, OSError):
            continue
        for photo in report.get("photos") or []:
            if photo.get("code"):
                codes.add(photo["code"])
    return codes


def row_at(words, rect):
    """
    Rreshti që i takon kësaj fotografie.

    Fotografia është ankora: qeliza e saj e mban lartësinë e gjithë rreshtit,
    ndaj çdo fjalë që bie brenda asaj lartësie i takon këtij produkti — edhe kur
    emri thyhet në dy rreshta brenda qelisë. Kolonat ndahen sipas vendit të
    fotografisë: shifra dhe emri janë në të djathtë të saj, numri rendor në të
    majtë, dhe barkodi është numri i fundit djathtas.
    """
    inside = [w for w in words if rect.y0 - 2 <= (w[1] + w[3]) / 2 <= rect.y1 + 2]
    right = sorted((w for w in inside if w[0] > rect.x1), key=lambda w: (w[0]))
    if not right:
        return None

    barcodes = [w for w in right if re.fullmatch(r"\d{8,14}", w[4])]
    barcode = max(barcodes, key=lambda w: w[0]) if barcodes else None

    rest = [w for w in right if w is not barcode]
    if not rest:
        return None
    code = rest[0]
    # Emri: gjithçka mes shifrës dhe barkodit, në rendin e leximit.
    name_words = sorted((w for w in rest[1:]), key=lambda w: (round(w[1]), w[0]))
    name = " ".join(w[4] for w in name_words).strip()
    if not code[4] or not name:
        return None
    return {
        "code": code[4].strip(),
        "name": " ".join(name.split()),
        "barcode": barcode[4] if barcode else "",
    }


def images_of(page, doc):
    """Fotografitë e faqes me vendin e tyre dhe bajtat e papërpunuar."""
    found = []
    for info in page.get_images(full=True):
        xref = info[0]
        rects = page.get_image_rects(xref)
        if not rects:
            continue
        data = doc.extract_image(xref)
        found.append({"rect": rects[0], "bytes": data["image"], "ext": data["ext"]})
    return found


def original_urls(doc):
    """
    Barkodi → adresa e fotografisë origjinale, nga kolonat e fundit të fletës.

    Në tekstin e faqes secili rresht del si: URL-ja (e thyer në disa rreshta),
    shënimi, emri i skedarit. Emri i skedarit e mban barkodin, prandaj lidhja
    bëhet sipas tij dhe jo sipas radhës së rreshtave.
    """
    found = {}
    for page in doc:
        url, note = None, []
        for line in (part.strip() for part in page.get_text("text").split("\n")):
            if not line:
                continue
            match = FILE_NAME.match(line)
            if line.startswith("http"):
                url, note = line, []
            elif match:
                if url and not NOT_USED.search(" ".join(note)):
                    found[match.group(2)] = url
                url, note = None, []
            elif url is not None and not note and " " not in line:
                url += line  # URL-ja vazhdon në rreshtin tjetër të shtypur
            elif url is not None:
                note.append(line)
    return found


def image_kind(data: bytes):
    """Lloji sipas bajtave të parë — prapashtesa e adresës shpesh gënjen."""
    if data[:3] == b"\xff\xd8\xff":
        return "jpg"
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return "png"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "webp"
    if data[:6] in (b"GIF87a", b"GIF89a"):
        return "gif"
    if data[4:12] in (b"ftypavif", b"ftypavis"):
        return "avif"
    return None


def download(url: str):
    """(bajtat, lloji) i origjinalit, ose None kur s'merret ose s'është fotografi."""
    try:
        request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "image/*,*/*;q=0.8"})
        with urllib.request.urlopen(request, timeout=20) as response:
            data = response.read()
    except Exception:  # çdo dështim do të thotë: mbetet miniatura
        return None
    finally:
        time.sleep(0.5)
    kind = image_kind(data)
    if not kind or len(data) < MIN_IMAGE_BYTES:
        return None
    return data, kind


def main() -> None:
    parser = argparse.ArgumentParser(description="Merr fotografitë nga një seri PDF.")
    parser.add_argument("pdf", help="skedari PDF i serisë")
    parser.add_argument("--label", default="gpt-pdf", help="emri i raportit")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--replace", action="store_true", help="edhe atje ku kemi foto")
    parser.add_argument("--thumbnails", action="store_true", help="mos i shkarko origjinalet")
    args = parser.parse_args()

    catalog = json.loads(DATA.read_text(encoding="utf-8"))
    by_code = {str(p["code"]).strip(): p for p in catalog["products"]}
    already = known_codes(args.label)

    image_dir = ROOT / ".image-cache" / args.label
    doc = fitz.open(args.pdf)
    originals = {} if args.thumbnails else original_urls(doc)

    pairs = []
    unpaired = 0
    for page in doc:
        words = page.get_text("words")
        for image in images_of(page, doc):
            row = row_at(words, image["rect"])
            if row is None:
                unpaired += 1
                continue
            pairs.append((row, image))

    skipped = {"unknown": 0, "medicine": 0, "have": 0, "barcodeClash": 0, "tooSmall": 0}
    photos = []
    fetched = 0
    for row, image in pairs:
        product = by_code.get(row["code"])
        if product is None:
            skipped["unknown"] += 1
            continue
        if product.get("kind") != "retail":
            skipped["medicine"] += 1
            continue
        if not args.replace and product["code"] in already:
            skipped["have"] += 1
            continue
        if len(image["bytes"]) < MIN_IMAGE_BYTES:
            skipped["tooSmall"] += 1
            continue

        ours = str(product.get("barcode") or "").strip()
        clash = bool(ours and row["barcode"] != ours)
        if clash:
            skipped["barcodeClash"] += 1

        data, ext = image["bytes"], image["ext"]
        url = originals.get(row["barcode"], "")
        original = download(url) if url and not args.dry_run else None
        if original and len(original[0]) > len(data):
            data, ext = original
            fetched += 1
            origin = f" Fotografia origjinale nga {urlparse(url).netloc}."
        elif url and not args.dry_run:
            origin = f" Origjinali ({urlparse(url).netloc}) nuk u shkarkua — kjo është miniatura e PDF-së."
        else:
            origin = ""

        name = f"{len(photos) + 1:04d}_{re.sub(r'[^A-Za-z0-9._-]+', '-', row['code'])}.{ext}"
        if not args.dry_run:
            image_dir.mkdir(parents=True, exist_ok=True)
            (image_dir / name).write_bytes(data)

        photos.append(
            {
                "number": len(photos) + 1,
                "code": product["code"],
                "name": product["name"],
                "barcode": product.get("barcode", ""),
                "brand": product.get("brand", ""),
                "confidence": "E ulët" if clash else "E lartë",
                "status": "Mospërputhje" if clash else "Për verifikim",
                "note": (
                    f"Nga seria e kërkimit \"{row['name']}\"."
                    + (
                        f" KUJDES: seria shënon barkodin {row['barcode']}, ne kemi {ours} — kontrollo cili artikull është."
                        if clash
                        else f" Barkodi {row['barcode']} përputhet me tonin."
                    )
                    + origin
                    + " Krahasoje me paketimin para publikimit."
                ),
                "sourcePage": "",
                "imageUrl": url,
                "licence": f"Kërkim i jashtëm, {Path(args.pdf).name}",
                "file": f".image-cache/{args.label}/{name}",
                "bytes": len(data),
            }
        )

    print(f"\n  {Path(args.pdf).name}")
    print(f"  {'-' * 62}")
    print(f"  Faqe                    {doc.page_count}")
    print(f"  Fotografi me rresht     {len(pairs)}")
    if unpaired:
        print(f"  Fotografi pa rresht     {unpaired}")
    print(f"  Jashtë listës sonë      {skipped['unknown']}")
    print(f"  Barna                   {skipped['medicine']}")
    print(f"  I kemi tashmë           {skipped['have']}")
    print(f"  Të marra                {len(photos)}")
    if skipped["barcodeClash"]:
        print(f"  Barkodi s'përputhet     {skipped['barcodeClash']} (shënuar si mospërputhje)")
    if originals:
        print(f"  URL origjinale në PDF   {len(originals)}")
        if not args.dry_run:
            print(f"  Origjinale të marra     {fetched} nga {len(photos)}")

    if args.dry_run:
        for photo in photos[:10]:
            print(f"     {photo['code']:<10} {photo['name'][:50]}")
        print("\n  --dry-run: asgjë nuk u shkrua.\n")
        return

    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    report = {
        "generatedAt": __import__("datetime").datetime.now().astimezone().isoformat(),
        "label": args.label,
        "source": f"Seri e jashtme fotografish ({Path(args.pdf).name})",
        "totals": {"pairs": len(pairs), "taken": len(photos), "originals": fetched, "skipped": skipped},
        "failed": [],
        "photos": photos,
    }
    out = REPORT_DIR / f"{args.label}.json"
    out.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"\n  Raporti: {out.relative_to(ROOT)}\n")


if __name__ == "__main__":
    main()
