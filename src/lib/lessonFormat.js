// Lektionsplanung: Rohnotizen (wie im OneNote) in eine formatierte Lektion umwandeln.
// Ohne KI, nach festen Regeln. Der Wortlaut der Notizen bleibt erhalten.
import qrcode from 'qrcode-generator';

export const FORMS = {
  KL: { c: '#2f6fb5', l: '#dfe9f5', w: 'Klasse' },
  LG: { c: '#6b9bd6', l: '#e6eef8', w: 'Lehrgespräch' },
  LP: { c: '#7a5bb5', l: '#ebe5f4', w: 'Lehrperson zeigt' },
  TPS: { c: '#c99212', l: '#f6ecd2', w: 'Denken, Austauschen, Vorstellen' },
  PA: { c: '#2f8a4f', l: '#dcefe3', w: 'Partnerarbeit' },
  GA: { c: '#d0662b', l: '#f8e2d5', w: 'Gruppenarbeit' },
  EA: { c: '#7d8894', l: '#e9ecef', w: 'Einzelarbeit' },
  Orga: { c: '#a8b0b8', l: '#eef0f2', w: 'Organisation' },
};

const FORM_ALIASES = { DAV: 'TPS' };

// Sozialform-Kürzel erkennen (Gross-/Kleinschreibung egal), DAV = TPS
export function normForm(token) {
  const t = String(token || '').trim().replace(/:$/, '');
  if (!t) return '';
  const up = t.toUpperCase();
  if (FORM_ALIASES[up]) return FORM_ALIASES[up];
  return Object.keys(FORMS).find((k) => k.toUpperCase() === up) || '';
}

// Emoji nach Stichworten, die erste passende Regel gewinnt
const EMOJI_RULES = [
  [/blooket|kahoot|quiz|quizlet/, '🎮'],
  [/video|film|youtube|youtu\.be|playlist|clip/, '🎬'],
  [/simulation|phet|walter-fendt|applet/, '🖥️'],
  [/experiment|demonstration|versuch|lehrerexperiment/, '🧪'],
  [/test\b|lernkontrolle|prüfung|probe/, '✅'],
  [/repetition|repetieren|wiederhol/, '🔁'],
  [/erklären|besprech|diskussion|diskutier|austausch/, '💬'],
  [/lesen|lektüre|\btext\b/, '📖'],
  [/eintrag|heft|sicherung|festhalten|notier/, '📌'],
  [/\bab\s?\d*\b|arbeitsblatt|auftrag|aufgabe|übung/, '📝'],
  [/theorie|input|einführung/, '🧠'],
  [/start|einstieg|begrüssung/, '🚀'],
];
export function pickEmoji(text) {
  const t = String(text || '').toLowerCase();
  for (const [re, e] of EMOJI_RULES) if (re.test(t)) return e;
  return '📍';
}

