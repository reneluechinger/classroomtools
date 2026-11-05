// base44-Anbindung für das neue Design.
// Die Design-Dateien sprechen mit «entities» (gleiche Schnittstelle wie base44.entities).
import { base44 } from '@/api/base44Client';

export const entities = base44.entities;

const NAMES = ['SchoolClass', 'RoomLayout', 'SeatingPlan', 'TallyEntry', 'QRCodeEntry', 'AppSettings'];

// Backup aller eigenen Daten (Benutzermenü → Backup herunterladen)
export async function exportAll() {
  const me = await base44.auth.me();
  const out = {};
  for (const n of NAMES) out[n] = await base44.entities[n].filter({ created_by: me.email });
  return out;
}
