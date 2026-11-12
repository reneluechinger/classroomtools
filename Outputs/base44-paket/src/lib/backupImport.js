// Backup aus der GitHub-Version (Benutzermenü → Backup herunterladen) in base44 einspielen.
// Regeln:
// - Datensätze, die es in base44 schon gibt (gleiche ID), werden mit dem Stand aus dem Backup überschrieben.
// - Wiedererkennen auch ohne gleiche ID, damit mehrfaches Einspielen nichts verdoppelt:
//   Klasse/Zimmer am Namen, QR-Code an der Adresse, Strichliste an der Person (studentKey),
//   Sitzplan an Klasse + Zimmer + Name.
// - Einstellungen: es gibt pro Person nur einen Datensatz, der wird überschrieben.
// - Alles andere wird neu angelegt; Verweise (Sitzplan → Klasse/Zimmer, Einstellungen → letzte Klasse/Zimmer)
//   werden auf die neuen IDs umgehängt.
// - Es wird nichts gelöscht.

export const ORDER = ['SchoolClass', 'RoomLayout', 'QRCodeEntry', 'TallyEntry', 'SeatingPlan', 'AppSettings'];

export const LABELS = {
  SchoolClass: 'Klassen',
  RoomLayout: 'Zimmer',
  SeatingPlan: 'Sitzpläne',
  TallyEntry: 'Strichliste',
  QRCodeEntry: 'QR-Codes',
  AppSettings: 'Einstellungen',
};

// Merkmal zum Wiedererkennen eines Datensatzes (nach dem Umhängen der Verweise)
const KEY = {
  SchoolClass: (r) => r.name,
  RoomLayout: (r) => r.name,
  QRCodeEntry: (r) => r.url,
  TallyEntry: (r) => r.studentKey,
  SeatingPlan: (r) => `${r.classId}|${r.layoutId}|${r.name}`,
};

const META = ['id', 'created_date', 'updated_date', 'created_by', 'created_by_id', 'is_sample'];
const strip = (r) => Object.fromEntries(Object.entries(r).filter(([k]) => !META.includes(k)));

// Datei prüfen und die Datensätze pro Entity zurückgeben
export function parseBackup(text) {
  let json;
  try { json = JSON.parse(text); } catch { throw new Error('Die Datei ist keine gültige JSON-Datei.'); }
  const src = json?.entities;
  if (!src || typeof src !== 'object') throw new Error('Die Datei ist kein Backup von Classroom Tools.');
  const data = {};
  for (const name of ORDER) data[name] = (Array.isArray(src[name]) ? src[name] : []).filter((r) => r && r.id);
  data.AppSettings = data.AppSettings.slice(0, 1);
  return { data, userEmail: json.userEmail || null, exportedAt: json.exportedAt || null };
}

// entities: base44.entities (oder ein gleichartiges Objekt), email: eigene E-Mail
export async function importBackup(data, entities, email, onProgress = () => {}) {
  const idMap = {};
  const remap = (id) => (id && idMap[id]) || id;
  const result = Object.fromEntries(ORDER.map((n) => [n, { created: 0, updated: 0 }]));
  const total = ORDER.reduce((s, n) => s + data[n].length, 0);
  let done = 0;

  for (const name of ORDER) {
    const rows = data[name];
    if (!rows.length) continue;
    const existing = await entities[name].filter({ created_by: email });
    const byId = new Map(existing.map((r) => [r.id, r]));
    const keyOf = KEY[name];
    const byKey = new Map(keyOf ? existing.map((r) => [keyOf(r), r]) : []);
    const used = new Set(); // ein bestehender Datensatz nimmt höchstens einen aus dem Backup auf

    for (const rec of rows) {
      const payload = strip(rec);
      if (name === 'SeatingPlan') {
        payload.classId = remap(payload.classId);
        payload.layoutId = remap(payload.layoutId);
      }
      if (name === 'AppSettings') {
        payload.lastClassId = remap(payload.lastClassId);
        payload.lastLayoutId = remap(payload.lastLayoutId);
        payload.userEmail = email;
      }

      const candidates = [
        byId.get(rec.id),
        keyOf && byKey.get(keyOf(payload)),
        name === 'AppSettings' && existing[0],
      ];
      const target = candidates.find((c) => c && !used.has(c.id)) || null;
      if (target) used.add(target.id);

      if (target) {
        await entities[name].update(target.id, payload);
        idMap[rec.id] = target.id;
        result[name].updated++;
      } else {
        const created = await entities[name].create(payload);
        idMap[rec.id] = created.id;
        result[name].created++;
      }
      onProgress(++done, total);
    }
  }
  return result;
}
