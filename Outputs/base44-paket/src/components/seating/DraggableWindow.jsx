import React, { useRef, useEffect, useState, useCallback } from 'react';
import { X } from '@phosphor-icons/react';

const DEFAULT_SIZE = { width: 480, height: 520 };
const MIN_SIZE = { width: 280, height: 200 };
const MARGIN = 8;

// Angetipptes Fenster kommt nach vorne (bleibt unter Dialogen mit z-index 100)
let topZ = 70;
const nextZ = () => { topZ = topZ >= 95 ? 71 : topZ + 1; return topZ; };

// Fenster vollständig im sichtbaren Bereich halten (z.B. nach dem Drehen des Tablets)
function fitToViewport(p) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = Math.max(Math.min(MIN_SIZE.width, vw - 2 * MARGIN), Math.min(p.width, vw - 2 * MARGIN));
  const height = Math.max(Math.min(MIN_SIZE.height, vh - 2 * MARGIN), Math.min(p.height, vh - 2 * MARGIN));
  return {
    width,
    height,
    x: Math.max(MARGIN, Math.min(vw - width - MARGIN, p.x)),
    y: Math.max(MARGIN, Math.min(vh - height - MARGIN, p.y)),
  };
}

export default function DraggableWindow({
  children,
  title,
  onClose,
  defaultWidth = DEFAULT_SIZE.width,
  defaultHeight = DEFAULT_SIZE.height,
  defaultX,
  defaultY,
  storageKey,
  className = '',
}) {
  const getInitial = () => {
    if (storageKey) {
      try {
        const saved = JSON.parse(localStorage.getItem(`dw_${storageKey}`));
        if (saved) return fitToViewport(saved);
      } catch { /* ungültiger Eintrag: Standardposition */ }
    }
    // Ohne gespeicherte Position: mittig
    return fitToViewport({
      x: defaultX !== undefined ? defaultX : Math.max(20, (window.innerWidth - defaultWidth) / 2),
      y: defaultY !== undefined ? defaultY : Math.max(60, (window.innerHeight - defaultHeight) / 4),
      width: defaultWidth,
      height: defaultHeight,
    });
  };

  const [pos, setPos] = useState(getInitial);
  const [z, setZ] = useState(nextZ);
  const mode = useRef(null); // 'drag' | 'resize' | null
  const startRef = useRef({});

  const save = useCallback((state) => {
    if (storageKey) {
      try { localStorage.setItem(`dw_${storageKey}`, JSON.stringify(state)); } catch { /* egal */ }
    }
  }, [storageKey]);

  const bringToFront = () => { if (z !== topZ) setZ(nextZ()); };

  // Pointer-Events: Maus, Finger und Stift gleich behandeln
  const start = (kind) => (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    mode.current = kind;
    startRef.current = { mx: e.clientX, my: e.clientY, ox: pos.x, oy: pos.y, ow: pos.width, oh: pos.height };
    e.currentTarget.setPointerCapture(e.pointerId);
    e.preventDefault();
    e.stopPropagation();
    bringToFront();
  };

  const onPointerMove = (e) => {
    if (!mode.current) return;
    const dx = e.clientX - startRef.current.mx;
    const dy = e.clientY - startRef.current.my;
    if (mode.current === 'drag') {
      setPos((p) => ({
        ...p,
        x: Math.max(0, Math.min(window.innerWidth - p.width, startRef.current.ox + dx)),
        y: Math.max(0, Math.min(window.innerHeight - 60, startRef.current.oy + dy)),
      }));
    } else {
      setPos((p) => ({
        ...p,
        width: Math.max(MIN_SIZE.width, Math.min(window.innerWidth - p.x - MARGIN, startRef.current.ow + dx)),
        height: Math.max(MIN_SIZE.height, Math.min(window.innerHeight - p.y - MARGIN, startRef.current.oh + dy)),
      }));
    }
  };

  const end = (e) => {
    if (!mode.current) return;
    mode.current = null;
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    setPos((p) => { save(p); return p; });
  };

  // Beim Drehen des Tablets oder Verkleinern des Fensters im Bild bleiben
  useEffect(() => {
    const onResize = () => setPos((p) => fitToViewport(p));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handlers = (kind) => ({
    onPointerDown: start(kind),
    onPointerMove,
    onPointerUp: end,
    onPointerCancel: end,
  });

  return (
    <div
      className={`fixed bg-card rounded-[22px] shadow-[0_20px_60px_rgba(0,0,0,0.25)] ring-1 ring-black/5 dark:ring-white/10 flex flex-col overflow-hidden ${className}`}
      style={{ left: pos.x, top: pos.y, width: pos.width, height: pos.height, zIndex: z }}
      onPointerDownCapture={bringToFront}
    >
      {/* Titelleiste zum Verschieben; touch-none verhindert, dass die Seite mitscrollt */}
      <div
        className="relative flex items-center justify-center h-12 px-12 bg-card/90 backdrop-blur border-b border-border cursor-grab active:cursor-grabbing select-none flex-shrink-0 touch-none"
        {...handlers('drag')}
      >
        <span className="absolute top-1.5 left-1/2 -translate-x-1/2 w-9 h-1 rounded-full bg-foreground/15" />
        <div className="text-[15px] font-semibold text-foreground truncate pt-1">{title}</div>
        <button
          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-secondary text-muted-foreground flex items-center justify-center hover:text-foreground transition-colors"
          onClick={onClose}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label="Schliessen"
        >
          <X size={14} weight="bold" />
        </button>
      </div>

      {/* Inhalt */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>

      {/* Ecke zum Vergrössern: grosse Trefferfläche für Finger, kleines sichtbares Dreieck */}
      <div
        className="absolute bottom-0 right-0 w-9 h-9 cursor-se-resize touch-none flex items-end justify-end"
        aria-label="Fenstergrösse ändern"
        {...handlers('resize')}
      >
        <span
          className="block w-5 h-5"
          style={{
            background: 'linear-gradient(135deg, transparent 55%, rgba(142,142,147,0.55) 55%)',
            borderRadius: '0 0 22px 0',
          }}
        />
      </div>
    </div>
  );
}
