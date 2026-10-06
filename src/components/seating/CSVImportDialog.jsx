import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UploadSimple as Upload, FileText, WarningCircle as AlertCircle } from '@phosphor-icons/react';
import { parseCSV } from '@/lib/seating';

export default function CSVImportDialog({ open, onOpenChange, onImport }) {
  const [csvText, setCsvText] = useState('');
  const [preview, setPreview] = useState([]);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      setCsvText(text);
      const students = parseCSV(text);
      setPreview(students);
      setError(students.length === 0 ? 'Keine Schüler gefunden. Prüfe das Format.' : '');
    };
    reader.readAsText(file);
  };

  const handleTextChange = (text) => {
    setCsvText(text);
    if (text.trim()) {
      const students = parseCSV(text);
      setPreview(students);
      setError(students.length === 0 ? 'Keine Schüler gefunden.' : '');
    } else {
      setPreview([]);
      setError('');
    }
  };

  const handleImport = () => {
    if (preview.length > 0) {
      onImport(preview);
      setCsvText('');
      setPreview([]);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Schülerliste importieren (CSV)
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Button variant="outline" className="w-full" onClick={() => fileRef.current?.click()}>
              <Upload className="w-4 h-4 mr-2" />
              CSV-Datei auswählen
            </Button>
            <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFileUpload} />
          </div>

          <div className="text-xs text-muted-foreground">
            Format: <code className="bg-muted px-1 py-0.5 rounded">Vorname;Nachname;Geschlecht(m/w/d)</code>
          </div>

          <Textarea
            placeholder={"Max;Mustermann;m\nErika;Musterfrau;w\n..."}
            value={csvText}
            onChange={(e) => handleTextChange(e.target.value)}
            rows={6}
            className="font-mono text-sm"
          />

          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {preview.length > 0 && (
            <div className="bg-muted rounded-lg p-3 max-h-40 overflow-y-auto">
              <p className="text-sm font-medium mb-2">{preview.length} Schüler erkannt:</p>
              <div className="space-y-1">
                {preview.map((s, i) => (
                  <div key={i} className="text-xs flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold
                      ${s.gender === 'w' ? 'bg-pink-400' : s.gender === 'm' ? 'bg-blue-400' : 'bg-purple-400'}`}>
                      {s.gender.toUpperCase()}
                    </span>
                    {s.firstName} {s.lastName}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
          <Button onClick={handleImport} disabled={preview.length === 0}>
            {preview.length} Schüler importieren
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}