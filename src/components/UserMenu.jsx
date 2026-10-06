import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  CircleUserRound, Moon, Sun, HelpCircle, Sparkles, Upload, Download, LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/lib/AuthContext';
import { exportAll } from '@/api/db';
import { APP_VERSION } from '@/components/seating/ChangelogModal';

async function downloadBackup(email) {
  try {
    const data = await exportAll();
    const payload = {
      exportVersion: 1,
      exportedAt: new Date().toISOString(),
      userEmail: email,
      appVersion: APP_VERSION,
      source: 'classroomtools',
      entities: data,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `classroomtools-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  } catch {
    toast.error('Backup konnte nicht erstellt werden.');
  }
}

export default function UserMenu({ email, isDarkMode, onToggleDarkMode, onShowChangelog, onShowGuide }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full" aria-label="Benutzermenü">
          <CircleUserRound className="w-6 h-6" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="font-normal">
          <p className="text-xs text-muted-foreground">Angemeldet als</p>
          <p className="text-sm font-medium truncate">{email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onToggleDarkMode(); }}>
          {isDarkMode ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
          {isDarkMode ? 'Heller Modus' : 'Dunkler Modus'}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onShowGuide}>
          <HelpCircle className="w-4 h-4 mr-2" />Kurzanleitung
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onShowChangelog}>
          <Sparkles className="w-4 h-4 mr-2" />Was ist neu
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate('/import')}>
          <Upload className="w-4 h-4 mr-2" />Daten aus base44 übernehmen
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => downloadBackup(email)}>
          <Download className="w-4 h-4 mr-2" />Backup herunterladen
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={logout}>
          <LogOut className="w-4 h-4 mr-2" />Abmelden
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
