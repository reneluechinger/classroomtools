import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Hand, Check, Loader2, Search } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Öffentliche Seite für Lernende (ohne Login): Namen wählen, anstellen, Position sehen.
// Route: /warten/:queueId  (ausserhalb des Logins, wie /feedback/:classId)

const POLL_MS = 4000;
const byCreated = (a, b) => new Date(a.created_date) - new Date(b.created_date);

export default function QueueJoin() {
  const { queueId } = useParams();
  const storeKey = `queue_entry_${queueId}`;
  const [queue, setQueue] = useState(null);
  const [state, setState] = useState('loading'); // loading | missing | choose | waiting | error
  const [entry, setEntry] = useState(() => { try { return JSON.parse(localStorage.getItem(storeKey)); } catch { return null; } });
  const [position, setPosition] = useState(null);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');

  const saveEntry = (e) => {
    setEntry(e);
    try { e ? localStorage.setItem(storeKey, JSON.stringify(e)) : localStorage.removeItem(storeKey); } catch { /* egal */ }
  };

  useEffect(() => {
    base44.entities.Queue.filter({ id: queueId })
      .then((list) => {
        const q = list[0];
        if (!q) { setState('missing'); return; }
        setQueue(q);
        setState(entry ? 'waiting' : 'choose');
      })
      .catch(() => setState('missing'));
  }, [queueId]);

  // Position: Anzahl Wartende, die sich vorher (oder gleichzeitig) angestellt haben
  const poll = useCallback(async () => {
    if (!entry) return;
    try {
      const all = await base44.entities.QueueEntry.filter({ queueId });
      const mine = all.find((e) => e.id === entry.entryId);
      if (!mine) { saveEntry(null); setState('choose'); return; } // Liste wurde geleert
      if (mine.doneAt) { setPosition(0); return; }
      const waiting = all.filter((e) => !e.doneAt).sort(byCreated);
      const p = waiting.findIndex((e) => e.id === mine.id) + 1;
      setPosition((old) => {
        if (p === 1 && old !== 1) navigator.vibrate?.([200, 100, 200]);
        return p;
      });
    } catch { /* nächster Versuch */ }
  }, [entry, queueId]);

  useEffect(() => {
    if (state !== 'waiting') return;
    poll();
    const id = setInterval(() => { if (!document.hidden) poll(); }, POLL_MS);
    return () => clearInterval(id);
  }, [state, poll]);

  const join = async (student) => {
    setBusy(true);
    try {
      // Wer schon wartet, steht nicht doppelt in der Schlange
      const all = await base44.entities.QueueEntry.filter({ queueId });
      let mine = all.find((e) => e.studentId === student.id && !e.doneAt);
      if (!mine) {
        mine = await base44.entities.QueueEntry.create({
          queueId, studentId: student.id, name: student.name, ownerEmail: queue.created_by,
        });
      }
      saveEntry({ entryId: mine.id, studentId: student.id, name: student.name });
      setPosition(null);
      setState('waiting');
    } catch {
      setState('error');
    } finally {
      setBusy(false);
    }
  };

  const students = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (queue?.students || []).filter((s) => !q || s.name.toLowerCase().includes(q));
  }, [queue, search]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-teal-500 text-white flex items-center justify-center shadow-md">
            <Hand className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight pt-2">Warteschlange</h1>
          {queue && <p className="text-muted-foreground">{queue.className}</p>}
        </div>

        {state === 'loading' && <Loader2 className="w-7 h-7 animate-spin mx-auto text-muted-foreground" />}

        {state === 'missing' && (
          <p className="text-center text-muted-foreground">Diese Warteschlange gibt es nicht. Scanne den QR-Code nochmals.</p>
        )}

        {state === 'error' && (
          <div className="text-center space-y-3">
            <p className="text-destructive">Das hat nicht geklappt.</p>
            <Button variant="outline" onClick={() => setState('choose')}>Nochmals versuchen</Button>
          </div>
        )}

        {state === 'choose' && (
          <div className="space-y-3">
            <p className="text-center text-lg font-medium">Tippe auf deinen Namen</p>
            {(queue?.students?.length || 0) > 12 && (
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Suchen" className="pl-9" />
              </div>
            )}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {students.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  disabled={busy}
                  onClick={() => join(s)}
                  className="w-full text-left px-4 min-h-[52px] text-lg border-b border-border last:border-0 active:bg-muted disabled:opacity-50"
                >
                  {s.name}
                </button>
              ))}
              {students.length === 0 && <p className="text-center text-muted-foreground py-6">Kein Name gefunden</p>}
            </div>
          </div>
        )}

        {state === 'waiting' && entry && (
          <div className="space-y-6 text-center">
            <p className="text-lg">Hallo <b>{entry.name}</b></p>
            {position === 0 ? (
              <StatusCircle color="bg-green-500" big={<Check className="w-16 h-16" />} text="Erledigt" />
            ) : position === 1 ? (
              <StatusCircle color="bg-green-500 animate-pulse" big="1" text="Du bist dran!" />
            ) : (
              <StatusCircle
                color="bg-blue-500"
                big={position ?? <Loader2 className="w-10 h-10 animate-spin" />}
                text={position ? `Vor dir ${position - 1 === 1 ? 'ist 1 Person' : `sind ${position - 1} Personen`}` : 'Wird geladen …'}
              />
            )}
            {position === 0 && (
              <Button size="lg" className="w-full" disabled={busy} onClick={() => join({ id: entry.studentId, name: entry.name })}>
                Nochmals anstellen
              </Button>
            )}
            <p className="text-sm text-muted-foreground">Die Anzeige aktualisiert sich von selbst.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusCircle({ color, big, text }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className={`w-40 h-40 rounded-full text-white flex items-center justify-center text-7xl font-bold tabular-nums shadow-lg ${color}`}>
        {big}
      </div>
      <div className="text-2xl font-semibold">{text}</div>
    </div>
  );
}
