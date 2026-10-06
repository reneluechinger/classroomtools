import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Moon, Sun, Question, Sparkle, CloudArrowUp, DownloadSimple, SignOut } from '@phosphor-icons/react';
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
        <button
          type="button"
          aria-label="Benutzermenü"
          className="w-9 h-9 rounded-full bg-gradient-to-b from-[#A1A1AA] to-[#71717A] text-white text-[13px] font-semibold flex items-center justify-center shadow-sm active:scale-95 transition-transform"
        >
          {(email || '?').slice(0, 2).toUpperCase()}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="font-normal">
          <p className="text-xs text-muted-foreground">Angemeldet als</p>
          <p className="text-sm font-medium truncate">{email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onToggleDarkMode(); }}>
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          {isDarkMode ? 'Heller Modus' : 'Dunkler Modus'}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onShowGuide}>
          <Question size={18} />Kurzanleitung
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onShowChangelog}>
          <Sparkle size={18} />Was ist neu
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate('/import')}>
          <CloudArrowUp size={18} />Daten aus base44 übernehmen
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => downloadBackup(email)}>
          <DownloadSimple size={18} />Backup herunterladen
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={logout} className="text-destructive focus:text-destructive">
          <SignOut size={18} />Abmelden
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
