# Online-Shop und Bezahlung — Stand und Betrieb

Betriebsdokument für den Shop auf jara-pharmacy.com: wie er gebaut ist, was
vor dem Live-Gang noch fehlt, und wie die Bank angebunden wird. Der Code liegt
auf dem Branch `shop`; auf `main` (und damit auf der Live-Seite) ist davon
**nichts**, bis der Maintainer den Merge freigibt.

## Was gebaut ist

| Teil | Wo | Was es tut |
|---|---|---|
| Preisliste | `src/data/prices.ts` | Nur Produkte mit Eintrag hier sind kaufbar. Preis in EUR inkl. MwSt. **Aktuell Platzhalter.** |
| Lieferkosten | `src/data/shipping.ts` | Abholung (gratis), Prizren, ganz Kosovo — Gebühr + „gratis ab“. **Platzhalter.** |
| Warenkorb | `src/context/CartContext.tsx`, `components/shop/CartDrawer.tsx` | Im Browser gespeichert; Icon mit Zähler in der Navbar. |
| Checkout | `/porosia` → `src/sections/Checkout.tsx` | Shporta · Të dhënat & dërgesa · Pagesa. Karte oder bar. |
| Bestellstatus | `/porosia/<id>` → `src/sections/OrderStatus.tsx` | Landet der Kunde nach der Bank; zeigt bezahlt / offen / fehlgeschlagen; „Provo përsëri“. |
| Rechtstexte | `/info/kushtet-e-blerjes`, `/info/privatesia`, `/info/dergesa-dhe-kthimi` → `src/data/legal.ts` | Entwürfe AL/EN; Footer-Links; werden als statische Seiten gebaut. |
| Server-Funktionen | `api/` | `POST /api/orders`, `GET /api/orders/<id>`, `POST /api/orders/<id>/pay`, `POST /api/payments/raiaccept` (Webhook), `api/payments/mock` (nur Test). |
| Datenbank | `db/schema.sql` (Neon Postgres) | Tabellen `orders` + `order_events`. Ohne `DATABASE_URL` schreibt der Dev-Server nach `.orders-dev/orders.json`. |
| E-Mails | `api/_lib/mail.ts` (Resend) | Apotheke: jede Bestellung mit WhatsApp-Link zum Kunden. Kunde: Bestätigung, falls E-Mail angegeben. |

Grundsätze: Der Browser schickt nur Produkt-IDs, Mengen und Kontaktdaten;
**jeder Betrag wird auf dem Server aus der Preisliste neu berechnet.** Die
Bank-Webhook wird nie blind geglaubt — der Server fragt bei RaiAccept nach,
bevor eine Bestellung als bezahlt gilt. Bestell-Links (`/porosia/<id>`) sind
zufällig und nicht erratbar.

## Lokal testen (ohne Bank, ohne Datenbank)

```bash
npm run dev
```

`.env.local` (nicht in git) enthält `RAIACCEPT_MODE=mock` und
`SITE_URL=http://localhost:5200`. Dann:

1. Auf der Startseite ein Produkt aus der Reihe „Oferta“ in den Warenkorb legen.
2. „Vazhdo te porosia“ → Daten ausfüllen → **Kartë online** → „Paguaj tani“.
3. Es erscheint eine **Test-Bezahlseite** („Faqe testuese“) mit drei Knöpfen:
   Paguaj / Refuzo / Anulo. Sie ersetzt die Bank und löst intern denselben
   Ablauf aus wie der echte Webhook.
4. Zurück auf `/porosia/<id>`: Status, Retry, WhatsApp-Knopf.

Bestellungen landen in `.orders-dev/orders.json`; E-Mails werden nur im
Terminal geloggt (`[mail] (not sent …)`).

## Bank: Raiffeisen Bank Kosovo → RaiAccept

