import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ClipboardText, Student, Question } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { parseLesson, fullHTML, studentHTML, studentText, teacherText, copyRich, ON_STYLE, FORMS } from '@/lib/lessonFormat';

const EXAMPLE = `10 Blooket als Start https://dashboard.blooket.com/set/6ab0d563f19795742e8e89db
10 DAV Dopplereffekt erklären auf Whiteboard https://www.walter-fendt.de/html5/phde/dopplereffekt_de.htm
20 KL Demonstration Wellenarten & stehende Wellen (Gang)
Experiment mit der langen Feder im Gang -> Wellen kreieren
Material: lange Feder
sb Neben AB4 festhalten
PAUSE Pingpong
15 KL Videos zu Chladnischen Klangfiguren https://youtube.com/playlist?list=PL7Ku-aA5JphF6085UO_M_40H53FZTfNRo
10 LP Lehrerexperiment Interferenz. Material 2 Lautsprecher, Massband`;

const empty = { kopf: '', titel: '', raw: '', ziele: '' };
const load = (key) => { try { return { ...empty, ...JSON.parse(localStorage.getItem(key)) }; } catch { return empty; } };

export default function LessonPlanner({ classId, className }) {
  const key = `lesson_draft_${classId || 'ohne'}`;
  const [draft, setDraft] = useState(() => load(key));
  const [withQr, setWithQr] = useState(true);
  const [showHelp, setShowHelp] = useState(false);

  // Beim Klassenwechsel den Entwurf dieser Klasse laden
  useEffect(() => { setDraft(load(key)); }, [key]);
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(draft)); } catch { /* egal */ } }, [key, draft]);

  const set = (field) => (e) => setDraft((d) => ({ ...d, [field]: e.target.value }));

  const lesson = useMemo(() => ({
    ...parseLesson(draft.raw),
    kopf: draft.kopf.trim() || className || '',
    titel: draft.titel.trim(),
    lernziele: draft.ziele.split('\n').map((z) => z.trim()).filter(Boolean),
  }), [draft, className]);

  const hasSteps = lesson.schritte.length > 0;
  const preview = useMemo(() => (hasSteps ? fullHTML(lesson, withQr) : ''), [lesson, withQr, hasSteps]);

  const copy = async (studentOnly) => {
    const how = studentOnly
      ? await copyRich(studentHTML(lesson), studentText(lesson))
      : await copyRich(fullHTML(lesson, withQr), `${studentText(lesson)}\n\n${teacherText(lesson)}`);
    toast.success(how === 'html' ? 'Kopiert. In OneNote einfügen.' : 'Als Text kopiert. In OneNote einfügen.');
  };

  const label = 'text-[13px] uppercase tracking-wide text-muted-foreground px-1';

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] items-start">
      {/* Eingabe */}
      <section className="bg-card rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[17px] font-semibold">Deine Notizen</h2>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => setShowHelp((v) => !v)}><Question size={16} />Schreibweise</Button>
            {draft.raw
              ? <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDraft(empty)}>Leeren</Button>
              : <Button variant="ghost" size="sm" onClick={() => setDraft((d) => ({ ...d, raw: EXAMPLE }))}>Beispiel</Button>}
          </div>
        </div>

        {showHelp && <Help />}

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className={label} htmlFor="lp-kopf">Lektion</label>
            <Input id="lp-kopf" value={draft.kopf} onChange={set('kopf')} placeholder={className || 'z.B. NT 3sa Mittwoch'} />
          </div>
          <div className="space-y-1">
            <label className={label} htmlFor="lp-titel">Thema</label>
            <Input id="lp-titel" value={draft.titel} onChange={set('titel')} placeholder="z.B. Wellen" />
          </div>
        </div>

        <div className="space-y-1">
          <label className={label} htmlFor="lp-raw">Rohnotizen</label>
          <textarea
            id="lp-raw"
            value={draft.raw}
            onChange={set('raw')}
            placeholder={'Eine Zeile pro Schritt, z.B.\n10 KL Blooket als Start https://…\n20 PA Arbeitsblatt 3 lösen\nMaterial: Feder\nPAUSE'}
            className="w-full min-h-[320px] rounded-[10px] bg-input p-3 text-[15px] leading-relaxed resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 font-mono"
            spellCheck
          />
        </div>

        <div className="space-y-1">
          <label className={label} htmlFor="lp-ziele">Lernziele (eine pro Zeile)</label>
          <textarea
            id="lp-ziele"
            value={draft.ziele}
            onChange={set('ziele')}
            placeholder={'Ich kann …\nIch kann …'}
            className="w-full min-h-[84px] rounded-[10px] bg-input p-3 text-[15px] resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
          />
        </div>
      </section>

      {/* Vorschau */}
      <section className="bg-card rounded-xl p-4 space-y-3 min-w-0">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h2 className="text-[17px] font-semibold">Fertige Lektion</h2>
          <div className="flex items-center gap-3 flex-wrap">
            <label className="flex items-center gap-2 text-[14px] cursor-pointer select-none">
              <Switch checked={withQr} onCheckedChange={setWithQr} />QR-Codes
            </label>
            <Button variant="secondary" size="sm" onClick={() => copy(true)} disabled={!hasSteps}>
              <Student size={16} />Nur Schülerübersicht
            </Button>
            <Button size="sm" className="rounded-full px-4" onClick={() => copy(false)} disabled={!hasSteps}>
              <ClipboardText size={16} weight="fill" />Für OneNote kopieren
            </Button>
          </div>
        </div>
        {hasSteps ? (
          <div className="rounded-lg border border-border bg-white text-[#18222d] p-3 overflow-x-auto">
            <div style={{ minWidth: 560 }}>
              {/* Inhalt ist escapt (lessonFormat.js), darum hier sicher */}
              <div className="lesson-preview" style={parseStyle(ON_STYLE)} dangerouslySetInnerHTML={{ __html: preview }} />
            </div>
          </div>
        ) : (
          <p className="text-[15px] text-muted-foreground text-center py-16">
            Hier erscheint die formatierte Lektion, sobald du links Notizen schreibst.
          </p>
        )}
      </section>
    </div>
  );
}

