import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Plus, Users, Trash2, Pencil } from 'lucide-react';
import ConfirmDeleteDialog from './ConfirmDeleteDialog';

export default function ClassSelector({ classes, selectedClassId, onSelect, onCreate, onDelete, onRename }) {
  const [showCreate, setShowCreate] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [newName, setNewName] = useState('');
  const [renameName, setRenameName] = useState('');

  const handleCreate = () => {
    if (newName.trim()) {
      onCreate(newName.trim());
      setNewName('');
      setShowCreate(false);
    }
  };

  const handleRename = () => {
    if (renameName.trim()) {
      onRename(selectedClassId, renameName.trim());
      setRenameName('');
      setShowRename(false);
    }
  };

  const openRename = () => {
    const current = classes.find(c => c.id === selectedClassId);
    setRenameName(current?.name || '');
    setShowRename(true);
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Users className="w-4 h-4 text-muted-foreground" />
        <Select value={selectedClassId || ''} onValueChange={onSelect}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Klasse wählen..." />
          </SelectTrigger>
          <SelectContent>
            {classes.map(c => (
              <SelectItem key={c.id} value={c.id}>
                {c.name} ({c.students?.length || 0})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4" />
        </Button>
        {selectedClassId && (
          <Button variant="outline" size="icon" onClick={openRename}>
            <Pencil className="w-4 h-4" />
          </Button>
        )}
        {selectedClassId && (
          <Button variant="outline" size="icon" className="text-destructive hover:text-destructive" 
            onClick={() => setShowDelete(true)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      <ConfirmDeleteDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        itemName={classes.find(c => c.id === selectedClassId)?.name || ''}
        onConfirm={() => { onDelete(selectedClassId); setShowDelete(false); }}
      />

      <Dialog open={showRename} onOpenChange={setShowRename}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Klasse umbenennen</DialogTitle>
          </DialogHeader>
          <Input
            value={renameName}
            onChange={(e) => setRenameName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRename(false)}>Abbrechen</Button>
            <Button onClick={handleRename} disabled={!renameName.trim()}>Speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Neue Klasse erstellen</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="z.B. Klasse 5a"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Abbrechen</Button>
            <Button onClick={handleCreate} disabled={!newName.trim()}>Erstellen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}