Warum Raiffeisen: Stripe und PayPal nehmen keine Händler aus dem Kosovo.
RaiAccept (docs.raiaccept.com) ist das Gateway der Raiffeisen-Gruppe, in
Kosovo in EUR, mit Bezahlseite auf Albanisch, Visa/Mastercard, Apple Pay,
Google Pay, 3-D Secure, Webhook und Refund im Händlerportal.

Ablauf bei der Bank:

1. **Antrag** „Apply for E-Commerce“ auf raiffeisen-kosovo.com (Geschäftskonto
   nötig). Die Bank schickt Formulare und fragt die Website-Adresse ab.
2. **Website-Audit** durch die Bank. Sie prüft üblicherweise: Firmenname und
   Adresse, Preise in EUR inkl. MwSt., Kushtet e blerjes, Privatësia, Dërgesa
   dhe kthimi, Kontaktdaten, Kartenlogos, HTTPS. Alles davon ist gebaut —
   **die Rechtstexte müssen aber vorher von der Apotheke geprüft und die
   `[eckigen Klammern]` in `src/data/legal.ts` ausgefüllt werden** (Firmierung,
   Steuernummer, Kurierpartner).
3. **Vertrag**, dann Zugang zum **RaiAccept-Händlerportal**. Dort unter
   *API Credentials* → *New API Credentials* einen Benutzernamen/Passwort
   erzeugen — einmal für **Sandbox**, später einmal für **Produktion**
   (Schalter unten links im Portal).
4. Zugangsdaten als Vercel-Umgebungsvariablen eintragen (siehe unten).

Sandbox-Testkarten (nur Sandbox, beliebiger Name/CVV/Zukunftsdatum):

| Karte | Ergebnis |
|---|---|
| Visa `4999 9999 9999 0011` | Erfolg |
| Visa `4999 9999 9999 0029` | Abgelehnt |
| Visa `4999 9999 9999 0060` | Karte abgelaufen |
| Mastercard `5559 4900 0000 0007` | Erfolg |
| Mastercard `5559 4900 0000 0114` | Kein Guthaben |
| Mastercard `5559 4900 0000 0239` | Falscher CVV |

### Technische Kurzreferenz (für den Code in `api/_lib/raiaccept.ts`)

- Login `POST https://auth.raiaccept.com/auth/api/login` mit
  `{ username, password, integrationContext: { type: "CODE", data: { name, version, vendor } } }`
  → `accessToken` (~5 Minuten gültig).
- Bestellung `POST https://trapi.raiaccept.com/orders` → `orderIdentification`.
- Bezahlseite `POST https://trapi.raiaccept.com/orders/{id}/checkout` (gleicher Body)
  → `paymentRedirectURL`. Kunde wird dorthin geschickt.
- Rückkehr des Kunden auf `successUrl` / `failUrl` / `cancelUrl` =
  `/porosia/<id>?pagesa=sukses|deshtoi|anuluar`.
- Webhook an `notificationUrl` = `/api/payments/raiaccept`; danach fragt der
  Server `POST …/orders/{id}/transactions` und wertet
  `transactionType: PURCHASE`, `status: SUCCESS`, `statusCode: "0000"`,
  Betrag und Währung aus. Webhook-Absender: `18.96.33.128/29`.
- Refund: im Händlerportal per Klick, oder
  `POST …/orders/{id}/transactions/{txId}/refund { amount, currency }`.
- Offen bis zum Sandbox-Test: ob RaiAccept den Ländercode `XKX` (Kosovo)
  akzeptiert (wenn nicht, das Feld `country` in `orderBody()` weglassen), und
  ob der Sprach-Parameter der Bezahlseite `lang=al` heißt (die Docs nennen
  nur „Language prerequisites“; der Code hängt ihn an `paymentRedirectURL` an).
- Was der Server bei Störungen tut: Bank beim Bestellen nicht erreichbar →
  Bestellung wird gespeichert, Status `payment_failed`, Kunde landet auf der
  Bestellseite mit „Provo përsëri“. Kunde bricht auf der Bankseite ab →
  Bestellseite zeigt „anuluar“ + Retry; kommt nie eine Bestätigung, zeigt sie
  nach ~30 s „ende nuk është konfirmuar“ + Retry + WhatsApp. Mehr als 5
  Bestellungen in 10 Minuten von einer Adresse → 429 (Spam-Bremse).

