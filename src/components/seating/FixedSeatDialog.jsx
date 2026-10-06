import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, MapPin } from 'lucide-react';

export default function FixedSeatDialog({ open, onOpenChange, students = [], tables = [], onUpdate }) {
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedTableId, setSelectedTableId] = useState('');
  const [selectedSeatIndex, setSelectedSeatIndex] = useState('0');

  const fixedStudents = students.filter(s => s.fixedTableId);

  const addFixedSeat = () => {
    if (!selectedStudentId || !selectedTableId) return;
    const updated = students.map(s =>
      s.id === selectedStudentId
        ? { ...s, fixedTableId: selectedTableId, fixedSeatIndex: parseInt(selectedSeatIndex) }
        : s
    );
    onUpdate(updated);
    setSelectedStudentId('');
    setSelectedTableId('');
    setSelectedSeatIndex('0');
  };

  const removeFixedSeat = (studentId) => {
    const updated = students.map(s =>
      s.id === studentId ? { ...s, fixedTableId: undefined, fixedSeatIndex: undefined } : s
    );
    onUpdate(updated);
  };

  const getTableName = (id) => {
    const t = tables.find(t => t.id === id);
    return t ? `T${t.number}` : '?';
  };

  const availableStudents = students.filter(s => !s.fixedTableId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Fixplätze definieren
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Weise einem Schüler einen festen Platz zu. Er sitzt immer dort, unabhängig von der Zufallsverteilung.
          </p>

          <div className="grid grid-cols-3 gap-2 items-end">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Schüler</label>
              <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                <SelectTrigger><SelectValue placeholder="Wählen..." /></SelectTrigger>
                <SelectContent>
                  {availableStudents.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Tisch</label>
              <Select value={selectedTableId} onValueChange={setSelectedTableId}>
                <SelectTrigger><SelectValue placeholder="Tisch..." /></SelectTrigger>
                <SelectContent>
                  {tables.map(t => (
                    <SelectItem key={t.id} value={t.id}>T{t.number}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Platz</label>
              <Select value={selectedSeatIndex} onValueChange={setSelectedSeatIndex}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Links</SelectItem>
                  <SelectItem value="1">Rechts</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button className="w-full" onClick={addFixedSeat} disabled={!selectedStudentId || !selectedTableId}>
            <MapPin className="w-4 h-4 mr-2" />
            Fixplatz zuweisen
          </Button>

          {fixedStudents.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-medium">Fixplätze:</p>
              {fixedStudents.map(s => (
                <div key={s.id} className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
                  <span className="text-sm">
                    <span className="font-medium">{s.firstName} {s.lastName}</span>
                    <span className="text-muted-foreground ml-2">
                      → {getTableName(s.fixedTableId)}, {s.fixedSeatIndex === 0 ? 'Links' : 'Rechts'}
                    </span>
                  </span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeFixedSeat(s.id)}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-2">Noch keine Fixplätze definiert.</p>
          )}
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Fertig</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}