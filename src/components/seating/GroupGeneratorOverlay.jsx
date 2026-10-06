import React, { useState } from 'react';
import { X, RefreshCw } from 'lucide-react';

const GROUP_COLORS = [
  'bg-red-100 border-red-300 text-red-700',
  'bg-blue-100 border-blue-300 text-blue-700',
  'bg-green-100 border-green-300 text-green-700',
  'bg-yellow-100 border-yellow-300 text-yellow-700',
  'bg-purple-100 border-purple-300 text-purple-700',
  'bg-orange-100 border-orange-300 text-orange-700',
  'bg-teal-100 border-teal-300 text-teal-700',
  'bg-pink-100 border-pink-300 text-pink-700',
];

function buildGroupSizes(n, mode) {
  if (n <= 0) return [];

  if (mode === 'pairs') {
    if (n <= 3) return [n];
    if (n % 2 === 0) return Array(n / 2).fill(2);
    return [3, ...Array((n - 3) / 2).fill(2)];
  }

  if (mode === 'threes') {
    if (n <= 4) return [n];
    const r = n % 3;
    if (r === 0) return Array(Math.floor(n / 3)).fill(3);
    if (r === 1) return [4, ...Array(Math.floor((n - 4) / 3)).fill(3)];
    // r === 2
    if (n >= 8) return [4, 4, ...Array(Math.floor((n - 8) / 3)).fill(3)];
    return [n];
  }

  if (mode === 'fours') {
    if (n <= 5) return [n];
    // ceil-based: groups of 4 and 3, no students lost
    const numGroups = Math.ceil(n / 4);
    const deficit = numGroups * 4 - n; // groups that are 3 instead of 4
    return [...Array(numGroups - deficit).fill(4), ...Array(deficit).fill(3)];
  }

  return [n];
}

function generateGroups(students, mode) {
  const shuffled = [...students].sort(() => Math.random() - 0.5);
  const sizes = buildGroupSizes(shuffled.length, mode);
  const groups = [];
  let idx = 0;
  for (const size of sizes) {
    groups.push(shuffled.slice(idx, idx + size));
    idx += size;
  }
  return groups;
}

const MODES = [
  { id: 'pairs',  label: 'Paare',        desc: '2er (Ausnahme: 3er)' },
  { id: 'threes', label: '3er Gruppen',   desc: '3er (Ausnahme: 4er)' },
  { id: 'fours',  label: '4er Gruppen',   desc: '4er (Ausnahme: 3er)' },
];

export default function GroupGeneratorOverlay({ students, onClose }) {
  const [mode, setMode] = useState('threes');
  const [groups, setGroups] = useState(() => generateGroups(students, 'threes'));

  const reshuffle = () => setGroups(generateGroups(students, mode));

  const handleModeChange = (m) => {
    setMode(m);
    setGroups(generateGroups(students, m));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Mode selector */}
        <div className="flex gap-2 mb-6">
          {MODES.map(m => (
            <button
              key={m.id}
              onClick={() => handleModeChange(m.id)}
              className={`flex-1 py-2 px-3 rounded-xl text-sm font-semibold border-2 transition-colors
                ${mode === m.id
                  ? 'bg-gray-800 text-white border-gray-800'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}
            >
              <div>{m.label}</div>
              <div className="text-xs font-normal opacity-70">{m.desc}</div>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-gray-800">👥 Gruppen</h2>
            <p className="text-sm text-gray-400 mt-0.5">
              {groups.length} Gruppen · {students.length} Schüler
            </p>
          </div>
          <div className="flex gap-2">
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors"
              onClick={reshuffle}
            >
              <RefreshCw className="w-4 h-4" />
              Neu würfeln
            </button>
            <button
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {groups.map((group, i) => (
            <div
              key={i}
              className={`rounded-2xl border-2 p-4 ${GROUP_COLORS[i % GROUP_COLORS.length]}`}
            >
              <div className="font-black text-lg mb-2">Gruppe {i + 1}</div>
              <div className="space-y-1">
                {group.map(s => (
                  <div key={s.id} className="font-semibold text-sm">
                    {s.firstName} {s.lastName}
                  </div>
                ))}
              </div>
              <div className="mt-2 text-xs opacity-60">{group.length} Schüler</div>
            </div>
          ))}
        </div>

        <p className="text-center text-gray-400 text-xs mt-6">Klicke irgendwo ausserhalb um zu schliessen</p>
      </div>
    </div>
  );
}