## Go-live-Checkliste

Nichts davon ist gemacht; alles braucht eine Entscheidung oder ein Konto des
Maintainers / der Apotheke.

1. **Vercel Pro** buchen (Hobby erlaubt keine kommerzielle Nutzung).
2. **Neon** über Vercel → Storage/Marketplace anlegen (Region Frankfurt);
   `DATABASE_URL` wird automatisch gesetzt. Dann `db/schema.sql` im Neon-SQL-Editor ausführen.
3. **Resend**: Konto anlegen, Domain `jara-pharmacy.com` verifizieren
   (DNS-Einträge beim Domain-Anbieter), API-Key erzeugen.
4. **Umgebungsvariablen** im Vercel-Projekt (Settings → Environment Variables):

   | Variable | Preview (Branch) | Production (main) |
   |---|---|---|
   | `DATABASE_URL` | von Neon | von Neon |
   | `RAIACCEPT_MODE` | `sandbox` | `production` |
   | `RAIACCEPT_USERNAME` / `RAIACCEPT_PASSWORD` | Sandbox-Credentials | Produktions-Credentials |
   | `RESEND_API_KEY` | Key | Key |
   | `ORDER_NOTIFY_EMAIL` | Testadresse | `jarapharm@gmail.com` |
   | `ORDER_MAIL_FROM` | `Jara Pharmacy <porosite@jara-pharmacy.com>` | gleich |
   | `SITE_URL` | leer (Vercel-URL wird genommen) | leer (fällt auf `https://jara-pharmacy.com`) |

   **Deployment Protection:** Vercel schützt Vorschau-Deployments standardmäßig
   mit Login. Für den Sandbox-Test muss die Preview-URL **öffentlich** sein —
   sonst erreicht weder der RaiAccept-Webhook noch der Prüfer der Bank die
   Seite. Vercel → Project → Settings → *Deployment Protection* → für Preview
   ausschalten (oder einen *Shareable Link* erzeugen und diesen der Bank geben).
   Nach dem Test wieder einschalten.

5. **Echte Preise** in `src/data/prices.ts`, echte **Lieferkosten** in
   `src/data/shipping.ts`, **Rechtstexte** freigeben (`src/data/legal.ts`).
6. **Kurier** für Kosovo-weite Lieferung festlegen; Ablauf in der Apotheke
   (E-Mail → packen → Kassenbon/kupon fiskal → Kurier/Abholung). Ob und wie
   Online-Verkäufe fiskalisiert werden, mit Buchhaltung/ATK klären.
7. **Sandbox-Testkauf** auf der Preview-URL des Branches: Erfolg, Ablehnung,
   Abbruch, „Provo përsëri“, Webhook-Eingang (Vercel → Logs).
8. Merge nach `main` per `/deploy`. Danach ein echter Kauf mit einer echten
   Karte und sofortiger Refund im Händlerportal.

## Preise pflegen (Apotheke)

`src/data/prices.ts` — eine Zeile pro Produkt:

```ts
"shemo-3093": { name: "Labello SPF 15 Hydro Care 4.8g", price: 2.6 },
"shemo-7367": { name: "Collagen Beauty 20eff", price: 14.9, oldPrice: 17.9 }, // Angebot
```

Zeile löschen = Produkt ist wieder „nur auf Anfrage“. Die ID ist die aus
`src/data/imported/shemo-products.json` bzw. `src/data/products.ts`.

## Später (nicht Teil dieses Stands)

- Admin-Seite für Bestellungen (Liste, Status „gepackt / geliefert“, Login).
- Lagerbestand / Verfügbarkeit.
- Preise automatisch aus dem ALBTRIX-Katalog, sobald der neue Katalog auf der
  Seite ist (`scripts/catalog/`).
