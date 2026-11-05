import React from 'react';
import { UploadSimple, PushPin, Prohibit, Heart, MinusCircle } from '@phosphor-icons/react';
import { Section, Row } from '@/components/ios';

const DOT = { w: 'bg-[#FF2D55]', m: 'bg-[#007AFF]', d: 'bg-[#AF52DE]' };

export default function StudentListPanel({
  students = [],
  assignments = [],
  onOpenImport,
  onOpenBlacklist,
  onOpenMustSitTogether,
  onOpenFixedSeats,
  onRemoveStudent,
}) {
  const assignedIds = new Set(assignments.map(a => a.studentId));
  const unassigned = students.filter(s => !assignedIds.has(s.id)).length;
  const count = (g) => students.filter(s => s.gender === g).length;
  const sorted = [...students].sort((a, b) => a.firstName.localeCompare(b.firstName, 'de'));

  return (
    <div className="space-y-6">
      <Section title="Regeln">
        <Row icon={UploadSimple} color="blue" label="Lernende importieren" detail="CSV-Datei" onClick={onOpenImport} />
        <Row icon={PushPin} color="orange" label="Fixplätze" onClick={onOpenFixedSeats}
          trailing={<Count n={students.filter(s => s.fixedTableId).length} />} />
        <Row icon={Prohibit} color="red" label="Nicht nebeneinander" onClick={onOpenBlacklist} />
        <Row icon={Heart} color="pink" label="Zusammen" onClick={onOpenMustSitTogether} />
      </Section>

      <Section
        title={`Lernende · ${students.length}`}
        trailing={
          <div className="flex items-center gap-2.5 text-[12px] text-muted-foreground">
            {['w', 'm', 'd'].filter(g => count(g)).map(g => (
              <span key={g} className="flex items-center gap-1"><span className={`w-2 h-2 rounded-full ${DOT[g]}`} />{count(g)}</span>
            ))}
          </div>
        }
        footer={unassigned > 0 && assignments.length > 0 ? `${unassigned} noch ohne Platz (gelb markiert)` : null}
      >
        <div className="max-h-[420px] overflow-y-auto">
          {sorted.map(s => (
            <Row
              key={s.id}
              chevron={false}
              className={assignments.length > 0 && !assignedIds.has(s.id) ? 'bg-[#FFCC00]/10' : ''}
              label={
                <span className="flex items-center gap-2.5">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${DOT[s.gender] || DOT.d}`} />
                  <span className="truncate">{s.firstName} <span className="text-muted-foreground">{s.lastName}</span></span>
                  {s.fixedTableId && <PushPin size={13} weight="fill" className="text-[#FF9500] shrink-0" />}
                </span>
              }
              trailing={
                <button
                  type="button"
                  onClick={() => onRemoveStudent(s.id)}
                  aria-label={`${s.firstName} entfernen`}
                  className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity text-destructive"
                >
                  <MinusCircle size={20} weight="fill" />
                </button>
              }
            />
          ))}
          {students.length === 0 && (
            <p className="text-[15px] text-muted-foreground text-center py-6 px-4">
              Noch keine Lernenden. Importiere eine CSV-Datei.
            </p>
          )}
        </div>
      </Section>
    </div>
  );
}

function Count({ n }) {
  return n ? <span className="text-[15px] text-muted-foreground">{n}</span> : null;
}
