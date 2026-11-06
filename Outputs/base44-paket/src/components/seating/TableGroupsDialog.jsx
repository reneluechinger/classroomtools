import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, LinkSimple as Link2, Plus } from '@phosphor-icons/react';
import { Checkbox } from "@/components/ui/checkbox";

export default function TableGroupsDialog({ open, onOpenChange, tables = [], tableGroups = [], onUpdate }) {
  const [selectedTables, setSelectedTables] = useState([]);

  const addGroup = () => {
    if (selectedTables.length < 2) return;
    const newGroup = {
      id: `group-${Date.now()}`,
      tableIds: [...selectedTables]
    };
    onUpdate([...tableGroups, newGroup]);
    setSelectedTables([]);
  };

  const removeGroup = (index) => {
    onUpdate(tableGroups.filter((_, i) => i !== index));
  };

  const toggleTable = (tableId) => {
    if (selectedTables.includes(tableId)) {
      setSelectedTables(selectedTables.filter(id => id !== tableId));
    } else {
      setSelectedTables([...selectedTables, tableId]);
    }
  };

  const getTableName = (tableId) => {
    const table = tables.find(t => t.id === tableId);
    return table ? `T${table.number}` : tableId;
  };

  const isTableInAnyGroup = (tableId) => {
    return tableGroups.some(g => g.tableIds.includes(tableId));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-primary" />
            Tischgruppen definieren
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Wähle Tische aus, die zusammen eine Gruppe bilden (z.B. T1+T2). 
            Der Generator füllt zuerst 3er-Gruppen, dann 4er.
          </p>

          <div className="border rounded-lg p-3">
            <p className="text-xs font-medium mb-2">Tische auswählen:</p>
            <div className="grid grid-cols-4 gap-2">
              {tables.map(table => (
                <div key={table.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`table-${table.id}`}
                    checked={selectedTables.includes(table.id)}
                    onCheckedChange={() => toggleTable(table.id)}
                    disabled={isTableInAnyGroup(table.id)}
                  />
                  <label
                    htmlFor={`table-${table.id}`}
                    className={`text-sm cursor-pointer ${isTableInAnyGroup(table.id) ? 'text-muted-foreground' : ''}`}
                  >
                    T{table.number}
                  </label>
                </div>
              ))}
            </div>
            <Button 
              size="sm" 
              className="w-full mt-3" 
              onClick={addGroup}
              disabled={selectedTables.length < 2}
            >
              <Plus className="w-3 h-3 mr-1" />
              Gruppe erstellen ({selectedTables.length} Tische)
            </Button>
          </div>

          {tableGroups.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-medium">Definierte Gruppen:</p>
              {tableGroups.map((group, i) => (
                <div key={group.id} className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
                  <span className="text-sm font-medium">
                    {group.tableIds.map(id => getTableName(id)).join(' + ')}
                    <span className="text-muted-foreground ml-2">
                      ({group.tableIds.length * 2} Plätze)
                    </span>
                  </span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeGroup(i)}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Noch keine Gruppen definiert.
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