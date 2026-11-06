# Classroom Tools für base44: Design + Warteschlange + Lektion

Dieses Paket bringt den Stand der GitHub-Version (v3.3) in deine base44-App:

- **iOS-Design:** Farben, Systemschrift, Glas-Kopfzeile, Klasse/Zimmer als Menüs, Segmented Control, Dock mit Icon-Kacheln, Listen im iOS-Stil, neue Tür, Präsentieren-Modus
- **Warteschlange:** QR-Code, Lernende stellen sich am Handy an, du hakst ab
- **Lektionsplanung:** Reiter «Lektion», Rohnotizen formatieren, für OneNote kopieren
- **Sitzpläne anheften und beschriften**, **iOS-Timer**, **sanfte Klangschale** statt Hotelglocke

Getestet habe ich das Paket mit einer nachgebauten base44-Schnittstelle (Build und Browser).
In einer echten base44-App lief es noch nicht. Rechne mit kleinen Nacharbeiten durch den base44-Builder.

## Inhalt

Die Ordner bilden die Struktur deines base44-Projekts ab. Jede Datei gehört an denselben Pfad.

| Ordner/Datei | Was |
|---|---|
| `src/index.css`, `tailwind.config.js` | Farben, Schrift, Rundungen (Grundlage des Designs) |
| `src/components/ui/*` | Buttons, Felder, Dialoge, Menüs, Schalter im iOS-Stil (ersetzen die bestehenden) |
| `src/components/ios.jsx`, `ToolDock.jsx`, `UserMenu.jsx`, `QuickGuide.jsx` | Neue Bausteine |
| `src/components/seating/*` | Alle Sitzplan-Bausteine im neuen Design, inkl. Warteschlange und Timer |
| `src/components/lesson/LessonPlanner.jsx` | Lektionsplanung |
| `src/lib/seating.js`, `bell.js`, `lessonFormat.js` | Sitzplan-Logik, Klang, Notiz-Erkennung |
| `src/api/db.js`, `src/api/storage.js` | **Verbindungsstück zu base44** (neu). Die Design-Dateien holen ihre Daten hierüber von base44. |
| `src/pages/Dashboard.jsx` | Hauptseite im neuen Design (ersetzt die bestehende) |
| `src/pages/QueueJoin.jsx` | Seite für die Handys der Lernenden (neu) |
| `src/App.jsx` | Mit öffentlicher Route `/warten/…`, neuen Meldungen und Icons |
| `public/icon.svg` | App-Icon |
| `base44/entities/Queue.jsonc`, `QueueEntry.jsonc` | Neue Entities für die Warteschlange |
| `base44/entities/SeatingPlan.jsonc` | Ergänzt um `pinned` und `label` (Anheften, Beschriften) |

## Vorher

**Kopie anlegen.** In base44 die App duplizieren oder den aktuellen Stand sichern. Das Paket ersetzt viele Dateien.

## Weg A: Über GitHub (empfohlen, wenn deine base44-App mit GitHub verbunden ist)

1. Zip entpacken.
2. Alle Dateien aus `base44-paket/` an dieselben Pfade in deinem base44-Repo kopieren. Bestehende Dateien überschreiben.
3. In `package.json` bei `dependencies` ergänzen:
   ```json
   "@phosphor-icons/react": "^2.1.10",
   "qrcode-generator": "^2.0.4"
   ```
4. In `index.html` im `<head>` das Favicon ersetzen:
   ```html
   <link rel="icon" type="image/svg+xml" href="/icon.svg" />
   <link rel="apple-touch-icon" href="/icon.svg" />
   ```
5. Commit und Push. Danach den **Prompt unten** in base44 einfügen, damit Entities und Berechtigungen stimmen.

## Weg B: Nur über den base44-Builder

Der Builder kann keine Zip-Datei entpacken. Gib ihm die Dateien in mehreren Nachrichten, in dieser Reihenfolge:

1. `src/index.css` und `tailwind.config.js`
2. `src/components/ui/*`
3. `src/components/ios.jsx`, `ToolDock.jsx`, `UserMenu.jsx`, `QuickGuide.jsx`, `src/lib/*`, `src/api/*`
4. `src/components/seating/*` (in zwei bis drei Nachrichten)
5. `src/components/lesson/LessonPlanner.jsx`, `src/pages/*`, `src/App.jsx`
6. Zum Schluss den Prompt unten

Schreib jeweils dazu: «Bitte diese Dateien genau so übernehmen (Dateiname steht jeweils darüber). Noch nichts anderes ändern.»

## Prompt für base44

```
Ich habe neue Dateien für Design, Warteschlange und Lektionsplanung eingefügt. Bitte jetzt:

1. npm-Pakete hinzufügen, falls nicht vorhanden: @phosphor-icons/react, qrcode-generator.

2. Entities anlegen bzw. ergänzen wie in base44/entities/:
   - Queue (neu), QueueEntry (neu)
   - SeatingPlan: neue Felder pinned (boolean) und label (string)

3. Berechtigungen so einstellen:
   - Queue: nur wer sie erstellt hat, darf erstellen/ändern/löschen. Lesen darf jede Person.
   - QueueEntry: jede Person darf erstellen und lesen (Lernende ohne Login).
     Ändern und löschen nur die Lehrkraft, deren E-Mail im Feld ownerEmail steht.
   Falls die Schreibweise in den .jsonc-Dateien nicht passt, bitte so umsetzen, dass genau dieses Verhalten entsteht.

4. Die Seite /warten/:queueId muss ohne Login erreichbar sein (wie /feedback/:classId).
   Falls die App nur für angemeldete Personen freigegeben ist, diese eine Route öffentlich machen.

5. Das App-Icon public/icon.svg als Favicon verwenden.

6. Sonst nichts verändern, besonders nicht die Dateien in src/components/seating/, src/pages/ und src/components/ui/.

Test:
- Dashboard öffnen: oben Klasse und Zimmer als Menüs, unten ein Dock mit farbigen Kacheln.
- «Neu mischen» erzeugt einen Sitzplan, rechts lässt er sich anheften.
- Dock → «Warten»: QR-Code scannen (ohne Login), Namen antippen, am Computer «Erledigt».
- Reiter «Lektion» → «Beispiel»: rechts erscheint die formatierte Lektion.
```

## Unterschiede zur GitHub-Version

- **Anmeldung** läuft wie bisher über base44. Login-Seite und Import aus base44 entfallen.
- **Warteschlange:** Lernende können sich am Handy nicht selbst austragen. Einträge sind öffentlich lesbar (nur Vorname und Initiale), sonst sehen die Lernenden ihre Position nicht. Wer den QR-Code hat, könnte sich auch unter fremdem Namen eintragen. Doppelte Einträge verhindert der Code, nicht die Datenbank.
- **Lektionsplanung:** Der Entwurf wird pro Klasse im Browser gespeichert, nicht in base44.

## Wenn etwas nicht klappt

| Problem | Lösung |
|---|---|
| Weisse Seite, Fehler «Cannot find module '@phosphor-icons/react'» | Schritt 3 (Weg A) bzw. Punkt 1 im Prompt fehlt |
| Klassen und Zimmer erscheinen nicht | `src/api/db.js` fehlt oder liegt am falschen Ort |
| Handy zeigt «Diese Warteschlange gibt es nicht» | Berechtigung Queue «Lesen für alle» fehlt, oder die Route ist nicht öffentlich |
| Anheften wird nicht gespeichert | Felder `pinned` und `label` in SeatingPlan fehlen |
| Alte Hotelglocke klingt noch | Browser-Zwischenspeicher: Seite mit Ctrl+Shift+R neu laden |
