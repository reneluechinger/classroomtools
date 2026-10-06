export function playHotelBell() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const now = ctx.currentTime;
  const duration = 3.5;

  // Fundamental
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(1760, now);
  gain1.gain.setValueAtTime(0, now);
  gain1.gain.linearRampToValueAtTime(0.6, now + 0.004);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + duration);
  osc1.start(now);
  osc1.stop(now + duration);

  // Metallic overtone
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(1760 * 2.756, now);
  gain2.gain.setValueAtTime(0, now);
  gain2.gain.linearRampToValueAtTime(0.25, now + 0.004);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.5);
  osc2.start(now);
  osc2.stop(now + duration * 0.5);

  // Higher shimmer
  const osc3 = ctx.createOscillator();
  const gain3 = ctx.createGain();
  osc3.connect(gain3);
  gain3.connect(ctx.destination);
  osc3.type = 'sine';
  osc3.frequency.setValueAtTime(1760 * 5.4, now);
  gain3.gain.setValueAtTime(0, now);
  gain3.gain.linearRampToValueAtTime(0.08, now + 0.004);
  gain3.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.3);
  osc3.start(now);
  osc3.stop(now + duration * 0.3);
}
