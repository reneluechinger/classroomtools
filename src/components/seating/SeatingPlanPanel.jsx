import React from 'react';
import { Button } from "@/components/ui/button";
import { ClipboardList, Trash2, Check } from 'lucide-react';
const fmtFull = (d) => new Date(d).toLocaleString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const fmtShort = (d) => new Date(d).toLocaleString('de-CH', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

export default function SeatingPlanPanel({ plans = [], activePlanId, onLoad, onDelete }) {
  if (plans.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-4 space-y-2">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <ClipboardList className="w-4 h-4" />
          Gespeicherte Sitzpläne
        </h3>
        <p className="text-xs text-muted-foreground text-center py-3">
          Noch kein Sitzplan gespeichert. Klicke auf "Generieren".
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <h3 className="font-semibold text-sm flex items-center gap-2">
        <ClipboardList className="w-4 h-4" />
        Gespeicherte Sitzpläne
        <span className="ml-auto text-xs text-muted-foreground font-normal">{plans.length}</span>
      </h3>

      <div className="space-y-1 max-h-52 overflow-y-auto">
        {plans.map(plan => {
          const isActive = plan.id === activePlanId;
          return (
            <div
              key={plan.id}
              className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm cursor-pointer transition-colors
                ${isActive ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted/60 border border-transparent'}`}
              onClick={() => onLoad(plan)}
            >
              {isActive && <Check className="w-3 h-3 text-primary flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate text-xs">{plan.name}</p>
                <p className="text-xs text-muted-foreground">
                  {fmtFull(plan.created_date)} Uhr
                </p>
                {plan.updated_date && plan.updated_date !== plan.created_date && (
                  <p className="text-xs text-muted-foreground">
                    Geänd.: {fmtShort(plan.updated_date)}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-40 hover:opacity-100 flex-shrink-0"
                onClick={(e) => { e.stopPropagation(); onDelete(plan.id); }}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}