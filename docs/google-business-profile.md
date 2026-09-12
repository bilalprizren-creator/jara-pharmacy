# Google Business Profile — Stand und Regeln

Betriebsdokument für die Google-Präsenz der Filialen. Konto: `jarapharm@gmail.com`,
Business-Profile-Manager unter business.google.com, Gruppe **„Jara Pharmacy"**.
Die Filialdaten selbst (Adressen, Koordinaten, Telefonnummern, Zeiten) leben in
`src/data/locations.ts` — das ist die einzige Quelle. Was hier steht, ist der
Zustand auf Googles Seite und das, was wir dabei gelernt haben.

## Stand 11. September 2026

**Ketten-Verifizierung beantragt** — Google-Fall **`8-9575000041696`**. Google
Support hat bestätigt, dass das Konto 10+ förderfähige Profile hat, und wartet
auf die Rückbestätigung, dass wir die Kette (nicht Einzelverifizierung) wollen.

| Profil | Code | Status |
|---|---|---|
| Jara Pharmacy 1 | — | verifiziert, öffentlich live |
| Jara Pharmacy 3 | — | beansprucht, wartet auf Kette |
| Jara Pharmacy 0, 2, 4, 5, 6, 7, 9, 10 | JARA-00 … JARA-10 | importiert, warten auf Kette |
| Jara Pharmacy 8 | JARA-08 | **fehlt noch** — beim Import nicht angekommen |
| Jara Pharmacy Depo | JARA-DEPO | **noch nicht angelegt** |

Sobald die Kette bestätigt ist, werden **später hinzugefügte Profile automatisch
verifiziert** (so Google Support). Jara 8 und die Depo deshalb erst danach
nachlegen — dann brauchen sie weder Video noch Postkarte.

## Sichtbarkeit bei Google — Befund 12. September 2026

Live geprüft (Albanisch, Region Kosovo, Standort Prizren, ohne Personalisierung):

