# SitzplanPro: Prompts für den base44-Builder

So gehst du vor:

1. **Vorher sichern.** In base44 eine Kopie der App anlegen (Duplicate) oder den aktuellen Stand als Version markieren.
2. **Ein Prompt pro Durchgang.** Prompt einfügen, base44 arbeiten lassen, danach die Checkliste unter dem Prompt durchgehen.
3. **Erst testen, dann den nächsten Prompt.** Wenn etwas nicht klappt, schreib base44 genau, welcher Punkt der Checkliste fehlschlägt.

Reihenfolge nach Dringlichkeit. Prompt 1 und 2 sind wichtig, weil es um Schülerdaten geht. Die anderen kannst du nach und nach machen.

---

## Prompt 1: Feedback-Daten absichern (dringend)

```
Sicherheitsproblem bei den Schüler-Feedbacks. Bitte beheben, ohne die Funktion für Lehrkräfte oder Schüler zu verändern.

Aktuell hat die Entity FeedbackMessage die RLS-Regeln create/read/update/delete = true. Damit kann jede Person alle Feedbacks aller Klassen lesen, ändern und löschen, inklusive Schülernamen. Auch FeedbackSession hat read = true, dadurch sind alle KI-Zusammenfassungen öffentlich lesbar.

Ziel:
1. Schüler auf der öffentlichen Seite /feedback/:classId dürfen ohne Login weiterhin genau zwei Dinge:
   a) die aktive Leitfrage und die Anonymitäts-Einstellung der aktiven Session dieser Klasse sehen (keine anderen Felder, keine Zusammenfassung, keine fremden Sessions)
   b) eine neue Nachricht zu dieser aktiven Session absenden
2. Schüler dürfen Feedbacks NICHT lesen, ändern oder löschen, auch ihre eigenen nicht.
3. Nur die Lehrkraft, die die FeedbackSession erstellt hat, darf die Nachrichten dieser Session lesen, ausblenden (isHidden) und löschen.
4. Nachrichten zu geschlossenen Sessions werden abgelehnt.
5. Länge begrenzen: Name max. 60 Zeichen, Text max. 2000 Zeichen.

Umsetzungsvorschlag: Für die Schülerseite zwei Backend-Funktionen ohne Login (getActiveFeedbackQuestion, submitFeedback), die serverseitig prüfen und nur die nötigen Felder zurückgeben. Bei FeedbackMessage ein Feld ownerEmail ergänzen, das submitFeedback serverseitig aus created_by der Session setzt. RLS dann: FeedbackMessage read/update/delete nur wenn ownerEmail = {{user.email}}, create nur über die Backend-Funktion. FeedbackSession read nur für created_by = {{user.email}}.

Bestehende Nachrichten: ownerEmail einmalig aus der zugehörigen Session nachtragen.
```

**Checkliste danach**
- [ ] Im Inkognito-Fenster `/feedback/<Klassen-ID>` öffnen: Leitfrage erscheint, Absenden klappt.
- [ ] Mit einem zweiten Lehrkraft-Konto einloggen: Die Feedbacks des ersten Kontos sind **nicht** sichtbar.
- [ ] Als Lehrkraft: eigene Feedbacks lesen, ausblenden, löschen klappt wie vorher.
- [ ] Session schliessen, dann Schülerseite neu laden: kein Absenden mehr möglich.

---

## Prompt 2: Alle anderen Daten nur für die Besitzerin oder den Besitzer

```
Bitte für folgende Entities serverseitige RLS-Regeln setzen, damit jede Lehrkraft nur ihre eigenen Daten sieht und bearbeiten kann:
SchoolClass, RoomLayout, SeatingPlan, TallyEntry, QRCodeEntry, AppSettings.

Regel für alle sechs: create, read, update, delete nur wenn created_by = {{user.email}}.

Hintergrund: Im Code wird zwar meist nach created_by gefiltert, aber nur im Browser. SeatingPlan wird sogar nur nach classId und layoutId gefiltert, ohne Besitzer-Prüfung. Ein Filter im Frontend ist kein Schutz.

Zusätzlich im Code:
- In Dashboard.jsx die SeatingPlan-Abfrage um created_by: currentUser.email ergänzen.
- Keine Funktion darf sich verändern. Bestehende Daten müssen für ihre Besitzer sichtbar bleiben.
```

**Checkliste danach**
- [ ] Mit deinem Konto: Klassen, Räume, Sitzpläne, Strichliste, QR-Codes sind alle noch da.
- [ ] Mit einem frischen Testkonto: alles leer, keine fremden Daten.

---

