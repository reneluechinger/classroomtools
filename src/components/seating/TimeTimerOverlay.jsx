import React, { useEffect, useRef, useState } from 'react';
import DraggableWindow from './DraggableWindow';
import { playHotelBell } from '@/lib/bell';

// Timer im Stil der iOS-Uhr-App: Drehräder zum Einstellen, grosser Ring beim Ablaufen.
// Die Restzeit wird aus der Endzeit berechnet, so bleibt der Timer auch im Hintergrund-Tab genau.

const ROW = 44;                 // Höhe einer Zeile im Drehrad
const PRESETS = [1, 2, 3, 5, 10, 15, 20, 30];
const STORE = 'timer_last_seconds';
const ORANGE = '#FF9F0A';

const pad = (n) => String(n).padStart(2, '0');
const fmt = (s) => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return h ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
};
const loadLast = () => {
  try { return Number(localStorage.getItem(STORE)) || 600; } catch { return 600; }
};

export default function TimeTimerOverlay({ onClose }) {
  const [duration, setDuration] = useState(loadLast);     // eingestellte Zeit in s
  const [state, setState] = useState('idle');             // idle | running | paused | done
  const [endAt, setEndAt] = useState(null);               // ms-Zeitstempel beim Laufen
  const [left, setLeft] = useState(duration * 1000);      // Restzeit in ms (für Pause)
  const [, tick] = useState(0);

  // Während der Timer läuft, ca. 10× pro Sekunde neu zeichnen
  useEffect(() => {
    if (state !== 'running') return;
    const id = setInterval(() => {
      if (Date.now() >= endAt) {
        setState('done');
        setLeft(0);
        playHotelBell();
      } else {
        tick((t) => t + 1);
      }
    }, 100);
    return () => clearInterval(id);
  }, [state, endAt]);

  const remainingMs = state === 'running' ? Math.max(0, endAt - Date.now()) : left;
  const remaining = Math.ceil(remainingMs / 1000);
  const progress = duration ? remainingMs / (duration * 1000) : 0;

  const start = (secs = duration) => {
    if (!secs) return;
    try { localStorage.setItem(STORE, String(secs)); } catch { /* egal */ }
    setDuration(secs);
    setEndAt(Date.now() + secs * 1000);
    setState('running');
  };
  const pause = () => { setLeft(Math.max(0, endAt - Date.now())); setState('paused'); };
  const resume = () => { setEndAt(Date.now() + left); setState('running'); };
  const cancel = () => { setLeft(duration * 1000); setState('idle'); };

  const endTime = state === 'running'
    ? new Date(endAt).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <DraggableWindow title="Timer" onClose={onClose} storageKey="time_timer" defaultWidth={420} defaultHeight={560}>
      <div className="h-full flex flex-col bg-black text-white select-none">
        <div className="flex-1 min-h-0 flex items-center justify-center p-4">
          {state === 'idle' ? (
            <div className="w-full flex flex-col items-center gap-6">
              <DurationPicker value={duration} onChange={setDuration} />
              <div className="flex flex-wrap justify-center gap-2 max-w-[340px]">
                {PRESETS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => start(m * 60)}
                    className="h-8 px-3.5 rounded-full bg-white/10 hover:bg-white/20 text-[14px] tabular-nums transition-colors"
                  >
                    {m} Min
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <Ring progress={progress} done={state === 'done'}>
              <text x="50" y={endTime ? 52 : 55} textAnchor="middle" fill={state === 'done' ? ORANGE : '#fff'}
                fontSize={remaining >= 3600 ? 15 : 19} fontWeight="200" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {fmt(remaining)}
              </text>
              {endTime && (
                <text x="50" y="63" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="4.2">
                  🔔 {endTime}
                </text>
              )}
              {state === 'paused' && (
                <text x="50" y="63" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="4.2">Pausiert</text>
              )}
            </Ring>
          )}
        </div>

        {/* Runde Knöpfe wie in der Uhr-App */}
        <div className="flex items-center justify-between px-6 pb-6 pt-2">
          <RoundButton onClick={cancel} disabled={state === 'idle'} color="gray">Abbrechen</RoundButton>
          {state === 'idle' && <RoundButton onClick={() => start()} disabled={!duration} color="green">Start</RoundButton>}
          {state === 'running' && <RoundButton onClick={pause} color="orange">Pause</RoundButton>}
          {state === 'paused' && <RoundButton onClick={resume} color="green">Weiter</RoundButton>}
          {state === 'done' && <RoundButton onClick={() => start()} color="green">Nochmals</RoundButton>}
        </div>
      </div>
    </DraggableWindow>
  );
}