const parseStyle = (css) => Object.fromEntries(css.split(';').filter(Boolean).map((r) => {
  const [k, v] = r.split(':');
  return [k.trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase()), v.trim()];
}));

function Help() {
  const row = (code, text) => (
    <tr className="border-b border-border last:border-0">
      <td className="py-1.5 pr-3 font-mono text-[13px] whitespace-nowrap align-top">{code}</td>
      <td className="py-1.5 text-[13px] text-muted-foreground">{text}</td>
    </tr>
  );
  return (
    <div className="rounded-[10px] bg-muted p-3">
      <table className="w-full">
        <tbody>
          {row('20 KL Titel …', 'Neuer Schritt: Minuten, Sozialform, Text. Minuten und Sozialform sind freiwillig.')}
          {row('sa / sb Titel', 'Schritt nur für diese Klasse')}
          {row('Weitere Zeile', 'Notiz zum Schritt darüber')}
          {row('Material: …', 'Material zum Schritt, auch am Zeilenende möglich')}
          {row('https://…', 'Link, wird mit Namen und QR-Code angezeigt')}
          {row('PAUSE Pingpong', 'Pause')}
          {row('HA: …', 'Hausaufgabe')}
          {row('Zeilen vor dem 1. Schritt', 'Organisation (z.B. Tests einsammeln)')}
        </tbody>
      </table>
      <p className="text-[12px] text-muted-foreground mt-2">
        Sozialformen: {Object.keys(FORMS).join(', ')}, DAV. Das Emoji wählt die App nach Stichworten (Video, Experiment, Blooket …).
      </p>
    </div>
  );
}
