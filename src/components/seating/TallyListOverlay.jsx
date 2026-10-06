import React, { useState, useMemo, useCallback } from 'react';
import { entities } from '@/api/db';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Plus, Minus, Mail, Copy, Check } from 'lucide-react';

function getNextWeekday(dayOfWeek) {
  // dayOfWeek: 1=Monday, 2=Tuesday, ...
  const today = new Date();
  const todayDay = today.getDay(); // 0=Sun, 1=Mon...
  let diff = dayOfWeek - todayDay;
  if (diff <= 0) diff += 7;
  const next = new Date(today);
  next.setDate(today.getDate() + diff);
  return next.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// Parse slot lines like "Montag, 08:15 - 09:05" → "Montag, DD.MM.YYYY, 08:15 - 09:05"
function buildSlotLines(slotsText) {
  const DAY_MAP = {
    'montag': 1, 'dienstag': 2, 'mittwoch': 3,
    'donnerstag': 4, 'freitag': 5, 'samstag': 6, 'sonntag': 0,
  };
  return slotsText
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const firstWord = line.split(/[,\s]/)[0].toLowerCase();
      const dayNum = DAY_MAP[firstWord];
      if (dayNum !== undefined) {
        const date = getNextWeekday(dayNum === 0 ? 7 : dayNum);
        // Replace first occurrence of the day name with "Dayname, Date"
        return line.replace(/^[^,\s]+/, `${line.split(/[,\s]/)[0]}, ${date}`);
      }
      return line;
    })
    .join('\n');
}

function buildNachsitzenEmailText(student, recipientEmail, slotsText, teacherName) {
  const name = `${student.firstName} ${student.lastName}`;
  const slotLines = slotsText ? buildSlotLines(slotsText) : '';
  return `An: ${recipientEmail || '(keine Adresse hinterlegt)'}
Betreff: Nachsitzen: ${name}

Lieber ${student.firstName}
Du hast nun 3 Einträge. Wann kommst du 45min nachsitzen?

${slotLines}

Lieber Gruss
${teacherName}`;
}

const TALLY_THRESHOLD = 3;

const GENDER_COLOR = {
  m: 'text-blue-600 bg-blue-50 border-blue-200',
  w: 'text-pink-600 bg-pink-50 border-pink-200',
  d: 'text-purple-600 bg-purple-50 border-purple-200',
};

function TallyMarks({ count }) {
  const groups = Math.floor(count / 5);
  const remainder = count % 5;
  return (
    <span className="font-mono text-base leading-none select-none inline-flex items-center gap-1">
      {Array.from({ length: groups }).map((_, i) => (
        <span key={i} className="relative inline-flex items-center" style={{ letterSpacing: '0.15em' }}>
          <span>||||</span>
          <span className="absolute left-0 top-1/2 -translate-y-1/2 border-t-2 border-current"
            style={{ width: '2em', transform: 'translateY(-50%) rotate(-15deg)', transformOrigin: 'center' }} />
        </span>
      ))}
      {remainder > 0 && <span style={{ letterSpacing: '0.15em' }}>{'|'.repeat(remainder)}</span>}
    </span>
  );
}

// Build unique students across all classes, storing all className memberships
function buildUniqueStudents(classes) {
  const map = new Map();
  for (const cls of classes) {
    for (const s of (cls.students || [])) {
      const key = `${s.firstName}_${s.lastName}_${s.gender}`;
      if (!map.has(key)) {
        map.set(key, { ...s, studentKey: key, classNames: [cls.name] });
      } else {
        const existing = map.get(key);
        if (!existing.classNames.includes(cls.name)) {
          existing.classNames.push(cls.name);
        }
      }
    }
  }
  return [...map.values()].sort((a, b) => a.firstName.localeCompare(b.firstName, 'de'));
}

