import React, { useState, useEffect, useRef, useCallback } from 'react';
import { entities } from '@/api/db';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Microphone as Mic, MicrophoneSlash as MicOff, SpeakerHigh as Volume2 } from '@phosphor-icons/react';
import DraggableWindow from './DraggableWindow';

const MODES = [
  { id: 'still',   emoji: '😶', label: 'Stillarbeit', defaultThreshold: 0.3  },
  { id: 'whisper', emoji: '🤫', label: 'Flüstern',    defaultThreshold: 0.55 },
  { id: 'discuss', emoji: '🗣️', label: 'Diskussion',  defaultThreshold: 0.8  },
];

export default function NoiseMeterOverlay({ onClose, currentUser }) {
  const [volume, setVolume] = useState(0);
  const [activeMode, setActiveMode] = useState('still');
  const [thresholds, setThresholds] = useState({ still: 0.3, whisper: 0.55, discuss: 0.8 });
  const [micAllowed, setMicAllowed] = useState(null);
  const [exceeded, setExceeded] = useState(false);
  const [warnEnabled, setWarnEnabled] = useState(true);
  const [redDuration, setRedDuration] = useState(0);
  const warnedRef = useRef(false);
  const redTimerRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const audioCtxRef = useRef(null);
  const queryClient = useQueryClient();

  const settingsQuery = useQuery({
    queryKey: ['appSettings', currentUser?.email],
    queryFn: () => entities.AppSettings.filter({ created_by: currentUser.email }),
    enabled: !!currentUser,
    staleTime: 30_000,
    select: (data) => data[0] || null,
  });
  const settings = settingsQuery.data;

  const updateSettings = useMutation({
    mutationFn: ({ id, data }) => entities.AppSettings.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appSettings'] }),
  });
  const createSettings = useMutation({
    mutationFn: (data) => entities.AppSettings.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appSettings'] }),
  });

  useEffect(() => {
    if (settings?.noiseModeThresholds) {
      setThresholds(prev => ({ ...prev, ...settings.noiseModeThresholds }));
    }
  }, [settings?.id]);

  const saveThresholds = useCallback((newThresholds) => {
    if (!currentUser) return;
    if (settings?.id) updateSettings.mutate({ id: settings.id, data: { noiseModeThresholds: newThresholds } });
    else createSettings.mutate({ userEmail: currentUser.email, noiseModeThresholds: newThresholds });
  }, [settings, currentUser]);

  const handleThresholdChange = (value) => setThresholds(prev => ({ ...prev, [activeMode]: parseFloat(value) }));
  const handleThresholdCommit = () => saveThresholds(thresholds);

  const startMic = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      setMicAllowed(true);
    } catch { setMicAllowed(false); }
  }, []);

  useEffect(() => {
    startMic();
    return () => {
      cancelAnimationFrame(rafRef.current);
      clearInterval(redTimerRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
      audioCtxRef.current?.close();
    };
  }, []);

  useEffect(() => {
    if (!analyserRef.current) return;
    const data = new Uint8Array(analyserRef.current.frequencyBinCount);
    const tick = () => {
      analyserRef.current.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b, 0) / data.length;
      setVolume(Math.min(1, avg / 128));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [micAllowed]);

  const currentThreshold = thresholds[activeMode];
  useEffect(() => {
    const isExceeded = volume > currentThreshold;
    setExceeded(isExceeded);
    if (isExceeded) {
      if (!redTimerRef.current) redTimerRef.current = setInterval(() => setRedDuration(d => d + 1), 1000);
    } else {
      clearInterval(redTimerRef.current); redTimerRef.current = null;
      setRedDuration(0); warnedRef.current = false;
    }
  }, [volume, currentThreshold]);

  useEffect(() => {
    if (warnEnabled && redDuration >= 5 && !warnedRef.current) {
      warnedRef.current = true;
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine'; osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.8);
    }
  }, [redDuration, warnEnabled]);

  const barCount = 20;

  return (
    <DraggableWindow
      title="Lautstärke"
      onClose={onClose}
      storageKey="noise_meter"
      defaultWidth={420}
      defaultHeight={500}
    >
      <div className="h-full flex flex-col items-center justify-center gap-4 px-4 py-4 overflow-auto" style={{ background: '#1C1C1E' }}>
        {micAllowed === false ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <MicOff className="w-10 h-10 text-red-400" />
            <p className="text-white/70 text-sm">Mikrofon-Zugriff verweigert.<br />Bitte in den Browser-Einstellungen erlauben.</p>
          </div>
        ) : micAllowed === null ? (
          <div className="flex flex-col items-center gap-3">
            <Mic className="w-8 h-8 text-white/40 animate-pulse" />
            <p className="text-white/40 text-sm">Mikrofon wird gestartet…</p>
          </div>
        ) : (
          <>
            {/* Mode selector */}
            <div className="flex gap-2 w-full">
              {MODES.map(mode => {
                const isActive = activeMode === mode.id;
                const isOver = isActive && exceeded;
                return (
                  <button
                    key={mode.id}
                    onClick={() => setActiveMode(mode.id)}
                    className={`flex-1 flex flex-col items-center gap-1 py-3 px-1 rounded-xl border-2 transition-all
                      ${isActive
                        ? isOver ? 'border-red-500 bg-red-500/20' : 'border-blue-400 bg-blue-400/10'
                        : 'border-white/10 bg-white/5 opacity-40'}`}
                  >
                    <span className={`text-3xl ${isActive ? 'scale-110' : 'scale-90'} transition-transform ${isOver ? 'animate-pulse' : ''}`}>
                      {mode.emoji}
                    </span>
                    <span className={`text-xs font-semibold ${isActive ? 'text-white' : 'text-white/40'}`}>{mode.label}</span>
                    {isActive && (
                      <span className={`text-xs font-mono ${isOver ? 'text-red-400' : 'text-blue-300'}`}>
                        {isOver ? '⚠ Zu laut' : '✓ OK'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Bars */}
            <div className="flex items-end gap-0.5 h-20">
              {Array.from({ length: barCount }, (_, i) => {
                const t = (i + 1) / barCount;
                const active = volume >= t;
                const over = t > currentThreshold;
                return (
                  <div key={i} className="rounded-t transition-all duration-75"
                    style={{ width: 12, height: `${35 + i * 3}%`, background: active ? (over ? '#ef4444' : '#3b82f6') : (over ? '#ef444422' : '#3b82f622') }}
                  />
                );
              })}
            </div>

            {/* Slider */}
            <div className="w-full max-w-xs flex flex-col gap-1">
              <div className="flex justify-between text-xs text-white/50">
                <span>Schwellenwert «{MODES.find(m => m.id === activeMode)?.label}»</span>
                <span className="font-mono">{Math.round(thresholds[activeMode] * 100)}%</span>
              </div>
              <input type="range" min="0.1" max="0.99" step="0.01"
                value={thresholds[activeMode]}
                onChange={e => handleThresholdChange(e.target.value)}
                onMouseUp={handleThresholdCommit}
                onTouchEnd={handleThresholdCommit}
                className="w-full accent-blue-400"
              />
              <div className="flex justify-between text-white/30 text-xs">
                <span>Empfindlich</span><span>Weniger</span>
              </div>
            </div>

            <button
              onClick={() => setWarnEnabled(v => !v)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-colors
                ${warnEnabled ? 'bg-white/10 text-white/80 hover:bg-white/20' : 'bg-white/5 text-white/30'}`}
            >
              <Volume2 className="w-4 h-4" />
              Warn-Ton {warnEnabled ? 'ein' : 'aus'}
            </button>

            {redDuration > 0 && (
              <p className="text-red-400/60 text-xs">{redDuration}s im roten Bereich</p>
            )}
          </>
        )}
      </div>
    </DraggableWindow>
  );
}