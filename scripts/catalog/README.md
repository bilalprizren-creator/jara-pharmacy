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

Seritë e mëvonshme lexohen me të njëjtin skript, një raport për seri:

```bash
node scripts/catalog/rescue-gpt-photos.mjs --source "9460 Produkte/JARA_Fotografite_e_Produkteve_Seria_016_me_foto.xlsx" --label gpt-016
```

(Seritë 011–015 hynë bashkë si `gpt-011-015`, me `--match _me_foto`; sot ai
emër do të kapte edhe seritë e mëvonshme.) Merren të gjitha fotografitë e
serisë, edhe për produktet që i kemi tashmë: bashkimi (hapi 4) vendos cila është
më e mira, dhe tjetra mbetet alternativë. Një barnë në seri (Seria 018 kishte
një pilulë kontraceptive) nuk hyn fare në raport — shënohet vetëm te problemet.

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
pari, sepse ky asortiment është kryesisht kozmetikë. Rezultatet e kërkimit ruhen
në `state/` sapo gjenden, që një ndërprerje gjatë shkarkimit të mos e humbasë
punën; `--refresh` e detyron kërkimin nga e para.

**Rezolucioni:** shkarkohet miniatura 400 px, e cila mjafton plotësisht për
kontroll në telefon. Origjinali ekziston te i njëjti burim duke zëvendësuar
`.400.jpg` me `.full.jpg` (p.sh. 3072×4080) — por ai merret **vetëm për
fotografitë që ekipi i pranon**, jo për të gjitha. Ndryshe do të shkarkonim rreth
1 GB nga një shërbim falas për fotografi që në fund nuk i përdorim.

**Cilësia:** këto janë fotografi të kontribuuara nga përdoruesit, jo foto
zyrtare studio. Disa janë të shkëlqyera, disa janë të bëra me telefon mbi tavolinë.
Prandaj pyetja në faqen e kontrollit nuk është vetëm "a është produkti i saktë",
por "a shkon kjo fotografi në faqen tonë".

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

### c) Nga dyqanet vendore — gjuha jonë

Markat e huaja i shkruajnë produktet në italisht ose anglisht; lista jonë i
shkruan shqip ("SHISHE STEPUP 0M+ PER VAJZA"). Prandaj burimi që zgjidh
grupin më të madh që mbeti — Chicco, Avent, NUK, MAM, Suavinex, Wee Baby — nuk
është prodhuesi, por dyqani vendor: `farma-city.al`, `ditenate.al`,
`targetgroup-ks.com`, `mybaby.al`, `plutoni.store`, `novapharm.org` e të tjerë
shesin të njëjtat produkte me të njëjtat emra. Këto hyjnë në `brands.json` me
`"scope": "all"`.

Dy gjëra e bënë këtë burim të përdorshëm:

- **Barkodi te SKU-ja.** `farma-city.al` dhe `mybaby.al` e shkruajnë barkodin
  në fushën e artikullit. Aty nuk hamendësohet asgjë: GTIN-i e emërton
  produktin në gjithë botën, prandaj këto fotografi marrin besueshmëri
  **E lartë**, njësoj si nga bazat me barkod. Te farma-city 318 nga 322
  fotografitë erdhën kështu.
- **Një shkronjë ndryshim.** "MASHTRUESE" te ne, "Mashtruse" te dyqani —
  fjalët e gjata me vetëm shkronja lejohen të ndryshojnë për një shkronjë.
  Fjalët me shifra (200ML, 1000MG) duhet të përputhen saktësisht, sepse aty
  shifra është kuptimi.

### d) Katalogu ynë i vjetër (pa internet fare)

```bash
node scripts/catalog/find-brand-images.mjs --brand shemo-katalog --label depo-shemo
```

Faqja u ndërtua nga katalogu i SHEMO-s: 1.569 produkte, me fotografitë te
`public/products/`. Kodet e artikujve nuk përputhen me ato të ERP-së, prandaj
askush nuk i kishte lidhur — por emrat vijnë nga i njëjti distributor. Burimi me
`"platform": "local"` lexon pikërisht atë skedar; s'ka rrjet, s'ka pritje.