## Prompt 3: Safe Exam Browser ohne Standard-Passwort

```
Im SEBGenerator ist das Admin- und Quit-Passwort mit "Learn2quit!" vorbelegt. Dieses Passwort steht im Quellcode und ist damit allen bekannt, die die App nutzen.

Bitte:
1. Beide Passwortfelder leer starten lassen. Generieren erst möglich, wenn beide Felder mindestens 8 Zeichen haben.
2. Ein Hinweis unter den Feldern: "Wähle ein eigenes Passwort. Teile es nicht mit Schülerinnen und Schülern."
3. Optional ein Häkchen "Passwort für dieses Gerät merken" (localStorage), standardmässig aus.
4. Die hochgeladene .seb-Datei bleibt nötig für den QR-Code. Bitte einen Hinweis ergänzen, dass jede Person mit dem Link die Datei herunterladen kann, und dass das Passwort nur als Hash (SHA-256) drin steht.
```

**Checkliste danach**
- [ ] SEB-Fenster öffnen: Felder sind leer.
- [ ] Generieren mit kurzem Passwort ist gesperrt.
- [ ] Erzeugte Datei in Safe Exam Browser öffnen: Beenden mit deinem neuen Passwort klappt.

---

## Prompt 4: Keine Schülernamen an die KI

```
In FeedbackOverlay.jsx (handleEvaluate) werden für die KI-Zusammenfassung die Schülernamen mitgeschickt ("Name: Text"). Das ist für die Zusammenfassung nicht nötig und aus Datenschutzgründen nicht gewünscht.

Bitte:
1. Nur die Texte schicken, nummeriert ("Antwort 1: ...", "Antwort 2: ..."), ohne Namen.
2. Im Prompt an die KI ergänzen: "Nenne keine Namen von Personen, auch wenn sie in den Antworten vorkommen."
3. Vor dem Auswerten einen kurzen Bestätigungsdialog: "Die Antworten werden ohne Namen an einen KI-Dienst geschickt. Fortfahren?"
```

**Checkliste danach**
- [ ] Testsession mit Namen ausfüllen, auswerten: Zusammenfassung enthält keine Namen.

---

## Prompt 5: Export aller eigenen Daten (Backup)

Diesen Prompt brauchst du auch für die spätere Portierung: Damit kannst du deine Daten jederzeit sichern.

```
Bitte im Dashboard einen Button "Meine Daten exportieren" ergänzen (z.B. im Benutzermenü oder neben dem Changelog).

Er lädt eine JSON-Datei herunter mit allen Datensätzen der eingeloggten Lehrkraft aus diesen Entities:
SchoolClass, RoomLayout, SeatingPlan, TallyEntry, QRCodeEntry, AppSettings, FeedbackSession, FeedbackMessage (nur Nachrichten zu eigenen Sessions).

Format:
{
  "exportVersion": 1,
  "exportedAt": "<ISO-Datum>",
  "userEmail": "<E-Mail>",
  "appVersion": "<APP_VERSION>",
  "entities": { "SchoolClass": [...], "RoomLayout": [...], ... }
}

Alle Felder unverändert übernehmen, inklusive id, created_date, updated_date und created_by.
Dateiname: sitzplanpro-export-<JJJJ-MM-TT>.json
```

**Checkliste danach**
- [ ] Datei herunterladen und in einem Texteditor öffnen: deine Klassen und Räume sind drin.
- [ ] Mit Testkonto exportieren: nur dessen Daten, keine fremden.

---

## Prompt 6: Aufräumen (optional, eher für später)

```
Bitte technisch aufräumen, ohne sichtbare Änderungen für Nutzende:
1. Es gibt seatingUtils doppelt (src/lib/seatingUtils.js und src/components/seatingUtils.jsx). Bitte auf eine Datei zusammenführen und alle Imports anpassen.
2. Prüfen, welche npm-Pakete im Code nie importiert werden (z.B. three, react-leaflet, @stripe/*, react-quill, moment), und diese aus package.json entfernen, sofern base44 sie nicht selbst benötigt.
3. Strichliste: Lernende werden über "Vorname_Nachname_Geschlecht" identifiziert. Bei gleichen Namen in verschiedenen Klassen werden Striche vermischt. Bitte nur dann zusammenführen, wenn die Lehrkraft es bestätigt, oder stabile Schüler-IDs verwenden.
```

---

## Wenn base44 etwas kaputt macht

```
Die letzte Änderung hat folgendes kaputt gemacht: <genau beschreiben, was du klickst und was passiert>. Bitte nur diesen Fehler beheben und sonst nichts verändern.
```
