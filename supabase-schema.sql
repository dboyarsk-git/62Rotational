-- 6-2 Volleyball shared roster + LIVE sync setup for Supabase (v15)
-- Run this entire file in Supabase Dashboard -> SQL Editor.
-- Safe to run if you already ran an earlier volleyball schema.
-- Default coach PIN for a brand-new setup: 6262

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.volleyball_team_config (
  slug text primary key,
  config jsonb not null,
  pin_hash text not null,
  updated_at timestamptz not null default now()
);

-- Public mirror contains ONLY player-facing data. No PIN hash is ever exposed here.
create table if not exists public.volleyball_team_public (
  slug text primary key,
  config jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.volleyball_team_config enable row level security;
revoke all on table public.volleyball_team_config from anon, authenticated;

alter table public.volleyball_team_public enable row level security;
revoke all on table public.volleyball_team_public from anon, authenticated;
grant select on table public.volleyball_team_public to anon, authenticated;

drop policy if exists "Public can read volleyball team config" on public.volleyball_team_public;
create policy "Public can read volleyball team config"
on public.volleyball_team_public
for select
to anon, authenticated
using (true);

create or replace function public.get_team_config(team_slug text)
returns jsonb
language sql
stable
security definer
set search_path = public, extensions
as $$
  select config
  from public.volleyball_team_public
  where slug = team_slug
  limit 1;
$$;

create or replace function public.verify_team_admin(team_slug text, coach_pin text)
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
  select coalesce(
    (
      select extensions.crypt(coach_pin, pin_hash) = pin_hash
      from public.volleyball_team_config
      where slug = team_slug
      limit 1
    ),
    false
  );
$$;

create or replace function public.save_team_config(team_slug text, payload jsonb, coach_pin text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  current_hash text;
  cleaned_payload jsonb;
begin
  select pin_hash into current_hash
  from public.volleyball_team_config
  where slug = team_slug
  for update;

  if current_hash is null or extensions.crypt(coach_pin, current_hash) <> current_hash then
    raise exception 'Invalid coach PIN';
  end if;

  cleaned_payload := coalesce(payload, '{}'::jsonb) - 'adminPin';

  update public.volleyball_team_config
  set config = cleaned_payload, updated_at = now()
  where slug = team_slug;

  insert into public.volleyball_team_public (slug, config, updated_at)
  values (team_slug, cleaned_payload, now())
  on conflict (slug) do update
    set config = excluded.config, updated_at = excluded.updated_at;

  return cleaned_payload;
end;
$$;

revoke all on function public.get_team_config(text) from public;
revoke all on function public.verify_team_admin(text, text) from public;
revoke all on function public.save_team_config(text, jsonb, text) from public;

grant execute on function public.get_team_config(text) to anon, authenticated;
grant execute on function public.verify_team_admin(text, text) to anon, authenticated;
grant execute on function public.save_team_config(text, jsonb, text) to anon, authenticated;

insert into public.volleyball_team_config (slug, config, pin_hash)
values (
  'ms-thrill-62',
  '{
    "teamName": "6–2 Rotation",
    "players": [
      {"id":"p1","name":"Ari","role":"S/RS"},
      {"id":"p2","name":"Emma","role":"OH"},
      {"id":"p3","name":"Aubriella","role":"MB"},
      {"id":"p4","name":"Sanaia","role":"S/RS"},
      {"id":"p5","name":"Leah","role":"OH"},
      {"id":"p6","name":"Jade","role":"MB"}
    ],
    "subs": [],
    "libero": {
      "id":"libero_1",
      "name":"Libero",
      "role":"LIB",
      "rotations":{"1":"","2":"","3":"","4":"","5":"","6":""}
    }
  }'::jsonb,
  extensions.crypt('6262', extensions.gen_salt('bf'))
)
on conflict (slug) do nothing;

-- Mirror whatever is already in the private config table into the public LIVE table.
insert into public.volleyball_team_public (slug, config, updated_at)
select slug, config, updated_at
from public.volleyball_team_config
on conflict (slug) do update
  set config = excluded.config, updated_at = excluded.updated_at;

-- Add the public mirror to Supabase Realtime once.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'volleyball_team_public'
  ) then
    alter publication supabase_realtime add table public.volleyball_team_public;
  end if;
end $$;


-- Ensure the Data API immediately sees the new volleyball tables/functions.
NOTIFY pgrst, 'reload schema';
