import React from 'react';
import { X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const APP_VERSION = '3.0.0';

export const CHANGELOG = [
  {
    version: '3.0.0',
    date: '06.10.2026',
    title: 'Neues Zuhause & aufgeräumte Oberfläche',
    items: [
      '🔑 Einmal pro Gerät anmelden, danach bleibst du angemeldet.',
      '📦 Deine Daten aus der alten Version übernimmst du über das Benutzermenü oben rechts: «Daten aus base44 übernehmen».',
      '🧰 Die Werkzeugleiste ist jetzt in «Sitzplan» und «Unterricht» aufgeteilt.',
      '🖨️ Der Drucken-Knopf ist zurück.',
      '📱 Der Raumplan passt sich jetzt jeder Bildschirmgrösse an, auch Tablet und Handy.',
      '👤 Neues Benutzermenü mit Dunkelmodus, Kurzanleitung, Backup und Abmelden.',
      '🔒 Deine Daten sind serverseitig geschützt: Nur du siehst deine Klassen und Sitzpläne.',
    ],
  },
  {
    version: '2.1.0',
    date: '04.05.2026',
    title: 'Werkzeuge automatisch anordnen',
    items: [
      '🗂️ Neuer «Anordnen»-Button in der Toolbar: Öffnet Timer, QR-Code, Zufalls-Schüler und Geräuschpegel auf einen Klick – automatisch in einem 2×2-Raster auf dem Bildschirm.',
      '🔍 QR-Codes lassen sich jetzt im Vollbild-Modus anzeigen und skalieren automatisch mit der Fenstergrösse mit.',
      '🖥️ Alle Werkzeug-Fenster lassen sich frei verschieben und in der Grösse anpassen – die Position wird gespeichert.',
    ],
  },
  {
    version: '2.0.0',
    date: '01.05.2026',
    title: 'Grosse Verbesserungen & neue Funktionen',
    items: [
      '📋 Strichliste verbessert: Schüler, die in mehreren Klassen sind, erscheinen jetzt nur noch einmal – ihre Striche gelten für alle Klassen gleichzeitig.',
      '🏷️ In der Gesamtübersicht siehst du bei jedem Schüler direkt, in welchen Klassen er eingeteilt ist.',
      '🔤 Die Schülerlisten sind jetzt immer alphabetisch nach Vornamen sortiert.',
      '😶🤫🗣️ Lautstärke-Messer überarbeitet: Du kannst jetzt zwischen drei Moden wählen (Stillarbeit, Flüstern, Diskussion) und für jeden Modus separat einstellen, ab wann es „zu laut" ist.',
      '💾 Diese Einstellungen werden automatisch gespeichert – auch wenn du das Gerät wechselst.',
      '🔧 Viele kleinere Verbesserungen für mehr Zuverlässigkeit und Übersichtlichkeit.',
    ],
  },
];

export default function ChangelogModal({ onClose }) {
  const entry = CHANGELOG[0];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-primary px-6 py-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-white font-bold text-lg">Was ist neu?</h2>
              <p className="text-white/70 text-xs mt-0.5">Version {entry.version} · {entry.date}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-3">
          <p className="font-semibold text-base">{entry.title}</p>
          <ul className="space-y-2.5">
            {entry.items.map((item, i) => (
              <li key={i} className="text-sm text-muted-foreground leading-relaxed">
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="px-6 pb-5">
          <Button className="w-full" onClick={onClose}>
            Alles klar, weiter geht's!
          </Button>
        </div>
      </div>
    </div>
  );
}