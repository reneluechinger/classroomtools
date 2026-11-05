import { describe, it, expect } from 'vitest';
import { parseLesson, linkName, pickEmoji, fullHTML, studentText } from '../lessonFormat';

const RAW = `10 Blooket als Start https://dashboard.blooket.com/set/6ab0d563f19795742e8e89db
10 DAV Dopplereffekt erklären auf Whiteboard https://www.walter-fendt.de/html5/phde/dopplereffekt_de.htm
20 KL Demonstration Wellenarten & stehende Wellen (Gang)
KL: Experiment mit der langen Feder im Gang -> Wellen kreieren, Transversal- und Longitudinalwellen
Stehende Wellen kreieren (Begriffe Wellenbauch und Knoten zeigen), Eintrag zu Amplitude und Frequenz
Material: lange Feder
sb Neben AB4 festhalten
PAUSE Pingpong
15 KL Medien-Sicherung Akustische Phänomene, Videos zu Chladnische Klangfiguren, Kundtsches Rohr, Schwebung. Repetition aller Begriffe
https://youtube.com/playlist?list=PL7Ku-aA5JphF6085UO_M_40H53FZTfNRo
10 LP Lehrerexperiment Interferenz, Schüler halten ein Ohr zu und gehen langsam vor den Lautsprechern durch, Abgrenzung von Resonanz und Interferenz. Material 2 Lautsprecher, Massband`;

describe('parseLesson', () => {
  const d = parseLesson(RAW);
  const steps = d.schritte;

  it('erkennt alle Schritte und die Pause in der richtigen Reihenfolge', () => {
    expect(steps.map((s) => (s.pause ? 'PAUSE' : s.min))).toEqual([10, 10, 20, null, 'PAUSE', 15, 10]);
  });

  it('liest Sozialformen, DAV wird TPS', () => {
    expect(steps.map((s) => s.sozialform || '')).toEqual(['', 'TPS', 'KL', '', '', 'KL', 'LP']);
  });

  it('hängt Links, Material und «KL:»-Notizen an den richtigen Schritt', () => {
    expect(steps[0].links[0]).toMatchObject({ name: 'Blooket' });
    expect(steps[1].links[0].name).toBe('Simulation');
    expect(steps[2].material).toBe('lange Feder');
    expect(steps[2].notizen).toHaveLength(3);
    expect(steps[2].notizen[1]).toMatch(/^KL: Experiment .* → Wellen/);
    expect(steps[5].links[0].name).toBe('Video-Playlist');
  });

  it('erkennt Klassenhinweis und Pausentitel', () => {
    expect(steps[3]).toMatchObject({ nurKlasse: 'sb', titel: 'Neben AB4 festhalten' });
    expect(steps[4]).toMatchObject({ pause: true, titel: 'Pause: Pingpong' });
  });

  it('kürzt lange Titel auf den ersten Satzteil, Wortlaut bleibt als Notiz', () => {
    expect(steps[5].titel).toBe('Medien-Sicherung Akustische Phänomene');
    expect(steps[5].notizen[0]).toMatch(/Repetition aller Begriffe$/);
    expect(steps[6].titel).toBe('Lehrerexperiment Interferenz');
    expect(steps[6].material).toBe('2 Lautsprecher, Massband');
    expect(steps[6].notizen[0]).toMatch(/Resonanz und Interferenz$/);
  });

  it('wählt passende Emojis', () => {
    expect(steps.filter((s) => !s.pause).map((s) => s.emoji)).toEqual(['🎮', '🖥️', '🧪', '📌', '🎬', '🧪']);
  });

  it('erzeugt OneNote-HTML mit QR-Codes und escapt Text', () => {
    const html = fullHTML({ ...parseLesson('5 KL <b>Test</b> https://example.org'), kopf: 'NT', lernziele: ['Ich kann X.'] });
    expect(html).toContain('&lt;b&gt;Test&lt;/b&gt;');
    expect(html).toContain('data:image/gif;base64');
    expect(html).toContain('Am Ende der Lektion');
  });
});

describe('Hilfsfunktionen', () => {
  it('Organisation vor dem ersten Schritt, Hausaufgaben', () => {
    const d = parseLesson('Tests einsammeln\n5 KL Start\nHA: S. 12 lösen');
    expect(d.organisation).toEqual(['Tests einsammeln']);
    expect(d.hausaufgaben).toEqual(['S. 12 lösen']);
  });
  it('linkName und Emoji-Standard', () => {
    expect(linkName('https://docs.google.com/x')).toBe('Google-Dokument');
    expect(pickEmoji('irgendwas')).toBe('📍');
  });
  it('Schülertext nummeriert Schritte, nicht Pausen', () => {
    const t = studentText({ ...parseLesson('5 KL A\nPAUSE\n5 PA B'), kopf: 'NT', lernziele: [] });
    expect(t.split('\n')).toEqual(['NT', '1. 📍 A', '   ☕ Pause', '2. 📍 B']);
  });
});
