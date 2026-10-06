import React from 'react';
import { CaretRight, Minus, Plus } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

// Farben der Icon-Kacheln, angelehnt an die iOS-Systemfarben
export const TILE = {
  blue: 'bg-[#007AFF]',
  indigo: 'bg-[#5856D6]',
  purple: 'bg-[#AF52DE]',
  pink: 'bg-[#FF2D55]',
  red: 'bg-[#FF3B30]',
  orange: 'bg-[#FF9500]',
  yellow: 'bg-[#FFCC00]',
  green: 'bg-[#34C759]',
  teal: 'bg-[#30B0C7]',
  gray: 'bg-[#8E8E93]',
};

// Farbiges, abgerundetes Quadrat mit weissem Symbol (wie in den iOS-Einstellungen)
export function IconTile({ icon: Icon, color = 'blue', size = 'md', className }) {
  const s = size === 'lg' ? 'w-11 h-11 rounded-[12px]' : size === 'sm' ? 'w-6 h-6 rounded-[6px]' : 'w-7 h-7 rounded-[8px]';
  const i = size === 'lg' ? 24 : size === 'sm' ? 14 : 17;
  return (
    <span className={cn('inline-flex items-center justify-center shrink-0 text-white shadow-sm', TILE[color], s, className)}>
      <Icon size={i} weight="fill" />
    </span>
  );
}

// Gruppierte Liste mit Titel über und Hinweis unter der Karte
export function Section({ title, trailing, footer, children, className }) {
  return (
    <section className={cn('space-y-1.5', className)}>
      {(title || trailing) && (
        <div className="flex items-end justify-between px-4">
          {title && <h3 className="text-[13px] uppercase tracking-wide text-muted-foreground">{title}</h3>}
          {trailing}
        </div>
      )}
      <div className="bg-card rounded-xl overflow-hidden">{children}</div>
      {footer && <p className="px-4 text-[13px] text-muted-foreground">{footer}</p>}
    </section>
  );
}

// Listenzeile; Trennlinie beginnt bündig mit dem Text, wie bei iOS
export function Row({ icon, color, label, detail, onClick, chevron = !!onClick, destructive, trailing, active, className }) {
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'group w-full flex items-center gap-3 pl-4 text-left min-h-[44px] transition-colors',
        onClick && 'hover:bg-muted active:bg-accent',
        className,
      )}
    >
      {icon && <IconTile icon={icon} color={color} />}
      <div className="flex-1 min-w-0 flex items-center gap-2 pr-4 py-2.5 border-b border-border group-last:border-b-0 self-stretch">
        <div className="flex-1 min-w-0">
          <div className={cn('text-[15px] truncate', destructive && 'text-destructive', active && 'font-semibold')}>{label}</div>
          {detail && <div className="text-[13px] text-muted-foreground truncate">{detail}</div>}
        </div>
        {trailing}
        {chevron && <CaretRight size={14} weight="bold" className="text-muted-foreground/60 shrink-0" />}
      </div>
    </Comp>
  );
}

// iOS Segmented Control
export function SegmentedControl({ options, value, onChange, className }) {
  return (
    <div className={cn('inline-flex p-0.5 rounded-[9px] bg-input', className)} role="tablist">
      {options.map((o) => {
        const Icon = o.icon;
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={on}
            disabled={o.disabled}
            onClick={() => onChange(o.value)}
            className={cn(
              'flex items-center gap-1.5 px-3.5 h-7 rounded-[7px] text-[13px] font-medium transition-all disabled:opacity-40',
              on ? 'bg-card shadow-sm text-foreground dark:bg-[#636366]' : 'text-foreground/80 hover:text-foreground',
            )}
          >
            {Icon && <Icon size={15} weight={on ? 'fill' : 'regular'} />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// iOS Stepper mit Beschriftung
export function Stepper({ label, value, onDec, onInc, decDisabled }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[13px] text-muted-foreground">{label}</span>
      <span className="text-[13px] font-semibold tabular-nums w-5 text-center">{value}</span>
      <div className="flex items-center rounded-[9px] bg-input overflow-hidden">
        <button type="button" onClick={onDec} disabled={decDisabled} aria-label={`${label} entfernen`}
          className="h-7 w-9 flex items-center justify-center hover:bg-accent disabled:opacity-30">
          <Minus size={14} weight="bold" />
        </button>
        <span className="w-px h-4 bg-border" />
        <button type="button" onClick={onInc} aria-label={`${label} hinzufügen`}
          className="h-7 w-9 flex items-center justify-center hover:bg-accent">
          <Plus size={14} weight="bold" />
        </button>
      </div>
    </div>
  );
}
