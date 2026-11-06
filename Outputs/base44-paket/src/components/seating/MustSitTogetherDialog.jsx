import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Heart, Plus } from '@phosphor-icons/react';

export default function MustSitTogetherDialog({ open, onOpenChange, students = [], mustSitTogether = [], onUpdate }) {
  const [studentA, setStudentA] = useState('');
  const [studentB, setStudentB] = useState('');

  const addRule = () => {
    if (!studentA || !studentB || studentA === studentB) return;
    const exists = mustSitTogether.some(
      b => (b.studentA === studentA && b.studentB === studentB) ||
           (b.studentA === studentB && b.studentB === studentA)
    );
    if (!exists) {
      onUpdate([...mustSitTogether, { studentA, studentB }]);
    }
    setStudentA('');
    setStudentB('');
  };

  const removeRule = (index) => {
    onUpdate(mustSitTogether.filter((_, i) => i !== index));
  };

  const getName = (id) => {
    const s = students.find(s => s.id === id);
    return s ? `${s.firstName} ${s.lastName}` : 'Unbekannt';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary" />
            Zusammensitz-Regeln
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Lege fest, welche Schüler immer nebeneinander sitzen müssen.
          </p>

          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="text-xs font-medium text-muted-foreground">Schüler A</label>
              <Select value={studentA} onValueChange={setStudentA}>
                <SelectTrigger><SelectValue placeholder="Wählen..." /></SelectTrigger>
                <SelectContent>
                  {students.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.firstName} {s.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <span className="text-muted-foreground pb-2">+</span>
            <div className="flex-1">
              <label className="text-xs font-medium text-muted-foreground">Schüler B</label>
              <Select value={studentB} onValueChange={setStudentB}>
                <SelectTrigger><SelectValue placeholder="Wählen..." /></SelectTrigger>
                <SelectContent>
                  {students.filter(s => s.id !== studentA).map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.firstName} {s.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button size="icon" onClick={addRule} disabled={!studentA || !studentB}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {mustSitTogether.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {mustSitTogether.map((rule, i) => (
                <div key={i} className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
                  <span className="text-sm">
                    {getName(rule.studentA)} <span className="text-primary font-bold mx-2">+</span> {getName(rule.studentB)}
                  </span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeRule(i)}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Keine Zusammensitz-Regeln vorhanden.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Fertig</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}