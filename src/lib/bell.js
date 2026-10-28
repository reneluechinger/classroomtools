// Sanfte Klänge für Klingel und Timer, direkt im Browser erzeugt (Web Audio).
// Bewusst tief, weich einsetzend und leise, damit nichts schrill wirkt.

let sharedCtx = null;
function getContext() {
  if (!sharedCtx) sharedCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (sharedCtx.state === 'suspended') sharedCtx.resume();
  return sharedCtx;
}

// Ein einzelner Glockenschlag: Grundton plus leise Obertöne einer Klangschale,
// zwei leicht verstimmte Grundtöne ergeben das warme «Schweben».
export function renderBell(ctx, destination, start, { freq = 392, volume = 0.16, length = 4 } = {}) {
  const out = ctx.createGain();
  out.gain.value = volume;

  // Hohe Anteile abdämpfen, damit es rund klingt
  const soften = ctx.createBiquadFilter();
  soften.type = 'lowpass';
  soften.frequency.value = 2400;
  soften.Q.value = 0.5;
  out.connect(soften).connect(destination);

  const partials = [
    { ratio: 1, gain: 1.0, decay: 1 },
    { ratio: 1.004, gain: 0.6, decay: 1 },   // leichtes Schweben
    { ratio: 2.71, gain: 0.22, decay: 0.55 },
    { ratio: 5.15, gain: 0.06, decay: 0.3 },
  ];
  for (const p of partials) {
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq * p.ratio;
    const end = start + length * p.decay;
    env.gain.setValueAtTime(0, start);
    env.gain.linearRampToValueAtTime(p.gain, start + 0.025);   // weicher Anschlag
    env.gain.exponentialRampToValueAtTime(0.0001, end);
    osc.connect(env).connect(out);
    osc.start(start);
    osc.stop(end + 0.05);
  }
}

// Klingel im Dock: ein ruhiger Klangschalen-Schlag
export function playChime() {
  const ctx = getContext();
  renderBell(ctx, ctx.destination, ctx.currentTime + 0.01, { freq: 392, volume: 0.16, length: 4.5 });
}

// Timer abgelaufen: derselbe Klangschalen-Schlag wie die Klingel
export function playTimerDone() {
  playChime();
}
