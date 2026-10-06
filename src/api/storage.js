import { supabase } from './supabase';

// Lädt eine .seb-Datei in den öffentlichen Bucket "seb-files" und gibt die URL zurück.
// Pfad: <user-id>/<dateiname>, gleicher Name überschreibt die alte Datei.
export async function uploadSebFile(file) {
  const { data: { user } } = await supabase.auth.getUser();
  const path = `${user.id}/${file.name}`;
  const { error } = await supabase.storage
    .from('seb-files')
    .upload(path, file, { upsert: true, contentType: 'application/seb' });
  if (error) throw error;
  return supabase.storage.from('seb-files').getPublicUrl(path).data.publicUrl;
}
