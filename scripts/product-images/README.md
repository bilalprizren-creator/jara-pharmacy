# Produktbilder aus der ALBTRIX-Liste

Holt Produktfotos für das Sortiment aus der Warenwirtschaft und baut daraus eine
Vorschauseite zum Durchsehen. Drei Schritte, in dieser Reihenfolge.

## 1. Datenbasis aus dem Excel-Export

```bash
pip install openpyxl
python3 scripts/product-images/prepare-dataset.py \
  --source "Lista e Produkteve_me Brende_JARA.xlsx"
```

Schreibt `albtrix-products.json`. Der Export selbst kommt nicht ins Git
(`*.xlsx` ist gesperrt), das erzeugte JSON schon.

Die Liste ist ein Buchhaltungsauszug, kein Produktkatalog. Sie wird deshalb nach
`Lloji i artikullit` getrennt:

| Art | Zeilen | wird verwendet |
|---|---|---|
| `100` Handelsware (OTC) | 7.175 | ja — dafür holen wir Bilder |
| `901` Arzneimittel | 2.237 | nein — teils rezeptpflichtig, braucht eine Entscheidung der Apotheke |
| `700` Aufwandskonten (Miete, Versicherung) | 36 | nein — keine Produkte |
| `200` Anlagevermögen (Firmenfahrzeuge) | 11 | nein — keine Produkte |

Von den 7.175 Handelswaren haben **6.287 einen weltweit auflösbaren Barcode** —
das ist die Menge, für die eine Bildsuche überhaupt Sinn ergibt. Geprüft wird
die GS1-Prüfziffer; Platzhalter und hausinterne Codes (Präfix 02/04/2) zählen
nicht als brauchbar, auch wenn die Prüfziffer stimmt.

## 2. Bilder holen

```bash
node scripts/product-images/fetch-images.mjs --dry-run   # Auswahl ansehen
node scripts/product-images/fetch-images.mjs --limit 100 # holen
```

Sortiert nach Auffindbarkeit: Marke mit Online-Katalog zuerst, verteilt über
mehrere Marken statt ein Regal leerzuräumen. Bilder landen in `.image-cache/`
(nicht im Git), der Bericht in `scripts/reports/`.

Ein bereits geladenes Bild wird nie erneut geholt — ein abgebrochener Lauf kann
einfach wiederholt werden.

## 3. Vorschauseite bauen

```bash
pip install pillow
node scripts/product-images/build-preview.mjs
```

Erzeugt eine einzelne HTML-Datei mit allen Bildern darin, zum Öffnen im Browser
oder zum Veröffentlichen als Seite. Jedes Bild lässt sich mit
**Passt / Unsicher / Falsch** bewerten; die Bewertungen bleiben im Browser und
lassen sich am Ende als Liste kopieren.

## Danach

Erst nach der Freigabe stellt sich die Frage, ob die Bilder in den Katalog auf
der Website wandern. Für die Website müssten sie verkleinert werden — die
vorhandenen 316 MB PNG in `public/products/` sind schon jetzt der größte
Bremsklotz beim Laden.
