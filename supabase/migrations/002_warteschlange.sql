-- Warteschlange: Lernende scannen einen QR-Code, wählen ihren Namen und stellen sich an.
-- Einmalig im Supabase SQL Editor ausführen. Kann gefahrlos mehrfach laufen.
-- Ist auch am Ende von supabase/schema.sql enthalten.

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
