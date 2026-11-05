import React, { useCallback, useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import { toast } from 'sonner';
import { Check, X, RotateCcw, Trash2, Copy } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import DraggableWindow from './DraggableWindow';

// Warteschlange für die Lehrkraft: QR-Code zum Anstellen, Reihenfolge, Abhaken.
// Props: schoolClass (SchoolClass-Datensatz), currentUser ({ email }), onClose

const POLL_MS = 3000;
const displayName = (s) => `${s.firstName}${s.lastName ? ` ${s.lastName.trim()[0]}.` : ''}`;
const isToday = (iso) => iso && new Date(iso).toDateString() === new Date().toDateString();
const byCreated = (a, b) => new Date(a.created_date) - new Date(b.created_date);

export default function QueueOverlay({ schoolClass, currentUser, onClose }) {
  const [queue, setQueue] = useState(null);
  const [entries, setEntries] = useState([]);
  const [lastDone, setLastDone] = useState(null);
  const [error, setError] = useState('');

  // Warteschlange der Klasse holen oder anlegen; Namensliste aktualisieren
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const students = [...(schoolClass.students || [])]
          .sort((a, b) => a.firstName.localeCompare(b.firstName, 'de'))
          .map((s) => ({ id: s.id, name: displayName(s) }));
        const found = await base44.entities.Queue.filter({ classId: schoolClass.id, created_by: currentUser.email });
        const q = found[0]
          ? await base44.entities.Queue.update(found[0].id, { className: schoolClass.name, students })
          : await base44.entities.Queue.create({ classId: schoolClass.id, className: schoolClass.name, students });
        if (alive) setQueue({ ...(found[0] || {}), ...q });
      } catch {
        if (alive) setError('Die Warteschlange konnte nicht geladen werden.');
      }
    })();
    return () => { alive = false; };
  }, [schoolClass.id, schoolClass.name, schoolClass.students, currentUser.email]);

  const refresh = useCallback(async () => {
    if (!queue) return;
    try {
      setEntries(await base44.entities.QueueEntry.filter({ queueId: queue.id }));
    } catch { /* nächster Versuch beim nächsten Intervall */ }
  }, [queue]);

  useEffect(() => {
    if (!queue) return;
    refresh();
    const id = setInterval(() => { if (!document.hidden) refresh(); }, POLL_MS);
    return () => clearInterval(id);
  }, [queue, refresh]);

  const waiting = entries.filter((e) => !e.doneAt).sort(byCreated);
  const doneToday = entries.filter((e) => isToday(e.doneAt)).length;

  const done = async (entry) => {
    setEntries((list) => list.map((e) => (e.id === entry.id ? { ...e, doneAt: new Date().toISOString() } : e)));
    setLastDone(entry);
    await base44.entities.QueueEntry.update(entry.id, { doneAt: new Date().toISOString() }).catch(() => toast.error('Konnte nicht abhaken.'));
    refresh();
  };

  const undo = async () => {
    if (!lastDone) return;
    const again = waiting.find((e) => e.studentId === lastDone.studentId);
    if (again) toast.error(`${lastDone.name} hat sich inzwischen neu angestellt.`);
    else await base44.entities.QueueEntry.update(lastDone.id, { doneAt: null }).catch(() => {});
    setLastDone(null);
    refresh();
  };

  const remove = async (entry) => {
    setEntries((list) => list.filter((e) => e.id !== entry.id));
    await base44.entities.QueueEntry.delete(entry.id).catch(() => toast.error('Konnte nicht entfernen.'));
    refresh();
  };

  const clearAll = async () => {
    if (!queue || !window.confirm('Alle Einträge dieser Warteschlange löschen?')) return;
    await Promise.all(entries.map((e) => base44.entities.QueueEntry.delete(e.id).catch(() => {})));
    setLastDone(null);
    refresh();
  };

  const url = queue ? `${window.location.origin}/warten/${queue.id}` : '';
  const [current, ...next] = waiting;

  return (
    <DraggableWindow title={`🙋 Warteschlange · ${schoolClass.name}`} onClose={onClose} storageKey="queue" defaultWidth={760} defaultHeight={520}>
      {error ? (
        <p className="p-6 text-sm text-destructive">{error}</p>
      ) : (
        <div className="h-full flex flex-wrap bg-background">
          {/* QR-Code */}
          <div className="w-[240px] shrink-0 p-4 flex flex-col items-center justify-center gap-3 border-r border-border">
            <div className="bg-white p-3 rounded-2xl shadow-sm w-full aspect-square flex items-center justify-center">
              {queue ? <QRCode value={url} style={{ width: '100%', height: 'auto' }} /> : <span className="text-sm text-muted-foreground">Lädt …</span>}
            </div>
            <p className="text-sm font-semibold text-center leading-snug">Scannen, Namen antippen, anstellen</p>
            {queue && (
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(url).then(() => toast.success('Link kopiert'))}
                className="text-xs text-primary flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />Link kopieren
              </button>
            )}
          </div>

          {/* Reihenfolge */}
          <div className="flex-1 min-w-[260px] p-4 flex flex-col gap-3 min-h-0">
            <div className="rounded-2xl bg-card border border-border p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Jetzt dran</div>
                <div className={`text-4xl leading-tight font-bold truncate ${current ? '' : 'text-muted-foreground/50'}`}>
                  {current ? current.name : 'Niemand wartet'}
                </div>
              </div>
              {current && (
                <Button size="lg" className="rounded-full bg-green-500 hover:bg-green-600 text-white" onClick={() => done(current)}>
                  <Check className="w-5 h-5 mr-1" />Erledigt
                </Button>
              )}
            </div>

            <div className="flex items-end justify-between px-1">
              <h3 className="text-xs uppercase tracking-wide text-muted-foreground">Als Nächstes · {next.length}</h3>
              {lastDone && (
                <button type="button" onClick={undo} className="text-xs text-primary flex items-center gap-1">
                  <RotateCcw className="w-3 h-3" />{lastDone.name} zurückholen
                </button>
              )}
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto bg-card border border-border rounded-xl">
              {next.map((e, i) => (
                <div key={e.id} className="group flex items-center gap-3 pl-4 pr-2 min-h-[48px] border-b border-border last:border-0">
                  <span className="w-6 text-sm text-muted-foreground tabular-nums">{i + 2}.</span>
                  <span className="flex-1 text-base truncate">{e.name}</span>
                  <button type="button" onClick={() => remove(e)} aria-label={`${e.name} entfernen`}
                    className="p-2 rounded-full text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive">
                    <X className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => done(e)} aria-label={`${e.name} erledigt`}
                    className="p-1.5 rounded-full text-green-600 hover:bg-green-50">
                    <Check className="w-5 h-5" />
                  </button>
                </div>
              ))}
              {next.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Keine weiteren Wartenden</p>}
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
              <span>Heute erledigt: {doneToday}</span>
              <button type="button" onClick={clearAll} disabled={!entries.length} className="flex items-center gap-1 text-destructive disabled:opacity-40">
                <Trash2 className="w-3 h-3" />Liste leeren
              </button>
            </div>
          </div>
        </div>
      )}
    </DraggableWindow>
  );
}
