---
description: Sicherer Deploy-Ablauf für jara-pharmacy (Sync, Build-Check, Commit+Push, Live-Check)
---

Du führst den kompletten Deploy-Ablauf für **jara-pharmacy** aus. Der Maintainer
ist non-technical und kommuniziert auf Deutsch (siehe `CLAUDE.md`) — sprich
während des gesamten Ablaufs Deutsch, kurz und klar. Gehe **strikt in dieser
Reihenfolge** vor und **breche sofort ab und melde dich**, wenn ein Schritt
fehlschlägt, statt den nächsten Schritt trotzdem auszuführen.

## 1. Sauberen Stand prüfen

Führe `git status` aus. Falls es uncommitted Änderungen gibt, die erkennbar
nicht zum aktuellen Deploy gehören (z. B. halbfertige, unzusammenhängende
Arbeit), informiere den Maintainer kurz und frag nach, wie damit umgegangen
werden soll — überschreibe oder stashe nichts ohne Rückfrage.

## 2. Mit GitHub synchronisieren

Führe aus:
```
git fetch origin main
git rebase origin/main
```
(Bewusst `fetch` + `rebase`, nicht `git pull` — beides ist bereits erlaubt.)

Falls der Rebase Konflikte meldet: **stoppen**, die betroffenen Dateien
auflisten und dem Maintainer auf Deutsch erklären, dass hier manuell
entschieden werden muss. Nichts automatisch auflösen.

## 3. Build-Check (Vercel-Build lokal nachstellen)

Führe `npm run build` aus (das ist exakt `tsc --noEmit && vite build`, also
das, was Vercel beim echten Deploy laufen lässt — nicht nur `npm run lint`).

Falls der Build fehlschlägt: **stoppen**, die Fehlermeldung verständlich und
kurz auf Deutsch zusammenfassen (die wichtigsten 1-3 Fehler, keine Rohdumps),
und explizit sagen, dass **nicht** committed/gepusht wurde, damit kein
kaputter Build live geht.

## 4. Commit vorbereiten

Prüfe mit `git status` / `git diff --stat`, ob es überhaupt etwas zu committen
gibt (nach dem Rebase in Schritt 2 kann der Stand bereits aktuell sein).

- **Nichts zu committen:** Schritt überspringen, das dem Maintainer kurz
  mitteilen, direkt weiter zu Schritt 5 (Live-Check), falls in Schritt 2 neue
  Commits vom anderen PC reingekommen sind — sonst ist der Ablauf hier fertig
  und Schritt 5 kann als reine Bestätigung dienen, dass die Seite läuft.
- **Änderungen vorhanden:** Schlage eine kurze, prägnante Commit-Message im
  bestehenden Stil vor (Imperativ, User-sichtbare Änderung beschreiben — siehe
  `git log`). Zeige dem Maintainer knapp: welche Dateien, welche Commit-Message.
  **Warte auf ein kurzes OK**, bevor du weitermachst. Nach dem OK:
  ```
  git add <relevante Dateien>
  git commit -m "..."
  git push
  ```

## 5. Deploy verifizieren

Nach dem Push (oder falls in Schritt 4 neue Commits vom anderen PC übernommen
wurden):

- Prüfe per `ToolSearch` (Query z. B. "vercel deployment"), ob in dieser
  Session eine Vercel-MCP verbunden ist. Falls ja: nutze sie, um den Status
  des neuesten Deployments zu prüfen (Projekt finden, dann
  Deployment-Status abfragen), und poll kurz bis `READY` oder
  `ERROR`/fehlgeschlagen — das zeigt den echten Vercel-Build-Status, nicht
  nur ob irgendeine Seite lädt. Falls die Vercel-MCP in dieser Session nicht
  verbunden ist, überspringe diesen Teilschritt einfach (kein Fehler, keine
  Rückfrage) und verlass dich auf den WebFetch-Check darunter.
- Bestätige in jedem Fall zusätzlich per Aufruf von **`https://jara-pharmacy.com`**
  (der Live-Domain), dass die Seite tatsächlich lädt. Die `*.vercel.app`-Adressen
  sind nur Aliase desselben Deployments — nimm die echte Domain.
  **Achte auf den Bindestrich:** `jarapharmacy.com` ohne ihn gehört **nicht
  uns** — die Domain ist fremd und leitet auf `shemofarm.com` weiter.
- Falls das Deployment fehlschlägt oder die Seite nicht erreichbar ist: das
  klar auf Deutsch melden, mit den wichtigsten Fehlerdetails.

## 6. Zusammenfassung

Fasse am Ende in 2-4 kurzen Sätzen auf Deutsch zusammen: was gepusht wurde
(oder dass nichts zu pushen war), ob der Build sauber war, ob die Live-Seite
jetzt läuft, und der Link `https://jara-pharmacy.com`.
