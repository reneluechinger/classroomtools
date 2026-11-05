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

-- ════════════════════════════════════════════════════════════════════
-- Warteschlange (siehe auch supabase/migrations/002_warteschlange.sql)

-- Eine Warteschlange pro Klasse und Lehrkraft
create table if not exists public.queues (
  id         uuid        primary key default gen_random_uuid(),
  owner_id   uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  class_id   text        not null,
  class_name text        not null default '',
  students   jsonb       not null default '[]'::jsonb,  -- [{ "id": "...", "name": "Lea M." }]
  created_at timestamptz not null default now(),
  unique (owner_id, class_id)
);

create table if not exists public.queue_entries (
  id         uuid        primary key default gen_random_uuid(),
  queue_id   uuid        not null references public.queues (id) on delete cascade,
  student_id text        not null,
  name       text        not null,
  created_at timestamptz not null default now(),
  done_at    timestamptz
);
create index if not exists queue_entries_queue_idx on public.queue_entries (queue_id, created_at);
-- Wer wartet, steht nur einmal in der Schlange
create unique index if not exists queue_entries_waiting_once
  on public.queue_entries (queue_id, student_id) where done_at is null;

alter table public.queues enable row level security;
alter table public.queue_entries enable row level security;

drop policy if exists "queues_own" on public.queues;
create policy "queues_own" on public.queues for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "queue_entries_own" on public.queue_entries;
create policy "queue_entries_own" on public.queue_entries for all to authenticated
  using (exists (select 1 from public.queues q where q.id = queue_id and q.owner_id = auth.uid()))
  with check (exists (select 1 from public.queues q where q.id = queue_id and q.owner_id = auth.uid()));

grant select, insert, update, delete on public.queues, public.queue_entries to authenticated;
revoke all on public.queues, public.queue_entries from anon;

-- ── Funktionen für Lernende ohne Login ─────────────────────────────────────
-- Sie laufen mit erhöhten Rechten, geben aber nur das Nötigste heraus.

-- Klassenname und Namensliste (Vorname + Initiale) einer Warteschlange
create or replace function public.queue_info(p_queue uuid) returns json
language sql stable security definer set search_path = public as $$
  select json_build_object('class_name', class_name, 'students', students)
  from public.queues where id = p_queue;
$$;

-- Anstellen; gibt die Eintrags-ID zurück (bestehende, falls schon wartend)
create or replace function public.queue_join(p_queue uuid, p_student text) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_name text;
  v_id uuid;
begin
  select s ->> 'name' into v_name
  from public.queues q, jsonb_array_elements(q.students) s
  where q.id = p_queue and s ->> 'id' = p_student;
  if v_name is null then
    raise exception 'Name nicht in dieser Warteschlange';
  end if;

  select id into v_id from public.queue_entries
  where queue_id = p_queue and student_id = p_student and done_at is null;
  if v_id is null then
    begin
      insert into public.queue_entries (queue_id, student_id, name)
      values (p_queue, p_student, v_name) returning id into v_id;
    exception when unique_violation then
      select id into v_id from public.queue_entries
      where queue_id = p_queue and student_id = p_student and done_at is null;
    end;
  end if;
  return v_id;
end $$;

-- Position: 1 = ist dran, 0 = erledigt, null = Eintrag gibt es nicht mehr
create or replace function public.queue_position(p_entry uuid) returns int
language sql stable security definer set search_path = public as $$
  select case when e.done_at is not null then 0 else (
    select count(*)::int from public.queue_entries o
    where o.queue_id = e.queue_id and o.done_at is null and o.created_at <= e.created_at
  ) end
  from public.queue_entries e where e.id = p_entry;
$$;

-- Selbst wieder austragen (nur solange noch wartend)
create or replace function public.queue_leave(p_entry uuid) returns void
language sql security definer set search_path = public as $$
  delete from public.queue_entries where id = p_entry and done_at is null;
$$;

revoke all on function public.queue_info(uuid), public.queue_join(uuid, text),
  public.queue_position(uuid), public.queue_leave(uuid) from public;
grant execute on function public.queue_info(uuid), public.queue_join(uuid, text),
  public.queue_position(uuid), public.queue_leave(uuid) to anon, authenticated;
