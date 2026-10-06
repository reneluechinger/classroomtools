# Classroom Tools

Sitzplan-Generator und Unterrichtswerkzeuge für Lehrkräfte: Sitzpläne mit Regeln (trennen, zusammen, Fixplatz, gemischt), Raumlayouts, Zufallsauswahl, Gruppen, Timer, Lautstärke-Ampel, Klingel, QR-Codes, Strichliste und Safe-Exam-Browser-Dateien.

**App:** https://reneluechinger.github.io/classroomtools/

## Technik

| Teil | Lösung |
|---|---|
| Frontend | React 18, Vite, Tailwind, shadcn/ui |
| Login | Supabase Auth, E-Mail + Passwort, einmal pro Gerät (Registrierung gesperrt) |
| Daten | Supabase Postgres, eine Tabelle `records` mit JSON-Dokumenten, Row Level Security pro Konto |
| Dateien | Supabase Storage (`seb-files`) |
| Hosting | GitHub Pages, Deploy per GitHub Actions bei Push auf `main` |

Einrichtung Schritt für Schritt: [docs/EINRICHTUNG.md](docs/EINRICHTUNG.md)

## Lokal entwickeln

```bash
cp .env.example .env.local   # Supabase-URL und anon key eintragen
npm install
npm run dev                  # http://localhost:5173
npm test                     # Tests (Sitzplan-Algorithmus, Import)
npm run lint
```

## Aufbau

```
src/
  api/          supabase.js (Client), db.js (Datenschicht), storage.js
  lib/          seating.js (Sitzplan-Algorithmus), base44Export.js, importData.js
  pages/        Dashboard, Login, Import
  components/   seating/* (Werkzeuge und Dialoge), ui/* (Basis-Bausteine)
supabase/
  schema.sql    Tabellen, Zugriffsregeln, Storage, Wachhalter
```

## Herkunft

Ursprünglich mit base44 gebaut (v2.1.0) und in v3.0.0 auf Supabase und GitHub Pages umgezogen. Die Import-Seite in der App übernimmt die Daten aus base44.
