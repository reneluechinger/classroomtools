import React from 'react';
import { X } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';

const STEPS = [
  'Oben bei «Klasse» → «Neu …» eine Klasse anlegen und Lernende importieren',
  'Oben bei «Zimmer» → «Neu …» ein Zimmer anlegen',
  '«Zimmer bearbeiten»: Tische und Türen platzieren, drehen, sichern',
  '«Neu mischen» tippen',
  'Lernende per Drag & Drop umsetzen',
  '«Drucken» für ein PDF des Sitzplans',
];

function Steps() {
  return (
    <ol className="text-[14px] text-muted-foreground space-y-1.5 list-decimal pl-5">
      {STEPS.map((s) => <li key={s}>{s}</li>)}
    </ol>
  );
}

export default function QuickGuide({ variant = 'card', onClose }) {
  if (variant === 'card') {
    return (
      <div className="bg-card rounded-xl p-4 space-y-2">
        <h3 className="font-semibold text-[15px]">So geht's</h3>
        <Steps />
      </div>
    );
  }
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-card rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Kurzanleitung</h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Schliessen"><X size={16} weight="bold" /></Button>
        </div>
        <Steps />
      </div>
    </div>
  );
}
