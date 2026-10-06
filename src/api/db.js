import { supabase } from './supabase';

// Datenschicht mit derselben Schnittstelle wie entities.X,
// damit die Komponenten unverändert bleiben können.
// Ein Datensatz sieht für die App aus wie bei base44:
// { id, created_date, updated_date, created_by, ...felder }

const ENTITIES = ['SchoolClass', 'RoomLayout', 'SeatingPlan', 'TallyEntry', 'QRCodeEntry', 'AppSettings'];

let currentEmail = null;
export const setCurrentEmail = (email) => { currentEmail = email; };

// Felder, die nicht in data gespeichert werden
const META = new Set(['id', 'created_date', 'updated_date', 'created_by']);

const stripMeta = (obj) =>
  Object.fromEntries(Object.entries(obj || {}).filter(([k]) => !META.has(k)));

const toRecord = (row) => ({
  ...row.data,
  id: row.id,
  created_date: row.created_at,
  updated_date: row.updated_at,
  created_by: currentEmail,
});

const unwrap = ({ data, error }) => {
  if (error) throw error;
  return data;
};

function entity(name) {
  const table = () => supabase.from('records');
  return {
    async list() {
      return unwrap(await table().select('*').eq('entity', name).order('created_at')).map(toRecord);
    },
    // created_by wird ignoriert: Row Level Security liefert ohnehin nur eigene Daten
    async filter(query = {}) {
      const match = stripMeta(query);
      let q = table().select('*').eq('entity', name);
      if (Object.keys(match).length) q = q.contains('data', match);
      return unwrap(await q.order('created_at')).map(toRecord);
    },
    async get(id) {
      return toRecord(unwrap(await table().select('*').eq('entity', name).eq('id', id).single()));
    },
    async create(data) {
      return toRecord(unwrap(await table().insert({ entity: name, data: stripMeta(data) }).select().single()));
    },
    async update(id, patch) {
      const row = unwrap(await supabase.rpc('merge_record', { p_id: id, p_patch: stripMeta(patch) }));
      if (!row?.id) throw new Error('Datensatz nicht gefunden');
      return toRecord(row);
    },
    async delete(id) {
      unwrap(await table().delete().eq('entity', name).eq('id', id));
    },
  };
}

export const entities = Object.fromEntries(ENTITIES.map((n) => [n, entity(n)]));
export const ENTITY_NAMES = ENTITIES;

// Für den Import: Datensätze mit vorhandener ID anlegen oder überschreiben
export async function upsertRecords(rows) {
  const payload = rows.map((r) => ({
    entity: r.entity,
    id: String(r.id),
    data: stripMeta(r.data),
    // Alle Zeilen brauchen dieselben Spalten, sonst setzt Supabase fehlende auf NULL
    created_at: r.created_date || new Date().toISOString(),
  }));
  for (let i = 0; i < payload.length; i += 200) {
    unwrap(await supabase.from('records').upsert(payload.slice(i, i + 200), { onConflict: 'owner_id,id' }));
  }
}

// Für das Backup: alle eigenen Daten
export async function exportAll() {
  const rows = unwrap(await supabase.from('records').select('*').order('created_at'));
  const out = Object.fromEntries(ENTITIES.map((n) => [n, []]));
  for (const row of rows) out[row.entity]?.push(toRecord(row));
  return out;
}
