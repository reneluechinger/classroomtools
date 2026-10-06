import React, { useState } from 'react';
import { GraduationCap, Mail, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/api/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState('email'); // 'email' | 'sent'
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const sendLink = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin + import.meta.env.BASE_URL },
    });
    setBusy(false);
    if (error) {
      setError(error.status === 429
        ? 'Zu viele Versuche. Bitte warte ein paar Minuten.'
        : 'Die E-Mail konnte nicht gesendet werden. Stimmt die Adresse?');
      return;
    }
    setStep('sent');
  };

  const verifyCode = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'email' });
    setBusy(false);
    if (error) setError('Der Code stimmt nicht oder ist abgelaufen.');
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
            {step === 'email'
              ? 'Melde dich mit deiner E-Mail-Adresse an. Du bekommst einen Anmeldelink, ein Passwort brauchst du nicht.'
              : <>Wir haben dir eine E-Mail an <strong className="text-foreground">{email}</strong> geschickt.</>}
          </p>
        </div>

        {step === 'email' ? (
          <form onSubmit={sendLink} className="space-y-3">
            <Input
              type="email" required autoFocus autoComplete="email"
              placeholder="name@schule.ch" value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button type="submit" className="w-full" disabled={busy || !email}>
              {busy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
              Anmeldelink senden
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <ol className="text-sm text-muted-foreground list-decimal pl-5 space-y-1">
              <li>Öffne die E-Mail und klicke auf den Link.</li>
              <li>Oder tippe den Code aus der E-Mail hier ein. Praktisch, wenn du die Mail auf dem Handy liest.</li>
            </ol>
            <form onSubmit={verifyCode} className="space-y-3">
              <Input
                inputMode="numeric" autoComplete="one-time-code" placeholder="Code aus der E-Mail"
                className="text-center tracking-[0.3em] text-lg placeholder:tracking-normal placeholder:text-sm"
                value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              />
              <Button type="submit" className="w-full" disabled={busy || code.length < 6}>
                {busy && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Anmelden
              </Button>
            </form>
            <button
              type="button" onClick={() => { setStep('email'); setCode(''); setError(''); }}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mx-auto"
            >
              <ArrowLeft className="w-3 h-3" /> Andere E-Mail-Adresse
            </button>
          </div>
        )}

        {error && <p className="text-sm text-destructive text-center">{error}</p>}
      </div>
    </div>
  );
}
