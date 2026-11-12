import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { FileArrowUp, CheckCircle, CircleNotch, Warning } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import { parseBackup, importBackup, ORDER, LABELS } from '@/lib/backupImport';

// Backup aus der GitHub-Version (Benutzermenü → Backup herunterladen) in base44 einspielen
export default function BackupImportDialog({ open, onOpenChange }) {
  const queryClient = useQueryClient();
  const [parsed, setParsed] = useState(null);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(null); // { done, total }
  const [result, setResult] = useState(null);

  const reset = () => { setParsed(null); setError(''); setProgress(null); setResult(null); };
  const close = (o) => { if (!o && progress && !result) return; if (!o) reset(); onOpenChange(o); };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    reset();
    try { setParsed(parseBackup(await file.text())); } catch (err) { setError(err.message); }
  };

  const run = async () => {
    setError('');
    setProgress({ done: 0, total: 1 });
    try {
      const me = await base44.auth.me();
      const res = await importBackup(parsed.data, base44.entities, me.email, (done, total) => setProgress({ done, total }));
      setResult(res);
      await queryClient.invalidateQueries();
    } catch (err) {
      setError(`Einspielen fehlgeschlagen: ${err?.message || 'unbekannter Fehler'}. Bereits übernommene Daten bleiben erhalten, du kannst es nochmals versuchen.`);
      setProgress(null);
    }
  };

  const count = (n) => parsed?.data[n]?.length || 0;
  const busy = progress && !result;

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Backup einspielen</DialogTitle>
          <DialogDescription>
            Datei aus der GitHub-Version (Benutzermenü → Backup herunterladen). Bestehendes wird mit dem Stand
            aus dem Backup aktualisiert, Neues angelegt. Gelöscht wird nichts, mehrfaches Einspielen verdoppelt nichts.
          </DialogDescription>
        </DialogHeader>

        {!parsed && (
          <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl p-6 cursor-pointer hover:bg-muted/50 transition-colors">
            <FileArrowUp size={32} />
            <span className="font-medium">Backup-Datei auswählen</span>
            <span className="text-xs text-muted-foreground">classroomtools-backup-….json</span>
            <input type="file" accept="application/json,.json" className="hidden" onChange={onFile} />
          </label>
        )}

        {parsed && !result && (
          <div className="rounded-xl bg-muted/60 p-3 space-y-1 text-sm">
            <p className="font-medium">
              Gefunden{parsed.userEmail ? ` (${parsed.userEmail})` : ''}
              {parsed.exportedAt ? `, Stand ${new Date(parsed.exportedAt).toLocaleString('de-CH')}` : ''}:
            </p>
            <ul className="grid grid-cols-2 gap-x-4">
              {ORDER.map((n) => <li key={n}>{LABELS[n]}: <b>{count(n)}</b></li>)}
            </ul>
          </div>
        )}

        {busy && (
          <div className="space-y-2">
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }} />
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <CircleNotch size={14} className="animate-spin" />{progress.done} von {progress.total} übernommen …
            </p>
          </div>
        )}

        {result && (
          <div className="space-y-2">
            <p className="flex items-center gap-2 font-medium text-[#34C759]"><CheckCircle size={20} weight="fill" />Fertig</p>
            <ul className="text-sm space-y-0.5">
              {ORDER.filter((n) => result[n].created + result[n].updated).map((n) => (
                <li key={n}>{LABELS[n]}: {result[n].created} neu, {result[n].updated} aktualisiert</li>
              ))}
            </ul>
          </div>
        )}

        {error && <p className="text-sm text-destructive flex gap-2"><Warning size={18} className="shrink-0" />{error}</p>}

        <DialogFooter>
          {result ? (
            <Button onClick={() => close(false)}>Schliessen</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => close(false)} disabled={busy}>Abbrechen</Button>
              <Button onClick={run} disabled={!parsed || busy}>
                {busy && <CircleNotch size={16} className="animate-spin" />}Einspielen
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
