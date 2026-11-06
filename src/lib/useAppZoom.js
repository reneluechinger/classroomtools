import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

// Eigener Zoom der App statt Browser-Zoom.
// Trackpad-Pinch (Chrome/Edge/Firefox: Wheel mit ctrlKey, Safari: gesture-Events) und
// ⌘/Ctrl + / − werden abgefangen und vergrössern nur den Inhalt der App.
// Der Wert wird bewusst nicht gespeichert: Nach dem Neuladen ist er wieder 100 %.

const MIN = 0.5;
const MAX = 2;
const clamp = (z) => Math.min(MAX, Math.max(MIN, Math.round(z * 100) / 100));

export function useAppZoom() {
  const [zoom, setZoomState] = useState(1);
  const zoomRef = useRef(1);

  const setZoom = useCallback((z) => {
    const next = clamp(z);
    zoomRef.current = next;
    setZoomState(next);
  }, []);

  useEffect(() => {
    // Trackpad-Pinch in Chrome, Edge, Firefox (und Ctrl + Mausrad)
    const onWheel = (e) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      const delta = Math.max(-10, Math.min(10, e.deltaY));
      setZoom(zoomRef.current * Math.exp(-delta * 0.01));
    };

    // Trackpad-Pinch in Safari
    let gestureBase = 1;
    const onGestureStart = (e) => { e.preventDefault(); gestureBase = zoomRef.current; };
    const onGestureChange = (e) => { e.preventDefault(); setZoom(gestureBase * e.scale); };

    // ⌘/Ctrl + und −; ⌘/Ctrl 0 setzt App und Browser auf 100 %
    const onKey = (e) => {
      if (!(e.metaKey || e.ctrlKey) || e.altKey) return;
      if (e.key === '+' || e.key === '=') { e.preventDefault(); setZoom(zoomRef.current + 0.1); }
      else if (e.key === '-') { e.preventDefault(); setZoom(zoomRef.current - 0.1); }
      else if (e.key === '0') { setZoom(1); } // Browser darf hier ebenfalls zurücksetzen
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('gesturestart', onGestureStart);
    window.addEventListener('gesturechange', onGestureChange);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('gesturestart', onGestureStart);
      window.removeEventListener('gesturechange', onGestureChange);
      window.removeEventListener('keydown', onKey);
    };
  }, [setZoom]);

  // Steht der Browser selbst noch auf einem anderen Zoom (von früher), einmal darauf hinweisen
  useEffect(() => {
    const t = setTimeout(() => {
      if (!window.outerWidth || !window.innerWidth || document.fullscreenElement) return;
      const ratio = window.outerWidth / window.innerWidth;
      if (Math.abs(ratio - 1) > 0.08) {
        const mac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
        toast.info(`Der Browser ist auf ${Math.round(ratio * 100)} % gezoomt.`, {
          description: `${mac ? '⌘' : 'Ctrl'} + 0 setzt ihn auf 100 % zurück.`,
          duration: 8000,
        });
      }
    }, 800);
    return () => clearTimeout(t);
  }, []);

  return [zoom, setZoom];
}
