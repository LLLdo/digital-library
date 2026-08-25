-- KU Digital Library: run this entire script in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  title_th text not null,
  title_en text,
  author text,
  category text,
  description text,
  cover_path text,
  pdf_path text not null,
  published_year integer,
  created_at timestamptz not null default now()
);

alter table public.books enable row level security;

-- Public visitors can read book metadata.
drop policy if exists "Public can read books" on public.books;
create policy "Public can read books"
on public.books for select
to anon, authenticated
using (true);

-- Only authenticated admins can modify books.
-- IMPORTANT: this starter treats every authenticated Supabase user as an admin.
-- If you later need multiple roles, add an admin table/claim.
drop policy if exists "Authenticated can insert books" on public.books;
create policy "Authenticated can insert books"
on public.books for insert
to authenticated
with check (true);

drop policy if exists "Authenticated can update books" on public.books;
create policy "Authenticated can update books"
on public.books for update
to authenticated
using (true) with check (true);

drop policy if exists "Authenticated can delete books" on public.books;
create policy "Authenticated can delete books"
on public.books for delete
to authenticated
using (true);

-- Storage buckets
insert into storage.buckets (id, name, public)
values ('pdfs', 'pdfs', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
values ('covers', 'covers', true)
on conflict (id) do update set public = true;

-- Public read of PDFs and covers.
drop policy if exists "Public read pdfs" on storage.objects;
create policy "Public read pdfs"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'pdfs');

drop policy if exists "Public read covers" on storage.objects;
create policy "Public read covers"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'covers');

-- Authenticated upload/update/delete.
drop policy if exists "Authenticated upload pdfs" on storage.objects;
create policy "Authenticated upload pdfs"
on storage.objects for insert
to authenticated
with check (bucket_id = 'pdfs');

drop policy if exists "Authenticated delete pdfs" on storage.objects;
create policy "Authenticated delete pdfs"
on storage.objects for delete
to authenticated
using (bucket_id = 'pdfs');

drop policy if exists "Authenticated upload covers" on storage.objects;
create policy "Authenticated upload covers"
on storage.objects for insert
to authenticated
with check (bucket_id = 'covers');

drop policy if exists "Authenticated delete covers" on storage.objects;
create policy "Authenticated delete covers"
on storage.objects for delete
to authenticated
using (bucket_id = 'covers');
