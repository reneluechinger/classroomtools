# Classroom Tools einrichten

Diese Anleitung machst du **einmal**. Danach läuft die App von selbst: Jede Änderung im Code wird automatisch veröffentlicht.

Zeitbedarf: etwa 30 Minuten.

Am Ende hast du:

- die App unter **https://reneluechinger.github.io/classroomtools/**
- eine eigene Datenbank mit Login per E-Mail-Link
- den Mailversand über dein Gmail-Konto

Ein Bild dazu: **GitHub** ist das Schaufenster, dort steht die App. **Supabase** ist das Lager dahinter, dort liegen die Daten und die Logins. **Gmail** ist der Briefträger für die Anmelde-Mails.

---

## Teil A: Supabase (Datenbank und Login)

### 1. Konto und Projekt anlegen

1. Öffne [supabase.com](https://supabase.com) und klicke auf **Start your project**.
2. Melde dich mit **Continue with GitHub** an. Dann hast du kein weiteres Passwort.
3. Klicke auf **New project**.
   - **Name:** `classroomtools`
   - **Database Password:** Klicke auf **Generate a password** und speichere es in deinem Passwort-Manager. Du brauchst es im Alltag nicht.
   - **Region:** eine Region in Europa, z.B. *Central EU (Frankfurt)* oder *Zurich*, falls angeboten
   - **Plan:** Free
4. Klicke auf **Create new project** und warte etwa 2 Minuten.

### 2. Datenbank-Tabellen anlegen

1. Links im Menü: **SQL Editor**.
2. Klicke auf **New query**.
3. Öffne im GitHub-Repo die Datei `supabase/schema.sql`, kopiere den ganzen Inhalt und füge ihn ein.
4. Klicke unten rechts auf **Run**. Es erscheint *Success. No rows returned*.

Damit ist die Datenbank fertig. Jede Lehrkraft sieht nur ihre eigenen Daten, das regelt die Datenbank selbst.

### 3. Adresse der App eintragen

1. Links: **Authentication** → **URL Configuration**.
2. **Site URL:** `https://reneluechinger.github.io/classroomtools/`
3. Bei **Redirect URLs** auf **Add URL** klicken und eintragen:
   - `https://reneluechinger.github.io/classroomtools/**`
   - `http://localhost:5173/**` (nur zum Testen auf dem eigenen Computer)
4. **Save**.

### 4. Mailversand über Gmail einrichten

**Warum?** Supabase verschickt von sich aus Mails nur an Mitglieder deines Supabase-Teams und höchstens 2 pro Stunde. Für 20 Lehrkräfte reicht das nicht. Mit einem eigenen Mailversand steigt die Grenze auf 30 Mails pro Stunde, und du kannst sie bei Bedarf anheben.
Quelle: [Supabase Docs, «Send emails with custom SMTP»](https://supabase.com/docs/guides/auth/auth-smtp)

**a) App-Passwort bei Google erstellen**

1. Öffne [myaccount.google.com/security](https://myaccount.google.com/security).
2. Prüfe, ob die **Bestätigung in zwei Schritten** aktiv ist. Ohne sie gibt es keine App-Passwörter.
3. Öffne [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).
4. Name: `Classroom Tools`, dann **Erstellen**.
5. Kopiere das 16-stellige Passwort. Es wird nur einmal angezeigt.

**b) In Supabase eintragen**

1. Links: **Authentication** → **Emails** → Tab **SMTP Settings**.
2. **Enable Custom SMTP** einschalten.
3. Ausfüllen:

| Feld | Wert |
|---|---|
| Sender email | deine Gmail-Adresse |
| Sender name | `Classroom Tools` |
| Host | `smtp.gmail.com` |
| Port number | `465` |
| Username | deine Gmail-Adresse |
| Password | das 16-stellige App-Passwort (ohne Leerzeichen) |

4. **Save changes**.

### 5. E-Mail-Texte auf Deutsch und mit Code

So können sich Lehrkräfte auch anmelden, wenn sie die Mail auf dem Handy lesen und die App am Schulcomputer offen haben. Sie tippen dann einfach den Code ab.

1. Links: **Authentication** → **Emails** → Tab **Templates**.
2. Wähle **Magic Link**.
   - **Subject:** `Dein Anmeldelink für Classroom Tools`
   - **Body:** alles löschen und das hier einfügen:

```html
<h2>Anmelden bei Classroom Tools</h2>
<p>Klicke auf den Link, um dich anzumelden:</p>
<p><a href="{{ .ConfirmationURL }}">Jetzt anmelden</a></p>
<p>Oder tippe diesen Code in der App ein:</p>
<p style="font-size:28px;font-weight:bold;letter-spacing:6px">{{ .Token }}</p>
<p style="color:#888">Der Link und der Code gelten eine Stunde. Wenn du dich nicht anmelden wolltest, kannst du diese Mail ignorieren.</p>
```

3. **Save changes**.
4. Wähle **Confirm signup** und mach dasselbe. Diese Mail bekommt man bei der allerersten Anmeldung.
   - **Subject:** `Willkommen bei Classroom Tools`
   - **Body:** derselbe Text wie oben

### 6. Die zwei Schlüssel kopieren

1. Links unten: **Project Settings** (Zahnrad) → **API Keys** (bei älteren Projekten: **API**).
2. Notiere dir:
   - **Project URL**, z.B. `https://abcdefgh.supabase.co` (steht unter **Data API** oder oben auf der Seite)
   - **Publishable key** bzw. **anon public**: der lange Schlüssel

Beide dürfen öffentlich sein. Den **secret** bzw. **service_role**-Schlüssel gibst du **nie** weiter.

---

## Teil B: GitHub (Veröffentlichung)

### 7. Schlüssel bei GitHub hinterlegen

1. Öffne [github.com/reneluechinger/classroomtools/settings/secrets/actions](https://github.com/reneluechinger/classroomtools/settings/secrets/actions).
2. **New repository secret**:
   - Name: `VITE_SUPABASE_URL`, Secret: die Project URL
3. Nochmals **New repository secret**:
   - Name: `VITE_SUPABASE_ANON_KEY`, Secret: der Publishable bzw. anon key

### 8. GitHub Pages einschalten

1. Öffne [github.com/reneluechinger/classroomtools/settings/pages](https://github.com/reneluechinger/classroomtools/settings/pages).
2. Bei **Source**: **GitHub Actions** wählen.

### 9. Veröffentlichen

Die App wird bei jeder Änderung auf dem Branch `main` automatisch gebaut und veröffentlicht. Den Fortschritt siehst du unter [Actions](https://github.com/reneluechinger/classroomtools/actions). Nach etwa 2 Minuten ist die App online.

---

## Teil C: Testen

1. Öffne **https://reneluechinger.github.io/classroomtools/**
2. Gib deine E-Mail ein, klicke auf **Anmeldelink senden**.
3. Öffne die Mail und klicke auf den Link, oder tippe den Code ein.
4. Oben rechts im Benutzermenü: **Daten aus base44 übernehmen**. Folge den drei Schritten.

Wenn das klappt, schick deinen Kolleginnen und Kollegen den Link. Jede Person meldet sich an und übernimmt ihre Daten selbst über dasselbe Menü.

---

## Gut zu wissen

- **Ferien:** Gratis-Projekte bei Supabase pausieren nach 7 Tagen ohne Nutzung. Die GitHub Action «Supabase wachhalten» ruft die Datenbank deshalb alle 3 Tage kurz auf. Falls das Projekt trotzdem pausiert: im Supabase-Dashboard auf **Resume project** klicken. Die Daten bleiben erhalten.
  Quelle: [Supabase Docs, «Project Pausing»](https://supabase.com/docs/guides/platform/free-project-pausing)
- **GitHub pausiert geplante Actions**, wenn im Repo 60 Tage lang nichts passiert. Du bekommst dann eine Mail von GitHub und kannst sie mit einem Klick wieder einschalten.
- **Backup:** Jede Lehrkraft kann im Benutzermenü ein Backup ihrer Daten herunterladen und es über dieselbe Import-Seite wieder einspielen.
- **Die alte base44-App** läuft unabhängig weiter. Änderungen dort landen nicht automatisch in der neuen App. Ein erneuter Import überschreibt die Daten mit dem Stand aus base44, ohne etwas zu verdoppeln.

## Probleme?

| Problem | Lösung |
|---|---|
| «Supabase ist noch nicht verbunden» | Schritt 7 prüfen: Namen der Secrets genau so schreiben. Danach unter Actions den letzten Lauf mit **Re-run all jobs** neu starten. |
| Keine Anmelde-Mail | Spam-Ordner prüfen. In Supabase unter **Authentication → Logs** nachsehen. Meist ist das Gmail-App-Passwort falsch. |
| «Zu viele Versuche» | Supabase begrenzt die Anzahl Mails pro Stunde. Unter **Authentication → Rate Limits** lässt sich das anheben. |
| Link aus der Mail öffnet eine leere Seite | Schritt 3 prüfen: Site URL und Redirect URLs. |
| Export-Lesezeichen meldet einen Fehler | In der base44-App eingeloggt sein und das Lesezeichen auf der App selbst klicken, nicht im base44-Editor. |
