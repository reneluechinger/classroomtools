// Prüft und normalisiert eine Export-Datei (aus base44 oder ein Backup dieser App).
export const IMPORTABLE = ['SchoolClass', 'RoomLayout', 'SeatingPlan', 'TallyEntry', 'QRCodeEntry', 'AppSettings'];

export const LABELS = {
  SchoolClass: 'Klassen',
  RoomLayout: 'Raumlayouts',
  SeatingPlan: 'Sitzpläne',
  TallyEntry: 'Strichlisten-Einträge',
  QRCodeEntry: 'QR-Codes',
  AppSettings: 'Einstellungen',
};

export function parseExportFile(text) {
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error('Die Datei ist keine gültige JSON-Datei.');
  }
  const entities = json?.entities;
  if (!entities || typeof entities !== 'object') {
    throw new Error('Die Datei enthält keine Daten von Classroom Tools.');
  }
  const rows = [];
  const counts = {};
  for (const name of IMPORTABLE) {
    const list = Array.isArray(entities[name]) ? entities[name] : [];
    const valid = list.filter((r) => r && typeof r === 'object' && r.id);
    // Pro Konto gibt es nur einen Einstellungs-Datensatz
    const used = name === 'AppSettings' ? valid.slice(0, 1) : valid;
    counts[name] = used.length;
    for (const r of used) rows.push({ entity: name, id: String(r.id), data: r, created_date: r.created_date });
  }
  return { rows, counts, userEmail: json.userEmail || null, source: json.source || 'unbekannt' };
}
