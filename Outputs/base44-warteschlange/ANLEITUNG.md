# Warteschlange für base44

Angepasst an die base44-Version von Classroom Tools (SitzplanPro). Die Funktion entspricht der GitHub-Version:
Lernende scannen einen QR-Code, tippen ihren Namen an und sehen auf dem Handy, wann sie dran sind.
Die Lehrperson sieht «Jetzt dran», die Reihe und hakt ab.

## Dateien

| Datei | Ziel in base44 |
|---|---|
| `entities/Queue.jsonc` | `base44/entities/Queue.jsonc` |
| `entities/QueueEntry.jsonc` | `base44/entities/QueueEntry.jsonc` |
| `components/seating/QueueOverlay.jsx` | `src/components/seating/QueueOverlay.jsx` |
| `pages/QueueJoin.jsx` | `src/pages/QueueJoin.jsx` |

## Weg A: Über GitHub (wenn deine base44-App mit GitHub verbunden ist)

1. Die vier Dateien an die Zielorte in deinem base44-Repo legen und pushen.
2. Danach den Prompt unten in base44 einfügen, damit Route, Button und Berechtigungen dazukommen.

## Weg B: Nur über den base44-Builder

Den Prompt unten in base44 einfügen und **den Inhalt der vier Dateien direkt darunter anhängen**
(jeweils mit Dateinamen als Überschrift).

## Prompt für base44

```
Bitte baue eine Warteschlange ein. Ich liefere dir den fertigen Code (Dateien unten bzw. bereits im Repo).

1. Entities anlegen (falls noch nicht vorhanden) genau wie in Queue.jsonc und QueueEntry.jsonc.

2. Datei src/components/seating/QueueOverlay.jsx und src/pages/QueueJoin.jsx unverändert übernehmen.

3. Route: In App.jsx eine öffentliche Route ohne Login ergänzen, genau wie die bestehende /feedback/:classId:
   <Route path="/warten/:queueId" element={<QueueJoin />} />
   Sie muss ausserhalb von AuthenticatedApp liegen, damit Lernende ohne Konto darauf kommen.

4. Button: In Dashboard.jsx in der Werkzeugleiste (bei Zufall, Timer, QR-Code …) einen Button «🙋 Warten» ergänzen.
   Deaktiviert, wenn keine Klasse mit Lernenden gewählt ist. Er öffnet:
   {showQueue && selectedClass && (
     <QueueOverlay schoolClass={selectedClass} currentUser={currentUser} onClose={() => setShowQueue(false)} />
   )}

5. Berechtigungen prüfen und so einstellen, dass:
   - Queue: nur die Lehrkraft, die sie erstellt hat, darf erstellen/ändern/löschen. Lesen darf jede Person (die Schülerseite braucht Klassenname und Namensliste).
   - QueueEntry: jede Person darf neue Einträge erstellen und lesen (Lernende ohne Login stellen sich an und sehen ihre Position).
     Ändern und löschen darf nur die Lehrkraft, deren E-Mail im Feld ownerEmail steht.
   Falls die RLS-Schreibweise in den .jsonc-Dateien für ownerEmail nicht passt, bitte so umsetzen, dass genau dieses Verhalten entsteht.

6. Nichts anderes an der App verändern.

Test: Als Lehrkraft «Warten» öffnen, QR-Code mit dem Handy scannen (ohne Login), Namen antippen.
Am Computer erscheint der Name unter «Jetzt dran», auf dem Handy «Du bist dran!». «Erledigt» klicken: Handy zeigt «Erledigt».
```

## Unterschiede zur GitHub-Version

- **Kein «Austragen» für Lernende.** In base44 lässt sich ohne Login nicht sicher erkennen, wem ein Eintrag gehört. Wer sich falsch eingetragen hat, sagt es der Lehrperson, sie entfernt den Eintrag mit ×.
- **Datenschutz:** Damit die Position ohne Login funktioniert, ist `QueueEntry` für alle lesbar. Sichtbar sind nur Vorname, Initiale und Zeitpunkt. Wer die Adresse einer Warteschlange kennt, könnte sich auch unter fremdem Namen eintragen. In der GitHub-Version ist das über Datenbank-Funktionen enger abgesichert.
- **Doppelt anstellen** wird im Code verhindert, nicht in der Datenbank. Tippen zwei Handys im selben Moment denselben Namen, kann er ausnahmsweise doppelt erscheinen. Die Lehrperson entfernt ihn dann mit ×.
