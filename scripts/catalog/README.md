# Katalogu i ri i produkteve — nga lista e ALBTRIX-it te faqja

Këtu janë veglat që marrin listën e vërtetë të produkteve të barnatores (9.460
artikuj nga sistemi ALBTRIX), u gjejnë fotografitë, i japin ekipit një faqe për
t'i kontrolluar, dhe në fund i çojnë në faqen e internetit.

Rendi është gjithmonë ky: **të dhënat → fotografitë → kontrolli njerëzor → faqja.**
Asnjë fotografi nuk shkon live pa e parë dikush nga ekipi.

## 1. Të dhënat

```bash
node scripts/catalog/import-albtrix.mjs --dry-run   # vetëm raporti
node scripts/catalog/import-albtrix.mjs            # shkruan të dhënat
```

Lexon `9460 Produkte/Lista e Produkteve_me Brende_JARA.xlsx` dhe shkruan
`data/albtrix-products.json`.

Skedari burimor **nuk ruhet në git** (eksportet e ERP-së me çmime dhe furnitorë
nuk hyjnë në një depo publike), prandaj ky JSON është kopja e qëndrueshme — dhe
e vetmja që udhëton mes dy kompjuterëve.

Çka vendos skripti, dhe asgjë më shumë:

| Fusha | Kuptimi |
|---|---|
| `kind` | `retail` (7.176 mall tregtar → faqja) · `medicine` (2.237 barna → jashtë) · pjesa tjetër janë rreshta kontabiliteti |
| `barcodeUsable` | A e gjen ky barkod produktin jashtë barnatores? Kontrollohet shifra e kontrollit GS1; kodet e brendshme (02/04/2), vendmbajtësit dhe kodet jo-EAN nuk vlejnë |
| `findability` | `A` barkod + markë · `B` vetëm barkod · `C` vetëm markë · `D` asnjëra |

Kategoritë, përshkrimet dhe fotografitë **nuk** shpiken këtu.

## 2. Fotografitë e gatshme nga ChatGPT

```bash
node scripts/catalog/rescue-gpt-photos.mjs
```

Nxjerr 150 fotografitë që ndodhen brenda skedarit
`JARA_Produkte_mit_gefundenen_Fotos_150-1.xlsx` dhe i vendos në `.image-cache/gpt-150/`,
me raportin në `reports/gpt-150.json` (burimi, besueshmëria, shënimi).

Secila kontrollohet edhe kundrejt listës ALBTRIX: a ekziston vërtet artikulli, a
është mall tregtar, a përputhet barkodi. Të 150-ta kaluan; njëra fotografi
(`222HM`) është e cunguar dhe duhet marrë sërish.

## 3. Kërkimi i fotografive

Dy burime, të ndara qëllimisht sepse kanë siguri të ndryshme.

### a) Sipas barkodit — i saktë

```bash
node scripts/catalog/find-images.mjs --dry-run          # vetem sa gjenden
node scripts/catalog/find-images.mjs --label openfacts-01
```

Pyet Open Beauty / Food / Products Facts sipas GTIN-it. Barkodi është
identifikues i saktë, prandaj këto fotografi marrin besueshmëri **E lartë** kur
edhe emri përputhet. Fotografitë janë të licencuara lirshëm (CC-BY-SA) dhe
burimi ruhet me secilën.

Barkodet dërgohen në grupe nga 50 me një kërkesë të vetme — 6.285 artikuj
kushtojnë disa qindra kërkesa, jo dhjetëra mijëra. Serveri i kozmetikës pyetet i
pari, sepse ky asortiment është kryesisht kozmetikë.

### b) Nga katalogët e markave — përafërt

```bash
node scripts/catalog/find-brand-images.mjs --dry-run
node scripts/catalog/find-brand-images.mjs --brand BIBS --label markat-01
```

Për markat që bazat me barkod nuk i njohin fare (Chicco, Avent, Swanson, Wee
Baby dalin me 0 %), merret fotografia nga dyqani i vetë prodhuesit. Dyqanet nuk
publikojnë barkode, ndaj përputhja bëhet **me emër** — dhe pikërisht prandaj
asnjë fotografi nga ky burim nuk merr kurrë besueshmëri "E lartë".

Markat janë në [`brands.json`](brands.json). Të matura te BIBS: 81 % e produkteve
gjejnë një përputhje të besueshme, me ngjyrat që përkojnë saktë.

## 4. Faqja e kontrollit

```bash
node scripts/catalog/build-review-page.mjs
node scripts/catalog/build-review-page.mjs --report reports/seria-02.json --seria "Seria 02"
```

Ndërton një faqe të vetme HTML në `.catalog-cache/`, me të gjitha fotografitë
brenda saj. Publikohet si faqe private (Artifact) dhe hapet me link — edhe në
telefon, para raftit.

- Vendimet ruhen bashkërisht, kështu që disa persona kontrollojnë njëkohësisht
  dhe secili sheh çka është bërë tashmë.
- Kush kontrollon e shkruan emrin një herë; emri ruhet me çdo vendim.
- Klikimi i dytë mbi të njëjtin buton e kthen vendimin.

Për ta parë faqen para se ta marrë ekipi:

```bash
node scripts/catalog/preview-server.mjs     # http://localhost:5400
```

**Kufijtë:** faqja nuk guxon të kalojë 16 MB dhe fotografitë duhet të jenë brenda
saj (shfaqja bllokon burimet e jashtme). Me fotografi ~300 px kjo do të thotë
rreth 1.000 produkte për faqe; ndaji seritë me `--limit`.

## Çka nuk është ndërtuar ende

- ndërtimi i katalogut për faqen nga vendimet e ekipit,
- burime shtesë për markat që nuk kanë dyqan me katalog të hapur.
