import React, { useState } from 'react';
import { Check, Trash, PushPin, PushPinSlash, PencilSimple } from '@phosphor-icons/react';
import { Section } from '@/components/ios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

const fmt = (d) => new Date(d).toLocaleString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function SeatingPlanPanel({ plans = [], activePlanId, onLoad, onDelete, onTogglePin, onRename }) {
  const [editing, setEditing] = useState(null); // Plan, der gerade beschriftet wird
  const [label, setLabel] = useState('');

  // Angehefteter Plan zuerst, dann die neuesten
  const sorted = [...plans].sort((a, b) =>
    (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) ||
    new Date(b.updated_date || b.created_date) - new Date(a.updated_date || a.created_date));

  const openRename = (plan) => { setLabel(plan.label || ''); setEditing(plan); };
  const saveRename = () => { onRename(editing, label.trim()); setEditing(null); };

  return (
    <>
      <Section
        title="Gespeicherte Sitzpläne"
        footer={plans.length === 0
          ? 'Mit «Neu mischen» entsteht der erste Sitzplan.'
          : 'Angehefteter Plan öffnet sich automatisch. Fahre über einen Plan, um ihn anzuheften oder zu beschriften.'}
      >
        <div className="max-h-64 overflow-y-auto">
          {sorted.map(plan => {
            const isActive = plan.id === activePlanId;
            const date = fmt(plan.updated_date || plan.created_date);
            return (
              <div key={plan.id} className="group flex items-center pl-4 hover:bg-muted transition-colors">
                <span className="w-6 shrink-0 flex items-center">
                  {plan.pinned
                    ? <PushPin size={16} weight="fill" className="text-[#FF9500]" />
                    : isActive && <Check size={16} weight="bold" className="text-primary" />}
                </span>
                <button
                  type="button"
                  onClick={() => onLoad(plan)}
                  className="flex-1 min-w-0 text-left py-2.5 pr-2 border-b border-border group-last:border-b-0"
                >
                  <div className={`text-[15px] truncate ${isActive ? 'font-semibold' : ''}`}>
                    {plan.label || date}
                  </div>
                  <div className="text-[13px] text-muted-foreground truncate">
                    {plan.label ? date : 'Ohne Namen'}
                    {isActive && plan.pinned && ' · geöffnet'}
                  </div>
                </button>
                <div className="self-stretch flex items-center gap-0.5 pr-2 border-b border-border group-last:border-b-0">
                  <IconBtn label={plan.pinned ? 'Lösen' : 'Anheften'} onClick={() => onTogglePin(plan)}
                    className={plan.pinned ? 'text-[#FF9500]' : 'text-primary'}>
                    {plan.pinned ? <PushPinSlash size={17} /> : <PushPin size={17} />}
                  </IconBtn>
                  <IconBtn label="Beschriften" onClick={() => openRename(plan)} className="text-primary">
                    <PencilSimple size={17} />
                  </IconBtn>
                  <IconBtn label="Löschen" onClick={() => onDelete(plan.id)} className="text-destructive">
                    <Trash size={17} />
                  </IconBtn>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Sitzplan beschriften</DialogTitle>
            <DialogDescription>z.B. «Prüfung», «Gruppenarbeit» oder «ab Herbstferien». Leer lassen zeigt wieder das Datum.</DialogDescription>
          </DialogHeader>
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && saveRename()}
            placeholder="Name des Sitzplans"
            maxLength={60}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Abbrechen</Button>
            <Button onClick={saveRename}>Sichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function IconBtn({ label, onClick, className, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`p-1.5 rounded-md opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-background/60 transition-opacity ${className}`}
    >
      {children}
    </button>
  );
}