### Kujtesa e katalogëve

Leximi i një dyqani me hartë faqeje do të thotë katër mijë faqe, një nga një —
mbi një orë. Prandaj çka mëson leximi (emri, fotografia, barkodi) ruhet te
`state/katalog-<dyqani>.json` dhe ripërdoret; çdo përmirësim i mëvonshëm i
përputhjes rillogaritet pa e prekur dyqanin. Ruhet edhe gjatë rrugës, çdo 100
faqe, që një ndërprerje të mos e humbasë orën. `--refresh` shkon sërish te
dyqani — vetëm ashtu zëvendësohet kujtesa.

### e) Fotografitë që sjell dikush tjetër

Dy dorëzime të jashtme hyjnë me skriptet e veta, dhe të dyja kalojnë nëpër të
njëjtin kontroll: a ekziston shifra te lista jonë, a është mall tregtar, a
përputhet barkodi — dhe merren **vetëm artikujt që s'kanë ende fotografi**, që të
mos përsëritet puna e bërë.

```bash
node scripts/catalog/import-kimi.mjs --dry-run          # agjenti Kimi
python scripts/catalog/rescue-pdf-photos.py "9460 Produkte/…_008.pdf" --label gpt-008
```

- **Agjenti Kimi** dorëzoi 2.137 rreshta me fotografi te
  `9460 Produkte/Kimi_Agent_9460 Product Image Retrieval/`. Prej tyre 456 janë
  barna dhe rreth 1.200 i kishim tashmë; mbetën 467 artikuj të rinj, 376 me
  barkodin e konfirmuar.
- **Seritë si PDF (008, 009, 010).** Seritë e mëparshme erdhën si .xlsx dhe lexohen
  nga `rescue-gpt-photos.mjs`; këto erdhën si PDF. Një PDF nuk lexohet me mjetet
  e projektit, prandaj ky është i vetmi skript me Python këtu (`pip install
  pymupdf`). Fotografia çiftëzohet me rreshtin **sipas vendit në faqe**, jo sipas
  radhës: mjafton një fotografi e humbur që radha të rrëshqasë dhe secili produkt
  të marrë fotografinë e fqinjit.
  Fotografitë brenda PDF-së janë miniatura 174–229 px. Kur PDF-ja e shënon edhe
  "URL e fotografisë" (Seria 010 po, 008 e 009 jo), merret origjinali prej aty,
  i lidhur me rreshtin sipas barkodit që mban emri i skedarit
  (`451_8058664109715.jpeg`); kur burimi nuk përgjigjet, mbetet miniatura.

### f) Kontrolli i vetë punës

```bash
node scripts/catalog/check-photos.mjs
```

Sa më shumë burime, aq më lehtë hyn një gabim i heshtur. Ky skript nuk ndryshon
asgjë; vetëm pyet listën e bashkuar: a del secili produkt një herë të vetme, a
ekziston çdo skedar dhe a është vërtet fotografi, a ekziston secila shifër te
ALBTRIX, a ka hyrë ndonjë barnë, dhe — kur shënimi premton se barkodi përputhet
— a përputhet vërtet.

Ai e gjeti edhe një gabim që s'dukej: një fotografi e ardhur si AVIF me emrin
`.png`. Kontrolli i llojit i njihte vetëm PNG, JPEG e WebP, prandaj çdo dyqan që
shërben AVIF (dhe sot janë shumë) po hidhej poshtë si "jo fotografi". Tani lexohet
edhe ai lloj.

## 4. Bashkimi — një fotografi për produkt

```bash
node scripts/catalog/merge-photos.mjs
```

