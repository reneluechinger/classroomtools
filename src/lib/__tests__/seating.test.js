import { describe, it, expect } from 'vitest';
import { generateSeating, parseCSV } from '../seating';

const makeStudents = (n) =>
  Array.from({ length: n }, (_, i) => ({ id: `s${i}`, firstName: `V${i}`, lastName: `N${i}`, gender: i % 2 ? 'm' : 'w' }));
const makeTables = (n) => Array.from({ length: n }, (_, i) => ({ id: `t${i}`, x: 0, y: 0, rotation: 0, number: i + 1 }));
const tableOf = (assignments, id) => assignments.find((a) => a.studentId === id)?.tableId;

describe('generateSeating', () => {
  it('platziert alle Lernenden genau einmal und belegt keinen Platz doppelt', () => {
    const students = makeStudents(19);
    const result = generateSeating(students, makeTables(10));
    expect(result).toHaveLength(19);
    expect(new Set(result.map((a) => a.studentId)).size).toBe(19);
    expect(new Set(result.map((a) => `${a.tableId}-${a.seatIndex}`)).size).toBe(19);
  });

  it('hält feste Plätze ein', () => {
    const students = makeStudents(10);
    students[3] = { ...students[3], fixedTableId: 't4', fixedSeatIndex: 1 };
    for (let i = 0; i < 20; i++) {
      const a = generateSeating(students, makeTables(5)).find((x) => x.studentId === 's3');
      expect(a).toMatchObject({ tableId: 't4', seatIndex: 1 });
    }
  });

  it('setzt «muss zusammen» an denselben Tisch', () => {
    const students = makeStudents(12);
    const mustSitTogether = [{ studentA: 's0', studentB: 's5' }];
    for (let i = 0; i < 20; i++) {
      const r = generateSeating(students, makeTables(6), { mustSitTogether });
      expect(tableOf(r, 's0')).toBe(tableOf(r, 's5'));
    }
  });

  it('trennt Lernende auf der Blacklist, auch innerhalb von Tischgruppen', () => {
    const students = makeStudents(8);
    const blacklist = [{ studentA: 's0', studentB: 's1' }];
    const tableGroups = [{ id: 'g1', tableIds: ['t0', 't1'] }, { id: 'g2', tableIds: ['t2', 't3'] }];
    const groupOf = (t) => tableGroups.find((g) => g.tableIds.includes(t)).id;
    for (let i = 0; i < 30; i++) {
      const r = generateSeating(students, makeTables(4), { blacklist, tableGroups });
      expect(groupOf(tableOf(r, 's0'))).not.toBe(groupOf(tableOf(r, 's1')));
    }
  });

  it('mischt bei «Gemischt» Mädchen und Knaben an den Tischen', () => {
    const students = makeStudents(10); // 5 w, 5 m
    const r = generateSeating(students, makeTables(5), { genderMix: true });
    const g = Object.fromEntries(students.map((s) => [s.id, s.gender]));
    for (const t of makeTables(5)) {
      const pair = r.filter((a) => a.tableId === t.id).map((a) => g[a.studentId]);
      expect(new Set(pair).size).toBe(2);
    }
  });
});

describe('parseCSV', () => {
  it('liest Semikolon, Komma und Tab und überspringt die Kopfzeile', () => {
    const csv = 'Vorname;Nachname;Geschlecht\nLea;Meier;w\r\nNoah,Keller,m\nMia\tFrei\tweiblich\n\nNur';
    const s = parseCSV(csv);
    expect(s.map((x) => [x.firstName, x.lastName, x.gender])).toEqual([
      ['Lea', 'Meier', 'w'], ['Noah', 'Keller', 'm'], ['Mia', 'Frei', 'w'],
    ]);
  });
});
