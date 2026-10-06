# Classroom Tools einrichten

Diese Anleitung machst du **einmal**. Danach läuft die App von selbst: Jede Änderung im Code wird automatisch veröffentlicht.

Zeitbedarf: etwa 15 Minuten.

Am Ende hast du:

- die App unter **https://reneluechinger.github.io/classroomtools/**
- eine eigene Datenbank, auf die nur du Zugriff hast
- eine Anmeldung, die du pro Gerät nur einmal machst

Ein Bild dazu: **GitHub** ist das Schaufenster, dort steht die App. **Supabase** ist das abgeschlossene Lager dahinter, dort liegen deine Daten. Den Schlüssel zum Lager hast nur du.

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

> **Fehler «FGA Authentication Error. Unauthorized»?** Das meldet das Supabase-Dashboard, nicht das SQL. Meist ist die Anmeldung im Dashboard abgelaufen. Seite neu laden (oder bei Supabase ab- und wieder anmelden) und nochmals **Run** klicken. Das Skript darf mehrfach laufen.

Damit ist die Datenbank fertig. Jede Lehrkraft sieht nur ihre eigenen Daten, das regelt die Datenbank selbst.

### 3. Dein Konto anlegen

1. Links: **Authentication** → **Users**.
2. Oben rechts **Add user** → **Create new user**.
3. Deine E-Mail-Adresse und ein Passwort eingeben. **Auto Confirm User** angehakt lassen.
4. **Create user**.

Mit diesen Daten meldest du dich in der App an, auf jedem Gerät genau einmal.

### 4. Registrierung sperren

Damit sich niemand sonst ein Konto anlegen kann:

1. Links: **Authentication** → **Sign In / Providers** (bei älteren Projekten: **Providers**).
2. **Allow new users to sign up** ausschalten.
3. **Save**.

Später, wenn Kolleginnen und Kollegen dazukommen, legst du ihre Konten genauso unter **Users** an. Jede Person sieht nur ihre eigenen Daten.

### 5. Adresse der App eintragen

1. Links: **Authentication** → **URL Configuration**.
2. **Site URL:** `https://reneluechinger.github.io/classroomtools/`
3. **Save**.

### 6. Die zwei Schlüssel kopieren

1. Links unten: **Project Settings** (Zahnrad) → **API Keys** (bei älteren Projekten: **API**).
2. Notiere dir:
   - **Project URL**, z.B. `https://abcdefgh.supabase.co` (steht unter **Data API** oder oben auf der Seite)
   - **Publishable key** bzw. **anon public**: der lange Schlüssel

Beide dürfen öffentlich sein. Den **secret** bzw. **service_role**-Schlüssel gibst du **nie** weiter.

---

## Teil B: GitHub (Veröffentlichung)

### 7. Schlüssel eintragen

Die Project URL und der Publishable key stehen in der Datei `.env.production` im Repo. Beide sind öffentlich gedacht, den Schutz übernehmen die Zugriffsregeln der Datenbank. Bei einem neuen Supabase-Projekt dort die Werte ersetzen.

### 8. GitHub Pages einschalten

1. Öffne [github.com/reneluechinger/classroomtools/settings/pages](https://github.com/reneluechinger/classroomtools/settings/pages).
2. Bei **Source**: **GitHub Actions** wählen. (Der erste Deploy versucht das selbst einzuschalten.)

### 9. Veröffentlichen

Die App wird bei jeder Änderung auf dem Branch `main` automatisch gebaut und veröffentlicht. Den Fortschritt siehst du unter [Actions](https://github.com/reneluechinger/classroomtools/actions). Nach etwa 2 Minuten ist die App online.

---

## Teil C: Testen

1. Öffne **https://reneluechinger.github.io/classroomtools/**
2. Melde dich mit E-Mail und Passwort aus Schritt 3 an.
3. Oben rechts im Benutzermenü: **Daten aus base44 übernehmen**. Folge den drei Schritten.
4. Auf dem zweiten Gerät (z.B. Schul-PC) einmal anmelden. Die Daten sind dort automatisch auch.

---

## Gut zu wissen

- **Ferien:** Gratis-Projekte bei Supabase pausieren nach 7 Tagen ohne Nutzung. Die GitHub Action «Supabase wachhalten» ruft die Datenbank deshalb alle 3 Tage kurz auf. Falls das Projekt trotzdem pausiert: im Supabase-Dashboard auf **Resume project** klicken. Die Daten bleiben erhalten.
  Quelle: [Supabase Docs, «Project Pausing»](https://supabase.com/docs/guides/platform/free-project-pausing)
- **GitHub pausiert geplante Actions**, wenn im Repo 60 Tage lang nichts passiert. Du bekommst dann eine Mail von GitHub und kannst sie mit einem Klick wieder einschalten.
- **Backup:** Du kannst im Benutzermenü ein Backup ihrer Daten herunterladen und es über die Import-Seite wieder einspielen.
- **Die alte base44-App** läuft unabhängig weiter. Änderungen dort landen nicht automatisch in der neuen App. Ein erneuter Import überschreibt die Daten mit dem Stand aus base44, ohne etwas zu verdoppeln.

## Probleme?

| Problem | Lösung |
|---|---|
| «Supabase ist noch nicht verbunden» | Schritt 7 prüfen: Stehen beide Werte in `.env.production`? Danach unter Actions den letzten Lauf mit **Re-run all jobs** neu starten. |
| «E-Mail oder Passwort stimmt nicht» | In Supabase unter **Authentication → Users** prüfen, ob dein Konto existiert. Dort lässt sich das Passwort auch neu setzen. |
| «FGA Authentication Error» im SQL Editor | Supabase-Dashboard neu laden oder ab- und wieder anmelden. |
| Export-Lesezeichen meldet einen Fehler | In der base44-App eingeloggt sein und das Lesezeichen auf der App selbst klicken, nicht im base44-Editor. |