I bashkon të gjitha raportet në një listë të vetme: një hyrje për produkt, me
fotografinë më të mirë. Zgjedhja bëhet sipas pamjes (`lib/packshot.mjs`), dhe
kur dy foto janë afër njëra-tjetrës, fiton burimi më i besueshëm — katalogu i
prodhuesit, pastaj dyqani që e shet (edhe ai e merr fotografinë nga prodhuesi),
pastaj kërkimi i bërë një nga një, dhe në fund ngarkimi i një përdoruesi te baza
me barkod.

Kur edhe burimi është i të njëjtit lloj, fiton përputhja më e sigurt: barkodi
para emrit, dhe emri pa vërejtje para emrit me vërejtje. Dy përputhje me barkod
tregojnë të njëjtin artikull, prandaj aty fiton fotografia më e pastër, pastaj më
e madhja. Dy përputhje sipas emrit e mbajnë radhën që kishin: asgjë nuk thotë
cila prej tyre është artikulli i duhur, dhe ndërrimi sipas madhësisë vetëm
zëvendësonte një hamendje me një tjetër.

Fotot që humbin nuk fshihen: raporti i mban si alternativa, që të ketë ku të
kthehet kontrolluesi nëse e refuzon të parën.

## 5. Faqja e kontrollit

Ekipi punon te **https://jara-fotografite.vercel.app** — pa llogari, edhe në
telefon, para raftit.

```bash
node scripts/catalog/build-review-page.mjs --web --report reports/te-gjitha.json --title "Fotografitë Jara" --seria "Të gjitha produktet me fotografi"
node scripts/catalog/upload-photos.mjs      # vetëm fotot që s'janë ende atje
cd .catalog-cache/web && vercel deploy --prod
```

- **Fotografitë si skedarë, jo brenda faqes.** Secila foto bëhet dy herë WebP:
  400 px për kartën, 1200 px për pamjen e madhe (`lib/photo-derivatives.mjs`).
  Emri i skedarit është gjurma e përmbajtjes (SHA-1, 16 shenja), prandaj e
  njëjta foto nën dy emra ruhet një herë dhe asgjë nuk ngarkohet dy herë. Fotot
  rrinë te Supabase Storage (projekti `jara-fotografite`, kova publike `fotot`),
  sepse Vercel Hobby pranon vetëm 100 MB për ngarkim.
- **Pamja e madhe.** Prekja e fotografisë e hap të madhe, me barkodin të madh
  pranë për ta krahasuar me paketimin, dhe me zmadhim. Pas çdo vendimi kalon vetë
  te produkti tjetër; "Fillo kontrollin" nis nga i pari i pakontrolluar.
- **Fotografitë e tjera.** Kur një produkt ka edhe foto nga burime të tjera,
  pamja e madhe i tregon. Nëse e para s'përshtatet, kontrolluesi merr njërën prej
  tyre ("Përdor këtë foto") dhe produkti nuk mbetet pa foto.
- **Vendimet i sheh i gjithë ekipi.** Ruhen te tabela `vendimet`
  (`supabase/vendimet.sql`). Faqja mund vetëm të shtojë rreshta, kurrë të ndryshojë
  apo të fshijë: vendimi që vlen është më i riu për produkt (`vendimet_aktuale`),
  dhe secili rresht mban emrin dhe orën. Pa internet, vendimet mbeten në telefon
  dhe dërgohen vetë kur kthehet lidhja.
- Kush kontrollon e shkruan emrin një herë; klikimi i dytë mbi të njëjtin buton
  e kthen vendimin. "Foto e dobët" shënon çdo fotografi që nuk duket si foto
  produkti, dhe një filtër i mbledh të gjitha bashkë.

Çelësi te `web.json` është çelësi publik i Supabase: është bërë për t'u parë në
një faqe publike, dhe rregullat te `vendimet.sql` vendosin çka mund të bëjë.
Ngarkimi i fotove kërkon një leje që faqja s'duhet ta ketë — hapet vetëm sa zgjat
ngarkimi (komandat janë në krye të `upload-photos.mjs`).

Projekti falas i Supabase fle pas 7 ditësh pa përdorim; vendimet e ruajtura nuk
humbin, dhe projekti zgjohet nga paneli i Supabase. Vendimet lexohen me
`select * from vendimet_aktuale`.

