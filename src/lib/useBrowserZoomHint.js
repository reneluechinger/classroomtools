import { useEffect } from 'react';
import { toast } from 'sonner';

// Eine Webseite darf den Browser-Zoom nicht selbst zurücksetzen.
// Ist er beim Laden nicht 100 %, zeigt die App einmal, wie man ihn zurücksetzt.
export function useBrowserZoomHint() {
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
}
