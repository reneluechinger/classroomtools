import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { HandWaving, Check, CircleNotch, MagnifyingGlass } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { queueInfo, joinQueue, queuePosition, leaveQueue } from '@/api/queue';

const POLL_MS = 4000;

// Öffentliche Seite für Lernende (ohne Login): Namen wählen, anstellen, Position sehen
export default function QueueJoin() {
  const { queueId } = useParams();
  const storeKey = `queue_entry_${queueId}`;
  const [info, setInfo] = useState(null);
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
    queueInfo(queueId)
      .then((d) => { if (!d) setState('missing'); else { setInfo(d); setState(entry ? 'waiting' : 'choose'); } })
      .catch(() => setState('missing'));
  }, [queueId]);

  const poll = useCallback(async () => {
    if (!entry) return;
    try {
      const p = await queuePosition(entry.entryId);
      if (p === null) { saveEntry(null); setState('choose'); return; } // Liste wurde geleert
      setPosition((old) => {
        if (p === 1 && old !== 1) navigator.vibrate?.([200, 100, 200]);
        return p;
      });
    } catch { /* nächster Versuch */ }
  }, [entry]);

  useEffect(() => {
    if (state !== 'waiting') return;
    poll();
    const id = setInterval(() => { if (!document.hidden) poll(); }, POLL_MS);
    return () => clearInterval(id);
  }, [state, poll]);

  const join = async (student) => {
    setBusy(true);
    try {
      const entryId = await joinQueue(queueId, student.id);
      saveEntry({ entryId, studentId: student.id, name: student.name });
      setPosition(null);
      setState('waiting');
    } catch {
      setState('error');
    } finally {
      setBusy(false);
    }
  };

  const leave = async () => {
    setBusy(true);
    await leaveQueue(entry.entryId).catch(() => {});
    saveEntry(null);
    setBusy(false);
    setState('choose');
  };

  const students = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (info?.students || []).filter((s) => !q || s.name.toLowerCase().includes(q));
  }, [info, search]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <div className="mx-auto w-14 h-14 rounded-[16px] bg-[#00C7BE] text-white flex items-center justify-center shadow-md">
            <HandWaving size={30} weight="fill" />
          </div>
          <h1 className="text-[28px] font-bold tracking-tight pt-2">Warteschlange</h1>
          {info && <p className="text-[15px] text-muted-foreground">{info.class_name}</p>}
        </div>

        {state === 'loading' && <CircleNotch size={28} className="animate-spin mx-auto text-muted-foreground" />}

        {state === 'missing' && (
          <p className="text-center text-[15px] text-muted-foreground">Diese Warteschlange gibt es nicht. Scanne den QR-Code nochmals.</p>
        )}

        {state === 'error' && (
          <div className="text-center space-y-3">
            <p className="text-[15px] text-destructive">Das hat nicht geklappt.</p>
            <Button variant="secondary" onClick={() => setState('choose')}>Nochmals versuchen</Button>
          </div>
        )}

        {state === 'choose' && (
          <div className="space-y-3">
            <p className="text-center text-[17px] font-medium">Tippe auf deinen Namen</p>
            {(info?.students?.length || 0) > 12 && (
              <div className="relative">
                <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Suchen" className="pl-9" />
              </div>
            )}
            <div className="bg-card rounded-xl overflow-hidden">
              {students.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  disabled={busy}
                  onClick={() => join(s)}
                  className="w-full text-left px-4 min-h-[52px] text-[17px] border-b border-border last:border-0 active:bg-accent disabled:opacity-50"
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
            <p className="text-[17px]">Hallo <b>{entry.name}</b></p>
            {position === 0 ? (
              <StatusCircle color="bg-[#34C759]" big={<Check size={64} weight="bold" />} text="Erledigt" />
            ) : position === 1 ? (
              <StatusCircle color="bg-[#34C759] animate-pulse" big="1" text="Du bist dran!" />
            ) : (
              <StatusCircle
                color="bg-primary"
                big={position ?? <CircleNotch size={40} className="animate-spin" />}
                text={position ? `Vor dir ${position - 1 === 1 ? 'ist 1 Person' : `sind ${position - 1} Personen`}` : 'Wird geladen …'}
              />
            )}
            {position === 0 ? (
              <Button size="lg" className="w-full" disabled={busy} onClick={() => join({ id: entry.studentId, name: entry.name })}>
                Nochmals anstellen
              </Button>
            ) : (
              <Button variant="outline" className="w-full text-destructive" disabled={busy} onClick={leave}>
                Austragen
              </Button>
            )}
            <p className="text-[13px] text-muted-foreground">Die Anzeige aktualisiert sich von selbst.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusCircle({ color, big, text }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className={`w-40 h-40 rounded-full text-white flex items-center justify-center text-[72px] font-bold tabular-nums shadow-lg ${color}`}>
        {big}
      </div>
      <div className="text-[22px] font-semibold">{text}</div>
    </div>
  );
}
