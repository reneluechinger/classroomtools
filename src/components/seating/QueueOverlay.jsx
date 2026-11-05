import React, { useCallback, useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import { toast } from 'sonner';
import { Check, X, ArrowCounterClockwise, Trash, Copy } from '@phosphor-icons/react';
import DraggableWindow from './DraggableWindow';
import { Button } from '@/components/ui/button';
import { supabase } from '@/api/supabase';
import { ensureQueue, listWaiting, countDoneSince, markDone, removeEntry, clearQueue, queueUrl } from '@/api/queue';

const POLL_MS = 3000;
const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.toISOString(); };

// Warteschlange für die Lehrkraft: QR-Code zum Anstellen, Reihenfolge, Abhaken
export default function QueueOverlay({ schoolClass, onClose }) {
  const [queue, setQueue] = useState(null);
  const [waiting, setWaiting] = useState([]);
  const [doneToday, setDoneToday] = useState(0);
  const [lastDone, setLastDone] = useState(null);
  const [error, setError] = useState('');

  // Warteschlange der Klasse holen (Namensliste wird aktualisiert)
  useEffect(() => {
    let alive = true;
    setQueue(null);
    ensureQueue(schoolClass)
      .then((q) => alive && setQueue(q))
      .catch(() => alive && setError('Die Warteschlange konnte nicht geladen werden. Ist das Datenbank-Update (Warteschlange) in Supabase ausgeführt?'));
    return () => { alive = false; };
  }, [schoolClass.id, schoolClass.students, schoolClass.name]);

  const refresh = useCallback(async () => {
    if (!queue) return;
    try {
      const [list, done] = await Promise.all([listWaiting(queue.id), countDoneSince(queue.id, startOfToday())]);
      setWaiting(list);
      setDoneToday(done);
    } catch { /* nächster Versuch beim nächsten Intervall */ }
  }, [queue]);

  useEffect(() => {
    if (!queue) return;
    refresh();
    const id = setInterval(() => { if (!document.hidden) refresh(); }, POLL_MS);
    return () => clearInterval(id);
  }, [queue, refresh]);

  const done = async (entry) => {
    setWaiting((w) => w.filter((e) => e.id !== entry.id));
    setLastDone(entry);
    await markDone(entry.id).catch(() => toast.error('Konnte nicht abhaken.'));
    refresh();
  };

  const undo = async () => {
    if (!lastDone) return;
    const { error: err } = await supabase.from('queue_entries').update({ done_at: null }).eq('id', lastDone.id);
    if (err) toast.error(`${lastDone.name} hat sich inzwischen neu angestellt.`);
    setLastDone(null);
    refresh();
  };

  const remove = async (entry) => {
    setWaiting((w) => w.filter((e) => e.id !== entry.id));
    await removeEntry(entry.id).catch(() => toast.error('Konnte nicht entfernen.'));
    refresh();
  };

  const clearAll = async () => {
    if (!queue || !window.confirm('Alle wartenden Einträge löschen?')) return;
    await clearQueue(queue.id).catch(() => toast.error('Konnte die Liste nicht leeren.'));
    setLastDone(null);
    refresh();
  };

  const url = queue ? queueUrl(queue.id) : '';
  const [current, ...next] = waiting;

  return (
    <DraggableWindow title={`Warteschlange · ${schoolClass.name}`} onClose={onClose} storageKey="queue" defaultWidth={760} defaultHeight={520}>
      {error ? (
        <p className="p-6 text-[15px] text-destructive">{error}</p>
      ) : (
        <div className="h-full flex flex-wrap bg-background">
          {/* QR-Code */}
          <div className="w-[240px] grow-0 shrink-0 p-4 flex flex-col items-center justify-center gap-3 border-r border-border">
            <div className="bg-white p-3 rounded-2xl shadow-sm w-full aspect-square flex items-center justify-center">
              {queue ? <QRCode value={url} style={{ width: '100%', height: 'auto' }} /> : <span className="text-sm text-muted-foreground">Lädt …</span>}
            </div>
            <p className="text-[15px] font-semibold text-center leading-snug">Scannen, Namen antippen, anstellen</p>
            {queue && (
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(url).then(() => toast.success('Link kopiert'))}
                className="text-[12px] text-primary flex items-center gap-1"
              >
                <Copy size={13} />Link kopieren
              </button>
            )}
          </div>

          {/* Reihenfolge */}
          <div className="flex-1 min-w-[260px] p-4 flex flex-col gap-3 min-h-0">
            <div className="rounded-2xl bg-card p-4 flex items-center gap-4 shadow-sm">
              <div className="flex-1 min-w-0">
                <div className="text-[13px] uppercase tracking-wide text-muted-foreground">Jetzt dran</div>
                <div className={`text-[40px] leading-tight font-bold truncate ${current ? '' : 'text-muted-foreground/50'}`}>
                  {current ? current.name : 'Niemand wartet'}
                </div>
              </div>
              {current && (
                <Button size="lg" className="rounded-full bg-[#34C759] hover:bg-[#2fb350] px-5" onClick={() => done(current)}>
                  <Check size={20} weight="bold" />Erledigt
                </Button>
              )}
            </div>

            <div className="flex items-end justify-between px-1">
              <h3 className="text-[13px] uppercase tracking-wide text-muted-foreground">Als Nächstes · {next.length}</h3>
              {lastDone && (
                <button type="button" onClick={undo} className="text-[13px] text-primary flex items-center gap-1">
                  <ArrowCounterClockwise size={14} />{lastDone.name} zurückholen
                </button>
              )}
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto bg-card rounded-xl">
              {next.map((e, i) => (
                <div key={e.id} className="group flex items-center gap-3 pl-4 pr-2 min-h-[48px] border-b border-border last:border-0">
                  <span className="w-6 text-[15px] text-muted-foreground tabular-nums">{i + 2}.</span>
                  <span className="flex-1 text-[17px] truncate">{e.name}</span>
                  <button type="button" onClick={() => remove(e)} aria-label={`${e.name} entfernen`}
                    className="p-2 rounded-full text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive">
                    <X size={16} />
                  </button>
                  <button type="button" onClick={() => done(e)} aria-label={`${e.name} erledigt`}
                    className="p-1.5 rounded-full text-[#34C759] hover:bg-[#34C759]/10">
                    <Check size={20} weight="bold" />
                  </button>
                </div>
              ))}
              {next.length === 0 && <p className="text-[14px] text-muted-foreground text-center py-6">Keine weiteren Wartenden</p>}
            </div>

            <div className="flex items-center justify-between text-[13px] text-muted-foreground px-1">
              <span>Heute erledigt: {doneToday}</span>
              <button type="button" onClick={clearAll} disabled={!waiting.length} className="flex items-center gap-1 text-destructive disabled:opacity-40">
                <Trash size={14} />Liste leeren
              </button>
            </div>
          </div>
        </div>
      )}
    </DraggableWindow>
  );
}
