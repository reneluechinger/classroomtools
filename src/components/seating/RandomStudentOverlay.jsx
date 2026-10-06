import React, { useState } from 'react';
import DraggableWindow from './DraggableWindow';

export default function RandomStudentOverlay({ student: initialStudent, students, onClose }) {
  const [student, setStudent] = useState(initialStudent);

  const pool = students && students.length > 1 ? students : [student];

  const genderGradient = {
    w: 'from-pink-500 to-rose-400',
    m: 'from-blue-500 to-indigo-400',
    d: 'from-purple-500 to-violet-400',
  }[student?.gender] || 'from-blue-500 to-indigo-400';

  const onReshuffle = () => {
    const next = pool[Math.floor(Math.random() * pool.length)];
    setStudent(next);
  };

  return (
    <DraggableWindow
      title="🎲 Zufälliger Schüler"
      onClose={onClose}
      storageKey="random_student"
      defaultWidth={400}
      defaultHeight={360}
    >
      <div
        className="h-full flex flex-col items-center justify-center gap-3 px-6 py-6 select-none"
        style={{ background: '#0f172a' }}
      >
        {student && (
          <div className="flex flex-col items-center gap-3">
            <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${genderGradient} shadow-lg`} />
            <p className={`text-6xl font-black tracking-tight bg-gradient-to-br ${genderGradient} bg-clip-text text-transparent text-center leading-none`}>
              {student.firstName}
            </p>
            <p className="text-2xl font-semibold text-white/60 text-center">{student.lastName}</p>
            <p className="text-xs text-white/30 mt-1">Zufällig ausgewählt</p>
            <button
              className="mt-3 px-8 py-2 rounded-full bg-blue-500/80 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
              onClick={onReshuffle}
            >
              🎲 Neu würfeln
            </button>
          </div>
        )}
      </div>
    </DraggableWindow>
  );
}