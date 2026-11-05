import { supabase } from './supabase';

// Warteschlange: eine pro Klasse. Lehrkraft (eingeloggt) verwaltet sie,
// Lernende ohne Login nutzen nur die Funktionen queue_info / queue_join / queue_position / queue_leave.

const unwrap = ({ data, error }) => {
  if (error) throw error;
  return data;
};

// Anzeigename für Lernende: Vorname + Initiale
export const displayName = (s) => `${s.firstName}${s.lastName ? ` ${s.lastName.trim()[0]}.` : ''}`;

// Warteschlange der Klasse holen oder anlegen; Namensliste wird jedes Mal aktualisiert
export async function ensureQueue(schoolClass) {
  const students = [...(schoolClass.students || [])]
    .sort((a, b) => a.firstName.localeCompare(b.firstName, 'de'))
    .map((s) => ({ id: s.id, name: displayName(s) }));
  const row = unwrap(await supabase
    .from('queues')
    .upsert({ class_id: schoolClass.id, class_name: schoolClass.name, students }, { onConflict: 'owner_id,class_id' })
    .select()
    .single());
  return row;
}

export async function listWaiting(queueId) {
  return unwrap(await supabase
    .from('queue_entries')
    .select('id, name, student_id, created_at, done_at')
    .eq('queue_id', queueId)
    .is('done_at', null)
    .order('created_at'));
}

export async function countDoneSince(queueId, sinceIso) {
  const { count, error } = await supabase
    .from('queue_entries')
    .select('id', { count: 'exact', head: true })
    .eq('queue_id', queueId)
    .gte('done_at', sinceIso);
  if (error) throw error;
  return count || 0;
}

export const markDone = async (entryId) =>
  unwrap(await supabase.from('queue_entries').update({ done_at: new Date().toISOString() }).eq('id', entryId));

export const removeEntry = async (entryId) =>
  unwrap(await supabase.from('queue_entries').delete().eq('id', entryId));

export const clearQueue = async (queueId) =>
  unwrap(await supabase.from('queue_entries').delete().eq('queue_id', queueId));

// ── Lernende ─────────────────────────────────────────────
export const queueInfo = async (queueId) => unwrap(await supabase.rpc('queue_info', { p_queue: queueId }));
export const joinQueue = async (queueId, studentId) => unwrap(await supabase.rpc('queue_join', { p_queue: queueId, p_student: studentId }));
export const queuePosition = async (entryId) => unwrap(await supabase.rpc('queue_position', { p_entry: entryId }));
export const leaveQueue = async (entryId) => unwrap(await supabase.rpc('queue_leave', { p_entry: entryId }));

export const queueUrl = (queueId) => `${window.location.origin}${import.meta.env.BASE_URL}warten/${queueId}`;