const URL_RE = /https?:\/\/[^\s<>"')]+/g;

// Kurzer Name für einen Link, abgeleitet aus der Adresse
export function linkName(url) {
  let host = '';
  try { host = new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
  if (/blooket/.test(host)) return 'Blooket';
  if (/kahoot/.test(host)) return 'Kahoot';
  if (/youtube|youtu\.be/.test(host)) return /list=/.test(url) ? 'Video-Playlist' : 'Video';
  if (/walter-fendt|phet/.test(host)) return 'Simulation';
  if (/learningapps/.test(host)) return 'LearningApps';
  if (/docs\.google/.test(host)) return 'Google-Dokument';
  if (/claude\.ai/.test(host)) return 'Artefakt';
  if (/onedrive|sharepoint/.test(host)) return 'OneDrive';
  return host;
}

// Titel = erster Satzteil, höchstens 8 Wörter
function shortTitle(text) {
  const first = text.split(/,|\.\s|\s[-–]\s|\(|:\s|→/)[0].trim();
  const words = first.split(/\s+/).filter(Boolean);
  return words.length > 8 ? words.slice(0, 8).join(' ') + ' …' : first;
}

const tidy = (s) => s.replace(/->/g, '→').replace(/ß/g, 'ss').replace(/\s{2,}/g, ' ').trim();

export function parseLesson(raw) {
  const lesson = { organisation: [], schritte: [], hausaufgaben: [] };
  let current = null;

  const newStep = (fields) => {
    current = { min: null, sozialform: '', emoji: '', titel: '', nurKlasse: '', notizen: [], material: '', links: [], ...fields };
    lesson.schritte.push(current);
  };

  for (const rawLine of String(raw || '').split(/\r?\n/)) {
    let line = rawLine.trim();
    if (!line) continue;

    // Links herauslösen, sie stehen separat
    const urls = line.match(URL_RE) || [];
    line = tidy(line.replace(URL_RE, ' '));

    // «… Material 2 Lautsprecher» am Zeilenende abtrennen
    let inlineMat = '';
    const im = line.match(/^(.+?)[.,;]?\s+Material:?\s+(.+)$/i);
    if (im) { line = im[1].trim(); inlineMat = im[2].trim(); }
    const addMat = (step) => {
      if (inlineMat && step) step.material = step.material ? `${step.material}, ${inlineMat}` : inlineMat;
    };

    // Pause
    const pause = line.match(/^pause\b[:\s-]*(.*)$/i);
    if (pause) {
      lesson.schritte.push({ pause: true, titel: pause[1] ? `Pause: ${pause[1]}` : 'Pause' });
      current = null;
      continue;
    }

    // Hausaufgaben
    const hw = line.match(/^(ha|hausaufgaben?|hausi)\b[:\s-]*(.*)$/i);
    if (hw) { if (hw[2]) lesson.hausaufgaben.push(hw[2]); continue; }

    // Material zum aktuellen Schritt
    const mat = line.match(/^material\b[:\s]*(.*)$/i);
    if (mat && current) {
      current.material = current.material ? `${current.material}, ${mat[1]}` : mat[1];
      current.links.push(...urls.map((u) => ({ name: linkName(u), url: u })));
      continue;
    }

    // Neuer Schritt: «20 KL Titel», «KL Titel», «sb Titel»
    const m = line.match(/^(\d{1,3})\s*(?:min\.?|'|’)?\s+(.*)$/i);
    let minutes = null;
    let rest = line;
    if (m) { minutes = Number(m[1]); rest = m[2]; }

    const [firstWord = '', ...others] = rest.split(/\s+/);
    const form = normForm(firstWord);
    // «KL: …» ohne Minuten ist eine Notiz im laufenden Schritt, kein neuer Schritt
    const isNoteWithForm = !m && form && firstWord.endsWith(':') && current;
    const klasse = /^s[a-f]$/i.test(firstWord) ? firstWord.toLowerCase() : '';

    if (m || (form && !isNoteWithForm) || klasse) {
      const text = form || klasse ? others.join(' ') : rest;
      const titel = shortTitle(text) || (form ? FORMS[form].w : 'Schritt');
      newStep({
        min: minutes,
        sozialform: form,
        nurKlasse: klasse,
        titel,
        notizen: text && text !== titel ? [text] : [],
        links: urls.map((u) => ({ name: linkName(u), url: u })),
      });
      addMat(current);
      continue;
    }

    // Sonst: Notiz zum laufenden Schritt, vor dem ersten Schritt zur Organisation
    if (current) {
      if (line) current.notizen.push(line);
      addMat(current);
      current.links.push(...urls.map((u) => ({ name: linkName(u), url: u })));
    } else if (line || urls.length) {
      lesson.organisation.push(line || urls.join(' '));
    }
  }

  for (const s of lesson.schritte) {
    if (s.pause) continue;
    s.emoji = pickEmoji([s.titel, ...s.notizen, ...s.links.map((l) => l.url)].join(' '));
  }
  return lesson;
}

// ── Ausgabe für OneNote (Inline-Styles, damit das Einfügen die Formatierung behält) ──

export const ON_STYLE = 'font-family:Calibri,Arial,sans-serif;font-size:11pt;color:#18222d';
const TD = 'border:1px solid #bcc7d2;padding:6px 9px;vertical-align:top';
const h = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const P = (t, st = '') => `<p style="margin:2px 0;${st}">${t}</p>`;

function qrImg(url) {
  try {
    const c = qrcode(0, 'M');
    c.addData(String(url));
    c.make();
    const px = c.getModuleCount() * 3 + 12;
    return `<br><img src="${c.createDataURL(3, 2)}" width="${px}" height="${px}" alt="QR-Code ${h(url)}" style="margin:2px 0 6px">`;
  } catch {
    return '';
  }
}
const lnk = (k) => `<a href="${h(k.url)}" target="_blank" rel="noopener">${h(k.name || k.url)}</a>`;
const headTitle = (d) => (d.kopf ? `${d.kopf}${d.titel ? ` · ${d.titel}` : ''}` : d.titel || 'Lektion');

function headRows(d) {
  let n = 0;
  const sum = d.schritte.map((s) => (s.pause
    ? P(`☕ ${h(s.titel || 'Pause')}`, 'color:#5a6775;padding-left:18px')
    : P(`${++n}. <b>${h(s.emoji)} ${h(s.titel)}</b>${s.nurKlasse ? ` <span style="background:#dbe7f5;color:#1f5fa8;font-weight:bold">&nbsp;nur ${h(s.nurKlasse)}&nbsp;</span>` : ''}`))).join('');
  const goals = (d.lernziele || []).length
    ? P('<b>🎯 Am Ende der Lektion …</b>', 'margin-top:10px') + d.lernziele.map((x) => P('• ' + h(x), 'padding-left:18px')).join('')
    : '';
  return `<tr><td colspan="3" style="${TD};background:#e8edf2"><span style="font-size:16pt"><b>${h(headTitle(d))}</b></span></td></tr>
    <tr><td colspan="3" style="${TD};font-size:12pt">${sum}${goals}</td></tr>`;
}

function stepRows(d, withQr) {
  const orga = d.organisation.length
    ? `<tr><td colspan="3" style="${TD};background:#fff7dc">${P('<b>📋 Organisation</b>')}${d.organisation.map((o) => P('☐ ' + h(o))).join('')}</td></tr>`
    : '';
  const rows = d.schritte.map((s) => {
    if (s.pause) return `<tr><td colspan="3" style="${TD};background:#e8edf2;text-align:center"><b>☕ ${h(s.titel || 'Pause')}</b></td></tr>`;
    const f = FORMS[s.sozialform];
    return `<tr><td style="${TD};width:64px;${f ? `background:${f.l};border-left:4px solid ${f.c}` : ''}"><b>${s.min ? s.min + "'" : '–'}</b>${s.sozialform ? `<br><span style="color:${f ? f.c : '#5a6775'};font-weight:bold">${h(s.sozialform)}</span>` : ''}</td>
      <td style="${TD}">${P(`<b>${h(s.emoji)} ${h(s.titel)}</b>${s.nurKlasse ? ` <span style="color:#1f5fa8;font-weight:bold">(nur ${h(s.nurKlasse)})</span>` : ''}`)}${s.notizen.map((x) => P('• ' + h(x))).join('')}</td>
      <td style="${TD};width:28%">${s.links.map((k) => P('🔗 ' + lnk(k) + (withQr ? qrImg(k.url) : ''))).join('')}${s.material ? P('🧰 ' + h(s.material)) : ''}</td></tr>`;
  }).join('');
  const hw = d.hausaufgaben.length
    ? `<tr><td colspan="3" style="${TD};background:#fff7dc">${P('<b>🏠 Hausaufgaben</b>')}${d.hausaufgaben.map((x) => P('• ' + h(x))).join('')}</td></tr>`
    : '';
  return orga + rows + hw;
}

const table = (rows) => `<table style="border-collapse:collapse;width:100%">${rows}</table>`;
export const fullHTML = (d, withQr = true) => table(headRows(d) + stepRows(d, withQr));
export const studentHTML = (d) => table(headRows(d));

export function studentText(d) {
  let n = 0;
  return [
    headTitle(d),
    ...d.schritte.map((s) => (s.pause ? `   ☕ ${s.titel || 'Pause'}` : `${++n}. ${s.emoji} ${s.titel}${s.nurKlasse ? ` (nur ${s.nurKlasse})` : ''}`)),
    ...((d.lernziele || []).length ? ['', '🎯 Am Ende der Lektion …', ...d.lernziele.map((x) => '• ' + x)] : []),
  ].join('\n');
}

export function teacherText(d) {
  return [
    ...(d.organisation.length ? ['📋 Organisation', ...d.organisation.map((o) => '☐ ' + o), ''] : []),
    ...d.schritte.flatMap((s) => (s.pause ? [`☕ ${s.titel || 'Pause'}`] : [
      `${s.min ? s.min + "' " : ''}${s.sozialform ? s.sozialform + '  ' : ''}${s.emoji} ${s.titel}${s.nurKlasse ? ` (nur ${s.nurKlasse})` : ''}`,
      ...s.notizen.map((x) => '      • ' + x),
      ...s.links.map((k) => `      🔗 ${k.name}: ${k.url}`),
      ...(s.material ? ['      🧰 ' + s.material] : []),
    ])),
    ...(d.hausaufgaben.length ? ['', '🏠 Hausaufgaben', ...d.hausaufgaben.map((x) => '• ' + x)] : []),
  ].join('\n');
}

// In die Zwischenablage, als formatiertes HTML (OneNote) mit Text als Rückfallebene
export async function copyRich(html, text) {
  try {
    if (window.ClipboardItem && navigator.clipboard?.write) {
      await navigator.clipboard.write([new window.ClipboardItem({
        'text/html': new Blob([`<div style="${ON_STYLE}">${html}</div>`], { type: 'text/html' }),
        'text/plain': new Blob([text], { type: 'text/plain' }),
      })]);
      return 'html';
    }
  } catch { /* weiter mit Text */ }
  await navigator.clipboard.writeText(text);
  return 'text';
}
