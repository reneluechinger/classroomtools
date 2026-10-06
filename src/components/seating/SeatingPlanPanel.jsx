import React from 'react';
import { Check, Trash } from '@phosphor-icons/react';
import { Section } from '@/components/ios';

const fmt = (d) => new Date(d).toLocaleString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function SeatingPlanPanel({ plans = [], activePlanId, onLoad, onDelete }) {
  const sorted = [...plans].sort((a, b) =>
    new Date(b.updated_date || b.created_date) - new Date(a.updated_date || a.created_date));

  return (
    <Section title="Gespeicherte Sitzpläne" footer={plans.length === 0 ? 'Mit «Neu mischen» entsteht der erste Sitzplan.' : null}>
      <div className="max-h-56 overflow-y-auto">
        {sorted.map(plan => {
          const isActive = plan.id === activePlanId;
          return (
            <div key={plan.id} className="group flex items-center pl-4 hover:bg-muted transition-colors">
              <span className="w-5 shrink-0 text-primary">{isActive && <Check size={16} weight="bold" />}</span>
              <button
                type="button"
                onClick={() => onLoad(plan)}
                className="flex-1 min-w-0 text-left py-2.5 pr-2 border-b border-border group-last:border-b-0"
              >
                <div className={`text-[15px] truncate ${isActive ? 'font-semibold' : ''}`}>{fmt(plan.updated_date || plan.created_date)}</div>
                <div className="text-[13px] text-muted-foreground truncate">{plan.name}</div>
              </button>
              <div className="self-stretch flex items-center pr-3 border-b border-border group-last:border-b-0">
                <button
                  type="button"
                  onClick={() => onDelete(plan.id)}
                  aria-label="Sitzplan löschen"
                  className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity text-destructive p-1"
                >
                  <Trash size={17} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
