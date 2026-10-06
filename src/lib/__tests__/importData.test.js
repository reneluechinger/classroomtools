import { describe, it, expect } from 'vitest';
import { parseExportFile } from '../importData';

describe('parseExportFile', () => {
  it('liest einen base44-Export und behält die IDs', () => {
    const file = JSON.stringify({
      userEmail: 'a@b.ch', source: 'base44',
      entities: {
        SchoolClass: [{ id: 'abc', name: '2a', students: [] }],
        AppSettings: [{ id: 'x1', userEmail: 'a@b.ch' }, { id: 'x2', userEmail: 'a@b.ch' }],
        FeedbackMessage: [{ id: 'f1', text: 'wird ignoriert' }],
      },
    });
    const r = parseExportFile(file);
    expect(r.counts.SchoolClass).toBe(1);
    expect(r.counts.AppSettings).toBe(1);
    expect(r.rows.map((x) => x.id)).toEqual(['abc', 'x1']);
    expect(r.rows.find((x) => x.id === 'f1')).toBeUndefined();
  });

  it('meldet ungültige Dateien verständlich', () => {
    expect(() => parseExportFile('kein json')).toThrow(/JSON/);
    expect(() => parseExportFile('{"foo":1}')).toThrow(/keine Daten/);
  });
});
