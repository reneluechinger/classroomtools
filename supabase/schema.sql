-- SitzplanPro / Classroom Tools: Datenbank-Schema für Supabase
-- Einmalig im Supabase SQL Editor ausführen (New query → einfügen → Run).
-- Das Skript kann gefahrlos mehrfach ausgeführt werden.

-- Alle Daten liegen als JSON-Dokumente in einer Tabelle, gleich wie bei base44.
-- Jede Zeile gehört genau einem Konto (owner_id). Row Level Security sorgt
-- dafür, dass jede Lehrkraft nur ihre eigenen Zeilen sieht und ändern kann.
create table if not exists public.records (
  owner_id   uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  id         text        not null default replace(gen_random_uuid()::text, '-', ''),
  entity     text        not null check (entity in (
               'SchoolClass', 'RoomLayout', 'SeatingPlan',
               'TallyEntry', 'QRCodeEntry', 'AppSettings')),
  data       jsonb       not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (owner_id, id)
);

create index if not exists records_owner_entity_idx on public.records (owner_id, entity);

alter table public.records enable row level security;

drop policy if exists "records_select_own" on public.records;
drop policy if exists "records_insert_own" on public.records;
drop policy if exists "records_update_own" on public.records;
drop policy if exists "records_delete_own" on public.records;

create policy "records_select_own" on public.records
  for select to authenticated using (owner_id = auth.uid());
create policy "records_insert_own" on public.records
  for insert to authenticated with check (owner_id = auth.uid());
create policy "records_update_own" on public.records
  for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "records_delete_own" on public.records
  for delete to authenticated using (owner_id = auth.uid());

-- updated_at automatisch setzen
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists records_touch on public.records;
create trigger records_touch before update on public.records
  for each row execute function public.touch_updated_at();

-- Teil-Update (wie base44 update): übergebene Felder werden in data gemischt.
-- security invoker: Row Level Security gilt auch hier.
create or replace function public.merge_record(p_id text, p_patch jsonb)
returns public.records
language sql security invoker as $$
  update public.records
     set data = data || p_patch
   where id = p_id and owner_id = auth.uid()
  returning *;
$$;

grant select, insert, update, delete on public.records to authenticated;
grant execute on function public.merge_record(text, jsonb) to authenticated;
revoke all on public.records from anon;

-- ── Speicher für Safe-Exam-Browser-Dateien ─────────────────────────────────
-- Öffentlich lesbar (das iPad lädt die Datei über den QR-Code ohne Login).
-- Schreiben und Löschen nur im eigenen Ordner <user-id>/...
insert into storage.buckets (id, name, public)
values ('seb-files', 'seb-files', true)
on conflict (id) do update set public = true;

drop policy if exists "seb_select_own" on storage.objects;
drop policy if exists "seb_insert_own" on storage.objects;
drop policy if exists "seb_update_own" on storage.objects;
drop policy if exists "seb_delete_own" on storage.objects;

-- Lesen über die API braucht es fürs Überschreiben (upsert); der öffentliche Link funktioniert ohnehin
create policy "seb_select_own" on storage.objects for select to authenticated
  using (bucket_id = 'seb-files' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "seb_insert_own" on storage.objects for insert to authenticated
  with check (bucket_id = 'seb-files' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "seb_update_own" on storage.objects for update to authenticated
  using (bucket_id = 'seb-files' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "seb_delete_own" on storage.objects for delete to authenticated
  using (bucket_id = 'seb-files' and (storage.foldername(name))[1] = auth.uid()::text);

-- ── Wachhalter ─────────────────────────────────────────────────────────────
-- Gratis-Projekte werden nach 7 Tagen ohne Aktivität pausiert.
-- Die GitHub Action "keepalive" ruft diese Funktion alle 3 Tage auf.
create or replace function public.keepalive() returns timestamptz
language sql stable as $$ select now() $$;
grant execute on function public.keepalive() to anon, authenticated;
