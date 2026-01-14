-- COMMAND 1: Enable UUID extension
create extension if not exists "uuid-ossp";

-- COMMAND 2: Create table for tracking shared verses
create table if not exists public.shared_verses (
    id uuid primary key default uuid_generate_v4(),
    verse_id text not null,
    image_url text not null,
    created_at timestamp with time zone default now()
);

-- COMMAND 3: Enable Row Level Security (RLS)
alter table public.shared_verses enable row level security;

-- COMMAND 4: Policy - Allow public read access to shared_verses
create policy "Allow public read access"
on public.shared_verses
for select
to public
using (true);

-- COMMAND 5: Policy - Allow anon insert access (for creating shares)
create policy "Allow anon insert access"
on public.shared_verses
for insert
to anon
with check (true);

-- COMMAND 6: Create 'share-images' bucket
insert into storage.buckets (id, name, public)
values ('share-images', 'share-images', true)
on conflict (id) do nothing;

-- COMMAND 7: Policy - Public Access to Storage
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'share-images' );

-- COMMAND 8: Policy - Anon Upload to Storage
create policy "Anon Upload"
on storage.objects for insert
with check ( bucket_id = 'share-images' );
