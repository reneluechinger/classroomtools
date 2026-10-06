import React from 'react';
import { Button } from "@/components/ui/button";
import { Upload, UserX, ShieldAlert, Heart, MapPin } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

export default function StudentListPanel({ 
  students = [], 
  assignments = [],
  onOpenImport, 
  onOpenBlacklist,
  onOpenMustSitTogether,
  onOpenFixedSeats,
  onRemoveStudent,
}) {
  const assignedIds = new Set(assignments.map(a => a.studentId));
  const unassigned = students.filter(s => !assignedIds.has(s.id));
  const maleCount = students.filter(s => s.gender === 'm').length;
  const femaleCount = students.filter(s => s.gender === 'w').length;
  const otherCount = students.filter(s => s.gender === 'd').length;

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <h3 className="font-semibold text-sm">Lernende</h3>
      <div className="grid grid-cols-2 gap-1.5">
        <Button variant="outline" size="sm" onClick={onOpenImport} className="justify-start">
          <Upload className="w-3.5 h-3.5 mr-1.5" />CSV-Import
        </Button>
        <Button variant="outline" size="sm" onClick={onOpenFixedSeats} className="justify-start">
          <MapPin className="w-3.5 h-3.5 mr-1.5" />Fixplatz
        </Button>
        <Button variant="outline" size="sm" onClick={onOpenBlacklist} className="justify-start">
          <ShieldAlert className="w-3.5 h-3.5 mr-1.5" />Trennen
        </Button>
        <Button variant="outline" size="sm" onClick={onOpenMustSitTogether} className="justify-start">
          <Heart className="w-3.5 h-3.5 mr-1.5" />Zusammen
        </Button>
      </div>

      <div className="flex gap-2 text-xs">
        <Badge variant="secondary">{students.length} Total</Badge>
        {maleCount > 0 && <Badge className="bg-blue-100 text-blue-700 border-blue-300">{maleCount} m</Badge>}
        {femaleCount > 0 && <Badge className="bg-pink-100 text-pink-700 border-pink-300">{femaleCount} w</Badge>}
        {otherCount > 0 && <Badge className="bg-purple-100 text-purple-700 border-purple-300">{otherCount} d</Badge>}
      </div>

      {unassigned.length > 0 && (
        <div className="text-xs text-muted-foreground">
          {unassigned.length} nicht platziert
        </div>
      )}

      <div className="max-h-64 overflow-y-auto space-y-1">
        {students.map(s => {
          const isAssigned = assignedIds.has(s.id);
          return (
            <div key={s.id} className={`flex items-center justify-between px-2 py-1 rounded text-sm
              ${isAssigned ? 'bg-muted/50' : 'bg-amber-50 border border-amber-200'}`}>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full
                  ${s.gender === 'w' ? 'bg-pink-400' : s.gender === 'm' ? 'bg-blue-400' : 'bg-purple-400'}`} />
                <span className="truncate">{s.firstName} {s.lastName}</span>
                {s.fixedTableId && <MapPin className="w-3 h-3 text-primary opacity-60" />}
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6 opacity-50 hover:opacity-100"
                onClick={() => onRemoveStudent(s.id)}>
                <UserX className="w-3 h-3" />
              </Button>
            </div>
          );
        })}
        {students.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">
            Noch keine Schüler. Importiere eine CSV-Datei.
          </p>
        )}
      </div>
    </div>
  );
}