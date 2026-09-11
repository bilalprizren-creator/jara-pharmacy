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

## Feste Regeln

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
- Store-Codes für Jara 1 und 3 lassen sich in der Oberfläche nicht setzen; nur
  über Export → Ergänzen → Re-Import, und das erst nach der Verifizierung.
