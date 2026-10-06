import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import DraggableWindow from './DraggableWindow';

const COLORS = [
  { name: 'Rot',   bg: 'bg-red-500',    light: 'bg-red-50',    border: 'border-red-300',   glow: 'rgba(239,68,68,0.4)'   },
  { name: 'Grün',  bg: 'bg-green-500',  light: 'bg-green-50',  border: 'border-green-300', glow: 'rgba(34,197,94,0.4)'   },
  { name: 'Blau',  bg: 'bg-blue-500',   light: 'bg-blue-50',   border: 'border-blue-300',  glow: 'rgba(59,130,246,0.4)'  },
  { name: 'Gelb',  bg: 'bg-yellow-400', light: 'bg-yellow-50', border: 'border-yellow-300', glow: 'rgba(234,179,8,0.4)'  },
];

function pickRandom() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

export default function ColorAssignmentOverlay({ onClose }) {
  const [color, setColor] = useState(() => pickRandom());

  return (
    <DraggableWindow
      title="🎨 Farbzuweisung"
      onClose={onClose}
      storageKey="color_assignment"
      defaultWidth={360}
      defaultHeight={320}
    >
      <div className={`h-full flex flex-col items-center justify-center gap-6 p-8 ${color.light} border-2 ${color.border} m-3 rounded-xl`}>
        <div
          className="w-32 h-32 rounded-full shadow-xl transition-all duration-500"
          style={{ background: color.glow.replace('0.4', '1'), boxShadow: `0 0 40px ${color.glow}` }}
        />
        <p className="text-2xl font-black">{color.name}</p>
        <button
          className="flex items-center gap-2 px-6 py-2 rounded-full bg-white/80 hover:bg-white text-gray-700 text-sm font-medium shadow transition-colors border border-gray-200"
          onClick={() => setColor(pickRandom())}
        >
          <RefreshCw className="w-4 h-4" />
          Neue Farbe
        </button>
      </div>
    </DraggableWindow>
  );
}