| Suche | Web-Ergebnisse | Kartenblock (3 Plätze) |
|---|---|---|
| jara pharmacy | Platz 1 jara-pharmacy.com | beide Jara-Einträge |
| barnatore prizren / barnatore ne prizren | Platz 2 (Platz 1: Facebook „Barnatore GAMA 89") | Menta Pharm, Menta Plus, Dalo 2 — **Jara fehlt** |
| barnatore (Standort Prizren) | nicht auf Seite 1 | Dalo 2, Menta Pharm, SaramPharm — **Jara fehlt** |
| farmaci prizren | Platz 4 | Menta Pharm, Eco Pharmacy 4, Menta Plus — **Jara fehlt** |

Google Maps „barnatore prizren": Menta Pharm 5,0★ (41 Bewertungen), Menta Plus
5,0★ (21), Dalo 2, Guri, SaramPharm, Esipharm, MALVA, Viola — kein Jara unter
den ersten acht. Öffentlich existieren nur zwei Jara-Einträge: **Jara Pharmacy 1**
(verifiziert; 0 Bewertungen, keine Fotos, keine Beschreibung, Telefon
+383 49 500 763 statt der Filialnummer +383 49 550 809) und der unverifizierte
Eintrag **„Jara pharmacy"** (= Filiale 3; nur Plus-Code, 2,3★ aus 3 Bewertungen).

Warum Jara im Kartenblock fehlt, in dieser Reihenfolge: 1 von 12 Filialen
sichtbar (Kette offen), 0 Bewertungen gegen 41, leeres Profil. Die Konkurrenz
heißt wörtlich „Barnatore …" — das ist deren eingetragener Name, den dürfen wir
nicht nachbauen (siehe Regeln).

Was danach zu tun ist, nach Wirkung sortiert:

1. **Sofort:** Name von Profil 1 wieder auf `Jara Pharmacy 1` (stand am 12.09.
   als „JARA-1 - Barnatore" online — bricht die Namensregel der Kette und die
   Google-Richtlinien; Sperrgefahr).
2. **Sofort:** Profil 1 füllen — 5–10 Fotos (Außenansicht mit Leuchtschild,
   Innenraum, Team, Regale), Beschreibung ≤ 750 Zeichen auf Albanisch mit
   „barnatore në Prizren" und den 12 Lokacionen, Zusatzkategorien *Dyqan
   kozmetike* und *Dyqan produktesh shëndetësore*, Attribute (Kartenzahlung),
   Filialtelefon `+383 49 550 809`, Adresse laut Vertrag „Rruga Tirana".
3. **Sofort und laufend:** Bewertungen sammeln — der größte Hebel. Bewertungslink
   des Profils (Profil-Manager → „Kërko komente") als QR-Code an jede Kasse,
   Mitarbeiter fragen aktiv, Ziel 20+ in vier Wochen, auf jede Bewertung
   antworten (mit „barnatore" und Filialname im Text).
4. **Nach der Kettenbestätigung:** Jara 8 und Depo nachlegen; pro Profil
   Website-Link auf die eigene Filialseite, Fotos, Öffnungszeiten (Jara 1: 22:00
   oder 22:30?); den Eintrag „Jara pharmacy" als Jara Pharmacy 3 übernehmen und
   auf die drei alten Bewertungen antworten — nicht neu anlegen.
5. **Laufend:** wöchentlich ein Google-Beitrag; Facebook, Instagram, Wolt,
   gjirafa.biz und gjejemjekun.com auf einheitliche Daten und einen Link auf
   jara-pharmacy.com prüfen (die letzten beiden ranken selbst für „barnatore
   prizren").

Website-seitig ist seit dem 12.09. jede Filialseite und der Hub eine eigene
Seite mit eigenem Inhalt (vorher zeigten alle 19 Adressen nach dem Laden die
Startseite, Google hatte nur 3 davon indexiert). In der Search Console nach dem
Deploy: Seiten-Bericht prüfen, Sitemap einreichen, für den Hub und die elf
Filialseiten „Indexierung beantragen".

## Feste Regeln

- **Kein Keyword im Namen.** Der Name ist der eingetragene Firmenname und sonst
  nichts — kein „Barnatore", kein „Farmaci", kein Stadtteil. Google verlangt
  für die Kette denselben Namen auf allen Standorten, wertet Zusätze als
  Verstoß (bis zur Sperrung), und „Jara Pharmacy" muss im Namen bleiben, damit
  die Markensuche trifft. „Barnatore" gehört in Beschreibung, Beiträge,
  Antworten auf Bewertungen und die verlinkten Filialseiten.

- **Öffentlicher Name ohne führende Null:** `Jara Pharmacy 3`, nicht `03`. So
  steht es im ARBK-Register (jede Filiale ist eine eigene SH.P.K.).
- **Store-Codes mit Null:** `JARA-00` … `JARA-10`, `JARA-DEPO`. Nur intern.
- **Kategorie:** `Farmaci` — der Name in der Kontosprache, nicht `Pharmacy`.
- **Depo:** Kategorie `Warehouse`, nicht Farmaci. Sie liegt 17 m neben Filiale 8;
  eine zweite Apotheke direkt daneben würde Google als Duplikat werten, ein
  Lager nicht.
- **Website pro Filiale:** `https://jara-pharmacy.com/lokacionet/<id>` — die
  eigene Filialseite, nie die Startseite.
- **Keine Einzelverifizierung**, solange die Kette läuft. Die Knöpfe „Kryej
  verifikimin" neben den Profilen sind genau das.

## Import über Tabelle — was funktioniert

Die fertigen Dateien liegen hier im Ordner: **`google-import-filialen.xlsx`**
(die neun Filialen, so wie sie erfolgreich hochgeladen wurden) und
**`google-import-depo.xlsx`** (die Depo, noch nicht hochgeladen). Beide sind aus
Googles Originalvorlage gebaut und direkt hochladbar.

Google-Vorlage: business.google.com → *Shto biznes* → *Importo biznese* →
*Shkarko shabllonin*. 34 Spalten, Kopfzeile auf Englisch, erste Spalte heißt
**`Store code`**, Wochentage beginnen mit **Sonntag**.

**Für Kosovo nur diese Adressfelder füllen:** `Address line 1`, `Locality`,
`Country / Region` (= `Kosovo`), `Postal code`. Die Spalten **`Sub-locality`
und `Administrative area` müssen leer bleiben** — jeder Wert darin lässt die
Zeile mit „You can't edit this information" scheitern. Die Meldung klingt nach
fehlenden Rechten, ist aber keins: Googles Adressmodell kennt für Kosovo diese
Ebenen nicht. Stadtteile (Dardani, Jeni Mahalla …) fallen damit weg; die
Genauigkeit kommt aus `Latitude`/`Longitude`.

Koordinaten als **Zahlen** in die xlsx schreiben, nicht als Text — sonst macht
ein deutsches Excel aus `42.215464` ein `42,215464`.

Ein fehlgeschlagener Import ist folgenlos (0 angelegt, 0 geändert). Der
Fehlerbericht (*Shkarko detajet*) nennt in Spalte A das betroffene Feld.

## Offen

- Jara Pharmacy 8 nachlegen (eine Zeile, gleiches Format).
- Depo anlegen — eigene Öffnungszeiten und Telefonnummer noch unbekannt.
- Jara Pharmacy 1: Beschreibung sagt noch „Jara Pharmacy 3"; Adresse steht als
  „61 Ekrem Rexha", Vertrag sagt „Rruga Tirana, p.n.".
- Öffnungszeit klären: Google zeigt bei Jara 1 22:30, `locations.ts` sagt 22:00.
- Jara 1: Telefon auf Google ist die Zentralnummer +383 49 500 763, die
  Filialseite nennt +383 49 550 809 — angleichen.
- Jara 1: Name zurück auf `Jara Pharmacy 1`, Fotos, Beschreibung, Bewertungen
  (siehe Befund oben).
- Store-Codes für Jara 1 und 3 lassen sich in der Oberfläche nicht setzen; nur
  über Export → Ergänzen → Re-Import, und das erst nach der Verifizierung.
