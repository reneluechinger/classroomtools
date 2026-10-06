import React, { useState } from 'react';
import { GraduationCap, LogIn, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/api/supabase';

// Einmalige Anmeldung pro Gerät: Supabase merkt sich die Sitzung im Browser.
// Neue Konten werden in Supabase angelegt, nicht hier (Registrierung ist gesperrt).
export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const signIn = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) {
      setError(error.status === 429
        ? 'Zu viele Versuche. Bitte warte ein paar Minuten.'
        : 'E-Mail oder Passwort stimmt nicht.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-sm p-8 space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold">Classroom Tools</h1>
          <p className="text-sm text-muted-foreground">
            Einmal anmelden, danach merkt sich dieses Gerät die Anmeldung.
          </p>
        </div>

        <form onSubmit={signIn} className="space-y-3">
          <Input
            type="email" required autoFocus autoComplete="username"
            placeholder="E-Mail" value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            type="password" required autoComplete="current-password"
            placeholder="Passwort" value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" className="w-full" disabled={busy || !email || !password}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <LogIn className="w-4 h-4 mr-2" />}
            Anmelden
          </Button>
        </form>

        {error && <p className="text-sm text-destructive text-center">{error}</p>}
      </div>
    </div>
  );
}
