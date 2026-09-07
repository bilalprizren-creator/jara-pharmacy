# Katalog als PDF

Baut aus den importierten SHEMO-Produkten den Produktkatalog: A4, drei Spalten,
zwölf Produkte je Seite, jede Kategorie fängt auf einer neuen Seite an.

## Bauen

```bash
pip install pillow
node scripts/catalog-pdf/build-catalog.mjs
```

Fertig liegt die Datei unter `.catalog-cache/jara-katalog.pdf` (rund 30 MB,
knapp 15 Sekunden). Der Ordner `.catalog-cache/` ist Arbeitsmaterial und
absichtlich nicht im Git.

Nützliche Schalter:

| Schalter | Wirkung |
|---|---|
| `--limit 3` | nur die ersten drei Kategorien — zum schnellen Ansehen |
| `--html-only` | nur die HTML bauen, nicht drucken |
| `--skip-thumbs` | die Bilder nicht neu verkleinern (nach dem ersten Lauf) |
| `--out datei.pdf` | woanders hinschreiben |

Gedruckt wird mit dem Chromium, der auf dem Rechner liegt; einen eigenen Pfad
nimmt er über `CHROME_PATH=/pfad/zu/chrome`. Ohne Chromium bleibt es bei der
HTML — die lässt sich im Browser mit Strg + P und Ränder „Keine" selbst als PDF
speichern.

## Das Logo

`assets/shemo-logo.png` (oder `.svg`) erscheint klein und mittig oben auf jeder
Seite. Fehlt die Datei, wird ohne Logo gebaut und das Skript sagt es. Das Logo
gehört bewusst hierher und nicht nach `public/` — es ist für den Katalog, nicht
für die Website.

## Die Produktnamen

In der Warenwirtschaft heißt ein Artikel „Accu check aparat", im Katalog steht
„Aparat ACCU-CHECK ACTIVE – për matjen e nivelit të glukozës në gjak". Diese
ausformulierten Namen und die Reihenfolge der Kategorien stehen in
`catalog-names.json`. Was dort fehlt, kommt aus den Produktdaten.

Aus einer bereits gedruckten PDF lassen sie sich zurückholen:

```bash
pip install pymupdf
python3 scripts/catalog-pdf/extract-names.py "SHEMO PHARM _ Produktet.pdf"
python3 scripts/catalog-pdf/extract-names.py katalog.pdf --page 4   # nur ansehen
```

Das überschreibt `catalog-names.json`. **Danach committen** — sonst ist die
Handarbeit beim nächsten Mal wieder weg.

## Woher die Daten kommen

- Produkte, Codes, Fotos: `src/data/imported/shemo-products.json`
- Telefon und WhatsApp in der Fußzeile: dieselben Nummern wie in
  `src/data/brand.ts`
- Farben: Jara-Grün aus `tailwind.config.js`

Die Website wird davon nicht berührt — dieses Verzeichnis baut nur eine Datei.