function Ring({ progress, done, children }) {
  const R = 44;
  const C = 2 * Math.PI * R;
  return (
    <svg viewBox="0 0 100 100" className={`w-full h-full max-h-full ${done ? 'animate-pulse' : ''}`}>
      <circle cx="50" cy="50" r={R} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="3.2" />
      <circle
        cx="50" cy="50" r={R} fill="none" stroke={ORANGE} strokeWidth="3.2" strokeLinecap="round"
        strokeDasharray={C} strokeDashoffset={C * (1 - progress)}
        transform="rotate(-90 50 50)"
        style={{ transition: 'stroke-dashoffset 0.1s linear' }}
      />
      {children}
    </svg>
  );
}

function RoundButton({ children, onClick, disabled, color }) {
  const styles = {
    gray: 'bg-white/15 text-white',
    green: 'bg-[#30D158]/20 text-[#30D158]',
    orange: 'bg-[#FF9F0A]/20 text-[#FF9F0A]',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-[86px] h-[86px] rounded-full p-[3px] ring-2 ring-black outline outline-2 outline-offset-0 outline-white/10 disabled:opacity-40 active:scale-95 transition-transform ${styles[color]}`}
    >
      <span className="w-full h-full rounded-full flex items-center justify-center text-[14px] font-medium">{children}</span>
    </button>
  );
}

// Zwei Drehräder (Minuten, Sekunden) mit Einrasten wie bei iOS
function DurationPicker({ value, onChange }) {
  const m = Math.min(99, Math.floor(value / 60));
  const s = value % 60;
  return (
    <div className="relative flex items-center justify-center gap-2 w-full max-w-[300px]">
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[44px] rounded-[10px] bg-white/10 pointer-events-none" />
      <Wheel count={100} value={m} onChange={(v) => onChange(v * 60 + s)} unit="Min" />
      <Wheel count={60} value={s} onChange={(v) => onChange(m * 60 + v)} unit="Sek" />
    </div>
  );
}

function Wheel({ count, value, onChange, unit }) {
  const ref = useRef(null);
  const timer = useRef(null);

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = value * ROW;
    // nur beim Öffnen auf den Startwert scrollen
  }, []);

  const onScroll = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const i = Math.round(ref.current.scrollTop / ROW);
      if (i !== value) onChange(Math.max(0, Math.min(count - 1, i)));
    }, 80);
  };

  return (
    <div className="flex items-center">
      <div
        ref={ref}
        onScroll={onScroll}
        className="no-scrollbar h-[220px] w-[72px] overflow-y-scroll snap-y snap-mandatory"
        style={{
          maskImage: 'linear-gradient(transparent, #000 30%, #000 70%, transparent)',
          WebkitMaskImage: 'linear-gradient(transparent, #000 30%, #000 70%, transparent)',
        }}
      >
        <div style={{ height: ROW * 2 }} />
        {Array.from({ length: count }, (_, i) => (
          <div
            key={i}
            onClick={() => { ref.current.scrollTo({ top: i * ROW, behavior: 'smooth' }); }}
            className={`snap-center flex items-center justify-end pr-2 text-[24px] tabular-nums cursor-pointer transition-colors ${i === value ? 'text-white' : 'text-white/35'}`}
            style={{ height: ROW }}
          >
            {i}
          </div>
        ))}
        <div style={{ height: ROW * 2 }} />
      </div>
      <span className="text-[17px] font-semibold w-10">{unit}</span>
    </div>
  );
}
