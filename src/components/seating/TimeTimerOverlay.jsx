import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, ArrowCounterClockwise as RotateCcw } from '@phosphor-icons/react';
import DraggableWindow from './DraggableWindow';

export default function TimeTimerOverlay({ onClose }) {
  const [totalSeconds, setTotalSeconds] = useState(10 * 60);
  const [remaining, setRemaining] = useState(10 * 60);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);
  const svgRef = useRef(null);
  const isDragging = useRef(false);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setRemaining(prev => {
          if (prev <= 1) { clearInterval(intervalRef.current); setRunning(false); return 0; }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const setTimer = (minutes) => {
    const secs = Math.round(minutes) * 60;
    setTotalSeconds(secs);
    setRemaining(secs);
    setRunning(false);
  };

  const reset = () => { setRemaining(totalSeconds); setRunning(false); };

  const getMinutesFromEvent = useCallback((e) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    let angle = Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;
    const minutes = Math.round((angle / 360) * 60);
    return minutes === 0 ? 60 : minutes;
  }, []);

  const handleDragStart = useCallback((e) => {
    if (running) return;
    isDragging.current = true;
    const mins = getMinutesFromEvent(e);
    if (mins !== null) setTimer(mins);
  }, [running, getMinutesFromEvent]);

  const handleDragMove = useCallback((e) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const mins = getMinutesFromEvent(e);
    if (mins !== null) setTimer(mins);
  }, [getMinutesFromEvent]);

  const handleDragEnd = useCallback(() => { isDragging.current = false; }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleDragEnd);
    window.addEventListener('touchmove', handleDragMove, { passive: false });
    window.addEventListener('touchend', handleDragEnd);
    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [handleDragMove, handleDragEnd]);

  const fraction = totalSeconds > 0 ? remaining / totalSeconds : 0;
  const minutesDisplay = Math.floor(remaining / 60);
  const secondsDisplay = remaining % 60;
  const totalMinutes = Math.round(totalSeconds / 60);
  const isDone = remaining === 0;

  const R = 42; const cx = 50; const cy = 50;
  const startAngle = -90;
  const endAngle = startAngle + fraction * 360;

  function polar(angle) {
    const rad = (angle * Math.PI) / 180;
    return { x: cx + R * Math.cos(rad), y: cy + R * Math.sin(rad) };
  }

  function describeArc(frac) {
    if (frac <= 0) return '';
    if (frac >= 1) return `M ${cx} ${cy - R} A ${R} ${R} 0 1 1 ${cx - 0.001} ${cy - R} Z`;
    const start = polar(startAngle);
    const end = polar(endAngle);
    return `M ${cx} ${cy} L ${start.x} ${start.y} A ${R} ${R} 0 ${frac > 0.5 ? 1 : 0} 1 ${end.x} ${end.y} Z`;
  }

  const ticks = Array.from({ length: 60 }, (_, i) => {
    const angle = ((i / 60) * 360 - 90) * (Math.PI / 180);
    const isMajor = i % 5 === 0;
    const inner = isMajor ? 43 : 45;
    return { x1: cx + inner * Math.cos(angle), y1: cy + inner * Math.sin(angle), x2: cx + 48 * Math.cos(angle), y2: cy + 48 * Math.sin(angle), isMajor };
  });

  const handlePos = polar(endAngle);

  return (
    <DraggableWindow
      title="Timer"
      onClose={onClose}
      storageKey="time_timer"
      defaultWidth={380}
      defaultHeight={500}
    >
      <div className="h-full flex flex-col items-center justify-center gap-[2%] px-4 py-4" style={{ background: '#1C1C1E' }}>
        {!running && (
          <p className="text-white/40 text-xs select-none">Ziehe im Kreis um die Zeit einzustellen</p>
        )}

        <svg
          ref={svgRef}
          viewBox="0 0 100 100"
          className="w-full select-none"
          style={{
            maxHeight: '55%',
            cursor: running ? 'default' : 'grab',
            filter: isDone ? 'drop-shadow(0 0 12px rgba(239,68,68,0.8))' : ''
          }}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
        >
          <circle cx={cx} cy={cy} r={R} fill="white" />
          {fraction > 0 && <path d={describeArc(fraction)} fill={isDone ? '#ef4444' : '#e53e3e'} opacity="0.92" />}
          {ticks.map((t, i) => (
            <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
              stroke="#374151" strokeWidth={t.isMajor ? 0.8 : 0.4} opacity={0.6} />
          ))}
          {!running && fraction > 0 && (
            <circle cx={handlePos.x} cy={handlePos.y} r="3" fill="#1d4ed8" stroke="white" strokeWidth="0.8" />
          )}
          <circle cx={cx} cy={cy} r="4" fill="#374151" />
          <circle cx={cx} cy={cy} r="2" fill="#6b7280" />
          <circle cx={cx} cy={cy} r={R} fill="none" stroke="#374151" strokeWidth="1" />
        </svg>

        <div className={`font-black tabular-nums transition-colors select-none ${isDone ? 'text-red-400 animate-pulse' : 'text-white'}`}
          style={{ fontSize: 'clamp(2rem, 8vw, 5rem)' }}>
          {String(minutesDisplay).padStart(2, '0')}:{String(secondsDisplay).padStart(2, '0')}
        </div>
        <div className="text-white/40 text-xs">{totalMinutes} Min eingestellt</div>

        <div className="flex items-center gap-4">
          <button className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors" onClick={reset}>
            <RotateCcw className="w-5 h-5" />
          </button>
          <button
            className={`px-8 py-3 rounded-full text-white text-lg font-bold transition-all shadow-lg
              ${running ? 'bg-gray-600 hover:bg-gray-500' : 'bg-red-600 hover:bg-red-500'}`}
            onClick={() => setRunning(r => !r)}
          >
            {running ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
          </button>
        </div>
      </div>
    </DraggableWindow>
  );
}