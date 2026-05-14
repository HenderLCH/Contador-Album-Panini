create table if not exists public.album_collections (
  collection_id text primary key,
  stickers jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.album_collections enable row level security;

create policy "album_collections_select_all"
on public.album_collections
for select
to anon
using (true);

create policy "album_collections_insert_all"
on public.album_collections
for insert
to anon
with check (true);

create policy "album_collections_update_all"
on public.album_collections
for update
to anon
using (true)
with check (true);
