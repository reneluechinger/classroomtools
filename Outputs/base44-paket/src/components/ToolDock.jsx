import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { TILE } from '@/components/ios';

// Schwebendes Dock am unteren Rand mit den Unterrichtswerkzeugen (wie das iOS-Dock)
export default function ToolDock({ items }) {
  const [pressed, setPressed] = useState(null);
  return (
    <nav
      aria-label="Unterrichtswerkzeuge"
      className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 max-w-[calc(100vw-1.5rem)]
                 bg-card/75 backdrop-blur-2xl backdrop-saturate-150 border border-white/40 dark:border-white/10
                 shadow-[0_8px_30px_rgba(0,0,0,0.12)] rounded-[26px] px-2 py-2"
    >
      <ul className="flex items-end gap-1 overflow-x-auto no-scrollbar">
        {items.map((it) =>
          it.divider ? (
            <li key={it.key} className="self-center w-px h-10 bg-border mx-1 shrink-0" aria-hidden />
          ) : (
            <li key={it.key} className="shrink-0">
              <button
                type="button"
                title={it.title || it.label}
                disabled={it.disabled}
                onClick={() => { setPressed(it.key); setTimeout(() => setPressed(null), 350); it.onClick(); }}
                className="group flex flex-col items-center gap-1 w-[62px] py-0.5 rounded-xl disabled:opacity-35 disabled:cursor-not-allowed"
              >
                <span
                  className={cn(
                    'w-11 h-11 rounded-[12px] flex items-center justify-center text-white shadow-sm transition-transform duration-150',
                    'group-hover:-translate-y-0.5 group-active:scale-90',
                    pressed === it.key && 'scale-90',
                    TILE[it.color],
                  )}
                >
                  <it.icon size={24} weight="fill" />
                </span>
                <span className="text-[11px] leading-none text-foreground/80">{it.label}</span>
              </button>
            </li>
          ),
        )}
      </ul>
    </nav>
  );
}