Për ta parë faqen para se ta marrë ekipi:

```bash
node scripts/catalog/preview-server.mjs     # http://localhost:5400/web/?lokal
```

Me `?lokal` fotot merren nga ky kompjuter, para se të ngarkohet qoftë një; vendimet
shkojnë megjithatë në tabelën e vërtetë.

### Faqja e vjetër (Artifact)

```bash
node scripts/catalog/build-review-page.mjs --report reports/te-gjitha.json --title "Fotografitë Jara" --seria "Të gjitha produktet me fotografi"
```

Një faqe e vetme HTML në `.catalog-cache/`, me miniaturat brenda saj, e publikuar
si faqe private (Artifact). Faqja nuk guxon të kalojë 16 MB dhe shfaqja bllokon
burimet e jashtme, prandaj miniaturat zvogëlohen sa rritet grupi — 170 px për
4.600 produkte, shumë pak për të lexuar paketimin. Hapet vetëm për anëtarët e
organizatës në Claude. Mbetet si rezervë dhe e dërgon lexuesin te faqja web;
krahas saj shkruhet edhe një kopje e pavarur (`*-vetestrukturuar.html`).

## Ku është kufiri i kërkimit automatik

Më 8 shtator 2026, pas një sweep-i të plotë dhe pas dy dorëzimeve të jashtme:
**4.393 nga 7.176 artikuj tregtarë kanë një fotografi (61 %)**, 82 % e tyre foto
studioje. Më 10 shtator, me seritë 010–018 të ChatGPT-së: **4.658 (65 %)**.

Sa solli secili burim, dhe sa nga ato s'i kishte askush tjetër:

| Burimi | Produkte | Vetëm ky burim |
|---|---|---|
| Dyqanet dhe markat (ky projekt) | 3.176 | 2.102 |
| Agjenti Kimi | 1.680 | 467 |
| Bazat me barkod | 739 | 327 |
| Seritë e ChatGPT-së | 358 | 103 |

Mbivendosja nuk humbet: kur dy burime kanë të njëjtin produkt, fiton fotografia
me pamje më të mirë dhe tjetra mbetet si alternativë.

Çka jep dhe çka nuk jep rezultat, e matur:

| Burimi | Rendimenti |
|---|---|
| Dyqan vendor që e shkruan barkodin te SKU (farma-city, mybaby) | shumë i lartë — 380 përputhje të sakta me një kërkesë API |
| Dyqan vendor me emra shqip (plutoni 609, ditenate 169) | 14 % e faqeve të lexuara japin fotografi |
| Katalogët e vetë markave | i shterur — kalimi i dytë mbi 32 marka dha 5 fotografi |
| Dyqan i huaj me barkod te të dhënat (bebetei.ro) | 0,5 % — barkodet e tyre janë variante të tjera nga tonat |
| Ulja e pragut të përputhjes në 0,5 | s'vlen — shumica e përputhjeve dolën të gabuara |

Prandaj 3.258 artikujt që mbeten nuk gjenden duke shtuar edhe një dyqan: 1.637
prej tyre janë pa markë fare, të shpërndarë në 1.192 emra prodhuesish të vegjël —
mesatarisht 1,4 produkte për prodhues.

Dy rrugë mbeten, të dyja jashtë skripteve:

- **Kërko katalogun te furnitorët.** Santefarm (343 artikuj pa foto), Asgeto
  (290), ADL (200), Pharmatree (149) i kanë fotografitë e veta; është një email
  për secilin, jo një crawler.
- **Fotografo në raft.** Pjesa që mbetet gjendet fizikisht në barnatoret e
  Prizrenit.

## Çka nuk është ndërtuar ende

- ndërtimi i katalogut për faqen nga vendimet e ekipit (`vendimet_aktuale`);
- fotografitë origjinale më të mëdha (p.sh. Open Facts `.full.jpg`) për ato që
  ekipi i pranon.
