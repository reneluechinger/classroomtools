import React, { useState } from 'react';
import { CaretUpDown, Check, Plus, PencilSimple, Trash } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { IconTile } from '@/components/ios';
import ConfirmDeleteDialog from './ConfirmDeleteDialog';

// Auswahl als iOS-Kontextmenü: Liste mit Häkchen, darunter Neu / Umbenennen / Löschen
export default function EntityPicker({
  items, selectedId, onSelect, onCreate, onDelete, onRename,
  icon, color, noun, placeholder, describe, createPlaceholder,
}) {
  const [dialog, setDialog] = useState(null); // 'create' | 'rename' | 'delete'
  const [name, setName] = useState('');
  const selected = items.find((i) => i.id === selectedId);

  const submit = () => {
    const v = name.trim();
    if (!v) return;
    if (dialog === 'create') onCreate(v);
    if (dialog === 'rename') onRename(selectedId, v);
    setDialog(null);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2.5 h-10 pl-1.5 pr-3 rounded-xl bg-card hover:bg-muted transition-colors shadow-sm shrink-0 max-w-[220px]"
          >
            <IconTile icon={icon} color={color} />
            <div className="min-w-0 text-left leading-tight">
              <div className="text-[11px] text-muted-foreground">{noun}</div>
              <div className="text-[14px] font-semibold truncate">{selected ? selected.name : placeholder}</div>
            </div>
            <CaretUpDown size={14} weight="bold" className="text-muted-foreground shrink-0 ml-auto" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          {items.length > 0 && <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">{noun} wählen</DropdownMenuLabel>}
          {items.map((i) => (
            <DropdownMenuItem key={i.id} onSelect={() => onSelect(i.id)}>
              <span className="w-4 shrink-0">{i.id === selectedId && <Check size={16} weight="bold" className="text-primary" />}</span>
              <span className="flex-1 truncate">{i.name}</span>
              <span className="text-xs text-muted-foreground">{describe(i)}</span>
            </DropdownMenuItem>
          ))}
          {items.length > 0 && <DropdownMenuSeparator />}
          <DropdownMenuItem onSelect={() => { setName(''); setDialog('create'); }}>
            <Plus size={16} className="ml-0" /> Neu …
          </DropdownMenuItem>
          {selected && (
            <>
              <DropdownMenuItem onSelect={() => { setName(selected.name); setDialog('rename'); }}>
                <PencilSimple size={16} /> Umbenennen …
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setDialog('delete')} className="text-destructive focus:text-destructive">
                <Trash size={16} /> Löschen …
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDeleteDialog
        open={dialog === 'delete'}
        onOpenChange={(o) => !o && setDialog(null)}
        itemName={selected?.name || ''}
        onConfirm={() => { onDelete(selectedId); setDialog(null); }}
      />

      <Dialog open={dialog === 'create' || dialog === 'rename'} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{dialog === 'create' ? `${noun} erstellen` : `${noun} umbenennen`}</DialogTitle>
          </DialogHeader>
          <Input
            placeholder={createPlaceholder}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>Abbrechen</Button>
            <Button onClick={submit} disabled={!name.trim()}>{dialog === 'create' ? 'Erstellen' : 'Sichern'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
