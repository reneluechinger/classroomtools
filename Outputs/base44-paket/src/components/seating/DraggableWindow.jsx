import React, { useRef, useEffect, useState, useCallback } from 'react';
import { X } from '@phosphor-icons/react';

const DEFAULT_SIZE = { width: 480, height: 520 };
const MIN_SIZE = { width: 280, height: 200 };

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
        if (saved) return saved;
      } catch { /* ungültiger Eintrag: Standardposition */ }
    }
    // Use defaultX/defaultY if provided, otherwise center
    return {
      x: defaultX !== undefined ? defaultX : Math.max(20, (window.innerWidth - defaultWidth) / 2),
      y: defaultY !== undefined ? defaultY : Math.max(60, (window.innerHeight - defaultHeight) / 4),
      width: defaultWidth,
      height: defaultHeight,
    };
  };

  const [pos, setPos] = useState(getInitial);
  const dragging = useRef(false);
  const resizing = useRef(false);
  const startRef = useRef({});
  const windowRef = useRef(null);

  const save = useCallback((state) => {
    if (storageKey) {
      localStorage.setItem(`dw_${storageKey}`, JSON.stringify(state));
    }
  }, [storageKey]);

  // Drag
  const onMouseDownDrag = (e) => {
    if (e.button !== 0) return;
    dragging.current = true;
    startRef.current = { mx: e.clientX, my: e.clientY, ox: pos.x, oy: pos.y };
    e.preventDefault();
  };

  // Resize
  const onMouseDownResize = (e) => {
    if (e.button !== 0) return;
    resizing.current = true;
    startRef.current = { mx: e.clientX, my: e.clientY, ow: pos.width, oh: pos.height };
    e.preventDefault();
    e.stopPropagation();
  };

  useEffect(() => {
    const onMove = (e) => {
      if (dragging.current) {
        const dx = e.clientX - startRef.current.mx;
        const dy = e.clientY - startRef.current.my;
        setPos(p => {
          const nx = Math.max(0, Math.min(window.innerWidth - p.width, startRef.current.ox + dx));
          const ny = Math.max(0, Math.min(window.innerHeight - 60, startRef.current.oy + dy));
          return { ...p, x: nx, y: ny };
        });
      } else if (resizing.current) {
        const dx = e.clientX - startRef.current.mx;
        const dy = e.clientY - startRef.current.my;
        setPos(p => ({
          ...p,
          width: Math.max(MIN_SIZE.width, startRef.current.ow + dx),
          height: Math.max(MIN_SIZE.height, startRef.current.oh + dy),
        }));
      }
    };
    const onUp = () => {
      if (dragging.current || resizing.current) {
        setPos(p => { save(p); return p; });
      }
      dragging.current = false;
      resizing.current = false;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [save]);

  return (
    <div
      ref={windowRef}
      className={`fixed z-[70] bg-card rounded-[22px] shadow-[0_20px_60px_rgba(0,0,0,0.25)] ring-1 ring-black/5 dark:ring-white/10 flex flex-col overflow-hidden ${className}`}
      style={{ left: pos.x, top: pos.y, width: pos.width, height: pos.height }}
    >
      {/* Title bar / drag handle */}
      <div
        className="relative flex items-center justify-center h-11 px-12 bg-card/90 backdrop-blur border-b border-border cursor-grab active:cursor-grabbing select-none flex-shrink-0"
        onMouseDown={onMouseDownDrag}
      >
        <span className="absolute top-1.5 left-1/2 -translate-x-1/2 w-9 h-1 rounded-full bg-foreground/15" />
        <div className="text-[15px] font-semibold text-foreground truncate pt-1">{title}</div>
        <button
          className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-secondary text-muted-foreground flex items-center justify-center hover:text-foreground transition-colors"
          onClick={onClose}
          onMouseDown={e => e.stopPropagation()}
          aria-label="Schliessen"
        >
          <X size={14} weight="bold" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>

      {/* Resize handle */}
      <div
        className="absolute bottom-0 right-0 w-5 h-5 cursor-se-resize"
        onMouseDown={onMouseDownResize}
        style={{
          background: 'linear-gradient(135deg, transparent 55%, rgba(142,142,147,0.5) 55%)',
          borderRadius: '0 0 22px 0',
        }}
      />
    </div>
  );
}