export default function TallyListOverlay({ classes = [], onClose, currentUser }) {
  const [filterClass, setFilterClass] = useState('all');
  const [showEmailSettings, setShowEmailSettings] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState(() => localStorage.getItem('tally_recipient_email') || '');
  const [teacherName, setTeacherName] = useState(() => localStorage.getItem('tally_teacher_name') || '');
  const [nachsitzSlots, setNachsitzSlots] = useState(() =>
    localStorage.getItem('tally_nachsitz_slots') ||
    'Montag, 08:15 - 09:05\nMontag, 15:05 - 15:50\nDienstag, 15:05 - 15:50'
  );
  const [emailPreview, setEmailPreview] = useState(null);
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();

  const handleEmailChange = (e) => {
    setRecipientEmail(e.target.value);
    localStorage.setItem('tally_recipient_email', e.target.value);
  };

  const handleTeacherNameChange = (e) => {
    setTeacherName(e.target.value);
    localStorage.setItem('tally_teacher_name', e.target.value);
  };

  const handleSlotsChange = (e) => {
    setNachsitzSlots(e.target.value);
    localStorage.setItem('tally_nachsitz_slots', e.target.value);
  };

  const { data: tallies = [] } = useQuery({
    queryKey: ['tallies', currentUser?.email],
    queryFn: () => entities.TallyEntry.filter({ created_by: currentUser.email }),
    enabled: !!currentUser,
    staleTime: 10_000,
  });

  const createTally = useMutation({
    mutationFn: (data) => entities.TallyEntry.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tallies'] }),
  });
  const updateTally = useMutation({
    mutationFn: ({ id, count }) => entities.TallyEntry.update(id, { count }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tallies'] }),
  });
  const deleteTally = useMutation({
    mutationFn: (id) => entities.TallyEntry.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tallies'] }),
  });

  const allStudents = useMemo(() => buildUniqueStudents(classes), [classes]);

  const tallyMap = useMemo(() => {
    const map = {};
    for (const t of tallies) map[t.studentKey] = t;
    return map;
  }, [tallies]);

  const classNames = useMemo(() => [...new Set(classes.map(c => c.name))], [classes]);

  const filtered = useMemo(() => {
    if (filterClass === 'all') return allStudents;
    return allStudents.filter(s => s.classNames.includes(filterClass));
  }, [allStudents, filterClass]);

  const handleIncrement = useCallback((student) => {
    const existing = tallyMap[student.studentKey];
    const newCount = existing ? existing.count + 1 : 1;
    if (existing) {
      updateTally.mutate({ id: existing.id, count: newCount });
    } else {
      createTally.mutate({
        studentKey: student.studentKey,
        firstName: student.firstName,
        lastName: student.lastName,
        gender: student.gender,
        className: student.classNames[0],
        count: 1,
      });
    }
    if (newCount === TALLY_THRESHOLD) {
      setEmailPreview(buildNachsitzenEmailText(student, recipientEmail, nachsitzSlots, teacherName));
      setCopied(false);
    }
  }, [tallyMap, updateTally, createTally, recipientEmail, nachsitzSlots, teacherName]);

  const handleCopyEmail = useCallback(async () => {
    if (!emailPreview) return;
    try {
      await navigator.clipboard.writeText(emailPreview);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = emailPreview;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [emailPreview]);

  const handleDecrement = useCallback((student) => {
    const existing = tallyMap[student.studentKey];
    if (!existing) return;
    if (existing.count <= 1) deleteTally.mutate(existing.id);
    else updateTally.mutate({ id: existing.id, count: existing.count - 1 });
  }, [tallyMap, deleteTally, updateTally]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold">Strichliste</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Rot = {TALLY_THRESHOLD}+ Einträge · Striche gelten global für jeden Schüler
            </p>
            <button
              onClick={() => setShowEmailSettings(v => !v)}
              className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              Nachsitzen-E-Mail {showEmailSettings ? '▲ ausblenden' : '▼ einrichten'}
            </button>
            {showEmailSettings && (
              <div className="mt-2 space-y-1.5 border border-border rounded-lg p-3 bg-muted/30">
                <input
                  type="email"
                  placeholder="E-Mail-Adresse für Nachsitzen-Einladung"
                  value={recipientEmail}
                  onChange={handleEmailChange}
                  className="w-full text-xs rounded-md border border-input bg-transparent px-2 py-1 shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
                <input
                  type="text"
                  placeholder="Dein Name (z.B. Herr Lüchinger)"
                  value={teacherName}
                  onChange={handleTeacherNameChange}
                  className="w-full text-xs rounded-md border border-input bg-transparent px-2 py-1 shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
                <p className="text-xs text-muted-foreground">
                  Bei 3 Strichen öffnet sich automatisch ein vorbereiteter E-Mail-Entwurf.
                </p>
                <textarea
                  rows={3}
                  value={nachsitzSlots}
                  onChange={handleSlotsChange}
                  placeholder={"Montag, 08:15 - 09:05\nMontag, 15:05 - 15:50\nDienstag, 15:05 - 15:50"}
                  className="w-full text-xs rounded-md border border-input bg-transparent px-2 py-1 shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Zeitfenster – ein Termin pro Zeile. Datum wird automatisch berechnet.
                </p>
              </div>
            )}
          </div>
          <button className="p-2 rounded-full hover:bg-muted transition-colors flex-shrink-0" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Email preview panel */}
        {emailPreview && (
          <div className="mx-6 mt-4 border-2 border-primary/40 rounded-xl p-4 bg-primary/5 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-primary flex items-center gap-1.5">
                <Mail className="w-4 h-4" /> Nachsitzen-E-Mail bereit
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={handleCopyEmail}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors
                    ${copied ? 'bg-green-500 text-white' : 'bg-primary text-white hover:bg-primary/90'}`}
                >
                  {copied ? <><Check className="w-3.5 h-3.5" /> Kopiert!</> : <><Copy className="w-3.5 h-3.5" /> In Zwischenablage</>}
                </button>
                <button
                  onClick={() => setEmailPreview(null)}
                  className="px-2 py-1 rounded-lg text-xs text-muted-foreground hover:bg-muted transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <textarea
              readOnly
              value={emailPreview}
              rows={10}
              className="w-full text-xs rounded-lg border border-border bg-white px-3 py-2 shadow-sm font-mono resize-none focus-visible:outline-none"
              onClick={(e) => e.target.select()}
            />
            <p className="text-xs text-muted-foreground">
              Text wurde kopiert – jetzt in dein E-Mail-Programm einfügen (Strg+V / Cmd+V).
            </p>
          </div>
        )}

        {/* Class filter */}
        <div className="px-6 py-3 border-b border-border flex gap-2 flex-wrap">
          {['all', ...classNames].map(name => (
            <button
              key={name}
              onClick={() => setFilterClass(name)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors
                ${filterClass === name
                  ? 'bg-primary text-white border-primary'
                  : 'border-border text-muted-foreground hover:border-primary'}`}
            >
              {name === 'all' ? 'Alle Klassen' : name}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted/90 backdrop-blur-sm z-10">
              <tr>
                <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Vorname</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Nachname</th>
                <th className="text-center px-4 py-2 text-xs font-semibold text-muted-foreground">G</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Klassen</th>
                <th className="text-center px-4 py-2 text-xs font-semibold text-muted-foreground">Striche</th>
                <th className="text-center px-4 py-2 text-xs font-semibold text-muted-foreground">+/−</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((student) => {
                const tally = tallyMap[student.studentKey];
                const count = tally?.count || 0;
                const isRed = count >= TALLY_THRESHOLD;
                return (
                  <tr
                    key={student.studentKey}
                    className={`border-b border-border transition-colors ${isRed ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-muted/30'}`}
                  >
                    <td className={`px-4 py-2.5 font-semibold ${isRed ? 'text-red-700' : ''}`}>
                      {student.firstName}
                    </td>
                    <td className={`px-4 py-2.5 ${isRed ? 'text-red-600' : 'text-muted-foreground'}`}>
                      {student.lastName}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`text-xs font-bold border rounded-full px-1.5 py-0.5 ${GENDER_COLOR[student.gender] || 'text-gray-600 bg-gray-50 border-gray-200'}`}>
                        {student.gender}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex gap-1 flex-wrap">
                        {student.classNames.map(cn => (
                          <span key={cn} className="text-xs bg-primary/10 text-primary border border-primary/20 rounded-full px-2 py-0.5 font-medium">
                            {cn}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {count > 0 ? (
                        <span className={`inline-flex items-center gap-1 ${isRed ? 'text-red-600' : ''}`}>
                          <TallyMarks count={count} />
                          <span className="text-xs text-muted-foreground">({count})</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">–</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleDecrement(student)}
                          disabled={!tally}
                          className="w-6 h-6 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-30"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleIncrement(student)}
                          className="w-6 h-6 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-muted-foreground py-10 text-sm">
                    Keine Schüler gefunden.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}