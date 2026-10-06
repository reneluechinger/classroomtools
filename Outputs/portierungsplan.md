# SitzplanPro: Plan für die spätere Portierung

Stand: 06.10.2026. Grundlage: base44-Export (App "SitzplanPro", Version 2.1.0).

## Getroffene Entscheidungen

- **Vorgehen**: Zuerst base44 absichern (siehe `base44-prompts.md`), danach portieren.
- **Login**: Magic Link per E-Mail (kein Passwort).
- **Zugang**: Offene Registrierung, jede Person kann ein Konto anlegen. Daten sind pro Konto getrennt.
- **KI-Zusammenfassung**: Claude API über eigenen API-Key, Schülernamen werden vorher entfernt.

## Ziel-Architektur

| Teil | Lösung |
|---|---|
| Frontend | Bestehender React/Vite-Code, Hosting auf GitHub Pages |
| Login | Supabase Auth, Magic Link |
| Datenbank | Supabase Postgres, EU-Region, Row Level Security pro Lehrkraft |
| Dateien (SEB) | Supabase Storage |
| KI | Supabase Edge Function ruft Claude API auf, API-Key bleibt auf dem Server |
| Deployment | GitHub Actions baut bei jedem Push auf `main` |

## Was ersetzt werden muss

Base44 ist an rund 30 Stellen angebunden:

- `src/api/base44Client.js`, `src/lib/AuthContext.jsx`, `src/lib/app-params.js` → Supabase-Client und neuer Auth-Context
- `base44.entities.X.filter/create/update/delete` → dünne Datenschicht mit gleicher Schnittstelle, damit die Komponenten kaum angepasst werden müssen
- `base44.integrations.Core.InvokeLLM` → Edge Function `summarize-feedback`
- `base44.integrations.Core.UploadFile` → Supabase Storage
- `OAuthConsent.jsx` (MCP-Server von base44) → entfällt

## Import-Tool

Zwei Wege, beide werden gebaut:

1. **JSON-Datei** aus dem Export-Button (base44-Prompt 5) im neuen System hochladen. Einfachster Weg.
2. **Direktimport mit Token**: Du bist bei base44 eingeloggt, kopierst das Access-Token aus dem Browser (Entwicklertools → Local Storage → `base44_access_token`), fügst es im Import-Tool ein. Das Tool liest alle deine Datensätze über die base44-API und schreibt sie zu Supabase. Das Token wird nicht gespeichert.

Beim Import werden IDs neu vergeben und alle Verweise (classId, layoutId, tableId, studentId, sessionId) konsistent umgeschrieben.

## Verbesserungen während der Portierung

- `Dashboard.jsx` (838 Zeilen) in kleinere Teile aufteilen
- Tests für den Sitzplan-Algorithmus (Blacklist, "muss zusammen sitzen", feste Plätze, Geschlechter-Mix)
- Ungenutzte Pakete entfernen
- Datenschutzhinweis und Seite "Meine Daten löschen"

## Offene Fragen

- Name und Domain der App (z.B. `sitzplan.deine-domain.ch` oder GitHub-Pages-Adresse)?
- Wer bezahlt den Claude-API-Key, und soll es ein Monatslimit geben?
- Sollen Lehrkräfte Klassen oder Raumpläne untereinander teilen können?
- Muss die Schule (Datenschutzbeauftragte Person) der Lösung zustimmen?
