import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, BookmarkSimple as Bookmark, Copy, Check, FileArrowUp as FileUp, CircleNotch as Loader2, CheckCircle as CheckCircle2, Warning as AlertTriangle } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { entities, upsertRecords } from '@/api/db';
import { useAuth } from '@/lib/AuthContext';
import { bookmarkletHref, exportScriptSource } from '@/lib/base44Export';
import { parseExportFile, LABELS, IMPORTABLE } from '@/lib/importData';

function Step({ n, title, children }) {
  return (
    <section className="bg-card border border-border rounded-xl p-5 space-y-3">
      <h2 className="font-semibold flex items-center gap-3">
        <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center shrink-0">{n}</span>
        {title}
      </h2>
      <div className="text-sm text-muted-foreground space-y-3 pl-10">{children}</div>
    </section>
  );
}

export default function ImportPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const linkRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [parsed, setParsed] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  // React warnt bei javascript:-Links im JSX, darum wird href direkt gesetzt
  useEffect(() => {
    linkRef.current?.setAttribute('href', bookmarkletHref);
  }, []);

  const copyScript = async () => {
    await navigator.clipboard.writeText(exportScriptSource);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setDone(false);
    try {
      setParsed(parseExportFile(await file.text()));
    } catch (err) {
      setParsed(null);
      setError(err.message);
    }
  };

  const runImport = async () => {
    setBusy(true);
    setError('');
    try {
      if (parsed.counts.AppSettings > 0) {
        const existing = await entities.AppSettings.list();
        for (const s of existing) await entities.AppSettings.delete(s.id);
      }
      await upsertRecords(parsed.rows);
      await queryClient.invalidateQueries();
      setDone(true);
      toast.success('Import abgeschlossen');
    } catch (err) {
      setError('Import fehlgeschlagen: ' + (err.message || 'unbekannter Fehler'));
    } finally {
      setBusy(false);
    }
  };

  const total = parsed ? parsed.rows.length : 0;
  const otherAccount = parsed?.userEmail && user?.email && parsed.userEmail.toLowerCase() !== user.email.toLowerCase();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Zurück zur App
        </Link>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Daten aus base44 übernehmen</h1>
          <p className="text-sm text-muted-foreground">
            Deine Klassen, Räume, Sitzpläne, Strichlisten und QR-Codes kommen in drei Schritten hierher.
            Das dauert etwa zwei Minuten. Mehrfaches Importieren ist kein Problem: Bereits übernommene Daten werden aktualisiert, nicht verdoppelt.
          </p>
        </div>

        <Step n={1} title="Export-Lesezeichen anlegen">
          <p>Zieh diesen Knopf mit der Maus in deine Lesezeichenleiste:</p>
          <a
            ref={linkRef}
            onClick={(e) => { e.preventDefault(); toast.info('Nicht hier klicken: In die Lesezeichenleiste ziehen.'); }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium cursor-grab"
          >
            <Bookmark className="w-4 h-4" /> Classroom-Export
          </a>
          <p className="text-xs">
            Keine Lesezeichenleiste sichtbar? Drücke <kbd className="px-1 border rounded">Ctrl</kbd>+<kbd className="px-1 border rounded">Shift</kbd>+<kbd className="px-1 border rounded">B</kbd> (Mac: <kbd className="px-1 border rounded">⌘</kbd>+<kbd className="px-1 border rounded">Shift</kbd>+<kbd className="px-1 border rounded">B</kbd>).
          </p>
          <details className="text-xs">
            <summary className="cursor-pointer">Alternative für Fortgeschrittene: Code in der Konsole ausführen</summary>
            <div className="mt-2 space-y-2">
              <p>In der base44-App F12 drücken, Tab «Console» öffnen, Code einfügen und Enter drücken. Chrome verlangt beim ersten Mal, dass du <code>allow pasting</code> eintippst.</p>
              <Button variant="outline" size="sm" onClick={copyScript}>
                {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                Code kopieren
              </Button>
            </div>
          </details>
        </Step>

        <Step n={2} title="In base44 exportieren">
          <ol className="list-decimal pl-5 space-y-1">
            <li>Öffne deine alte Classroom-Tools-App auf base44 und melde dich an, wie du es gewohnt bist.</li>
            <li>Klicke dort auf das Lesezeichen <strong>Classroom-Export</strong>.</li>
            <li>Eine Datei <code>base44-export-….json</code> landet in deinem Download-Ordner.</li>
          </ol>
          <p className="text-xs">Das Skript liest nur deine eigenen Daten und schickt sie nirgendwohin. Die Datei bleibt auf deinem Computer.</p>
        </Step>

        <Step n={3} title="Datei hier hochladen">
          <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl p-6 cursor-pointer hover:bg-muted/50 transition-colors">
            <FileUp className="w-8 h-8" />
            <span className="font-medium text-foreground">JSON-Datei auswählen</span>
            <span className="text-xs">Auch ein Backup aus dieser App funktioniert</span>
            <input type="file" accept="application/json,.json" className="hidden" onChange={onFile} />
          </label>

          {parsed && (
            <div className="space-y-3">
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-foreground font-medium mb-1">Gefunden{parsed.userEmail ? ` (${parsed.userEmail})` : ''}:</p>
                <ul className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                  {IMPORTABLE.map((k) => (
                    <li key={k}>{LABELS[k]}: <strong className="text-foreground">{parsed.counts[k]}</strong></li>
                  ))}
                </ul>
              </div>
              {otherAccount && (
                <p className="flex gap-2 text-amber-600">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  Die Datei stammt von {parsed.userEmail}, du bist als {user.email} angemeldet. Die Daten werden trotzdem deinem aktuellen Konto zugeordnet.
                </p>
              )}
              {done ? (
                <div className="flex items-center gap-2 text-green-600 font-medium">
                  <CheckCircle2 className="w-5 h-5" /> Fertig! <Link to="/" className="underline">Zur App</Link>
                </div>
              ) : (
                <Button onClick={runImport} disabled={busy || total === 0}>
                  {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {total} Einträge importieren
                </Button>
              )}
            </div>
          )}
          {error && <p className="text-destructive">{error}</p>}
        </Step>
      </div>
    </div>
  );
}
