import React from 'react';

export const DOOR_SIZE = 60;

// Tür im Grundriss: Wandstück mit Öffnung, Türblatt und Schwenkbereich.
// Gedreht wird in 90°-Schritten, damit die Tür an jede Wand passt.
export default function DoorSymbol({ rotation = 0 }) {
  return (
    <svg
      viewBox="0 0 60 60"
      width={DOOR_SIZE}
      height={DOOR_SIZE}
      style={{ transform: `rotate(${rotation}deg)` }}
      className="block text-foreground"
      role="img"
      aria-label="Tür"
    >
      {/* Schwenkbereich */}
      <path d="M8 52 L8 8 A44 44 0 0 1 52 52 Z" fill="#FF9500" opacity="0.10" />
      <path d="M8 8 A44 44 0 0 1 52 52" fill="none" stroke="#FF9500" strokeWidth="1.5" strokeDasharray="3 3" />
      {/* Wand links und rechts der Öffnung */}
      <line x1="0" y1="52" x2="8" y2="52" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <line x1="52" y1="52" x2="60" y2="52" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      {/* Türblatt mit Scharnier und Griff */}
      <rect x="5.5" y="8" width="5" height="44" rx="1.5" fill="#FF9500" />
      <circle cx="8" cy="52" r="3" fill="currentColor" />
      <circle cx="8" cy="12" r="1.3" fill="#fff" />
      <text x="30" y="40" textAnchor="middle" fontSize="9" fontWeight="600" fill="#C76E00" style={{ letterSpacing: '0.08em' }}>
        TÜR
      </text>
    </svg>
  );
}
