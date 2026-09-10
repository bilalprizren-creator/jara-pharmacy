-- The team's photo decisions, and the photos the review page shows
-- -----------------------------------------------------------------
-- Supabase project "jara-fotografite" (eu-central-1), applied as the migration
-- `vendimet_dhe_fotot`. The review page at jara-fotografite.vercel.app talks to
-- it with the publishable key, i.e. as the `anon` role — so everything that key
-- may do is decided in this file, and nowhere else.
--
-- Append-only on purpose: the page may add a row and read rows, never change or
-- delete one. Anyone who has the link can add a wrong answer, but nobody can
-- destroy the team's work, and every row says who gave it and when. The answer
-- that counts is the newest row per product — `vendimet_aktuale`. A reviewer
-- taking an answer back adds a row with `vendimi` null.
--
-- `foto` is the key of the photo the answer was given on (see
-- lib/photo-derivatives.mjs): the chosen one, or an alternative the reviewer
-- took instead.

create table public.vendimet (
  id      uuid primary key default gen_random_uuid(),
  kodi    text not null check (char_length(kodi) between 1 and 40),
  vendimi text check (vendimi in ('pranuar', 'pasiguri', 'refuzuar')),
  foto    text check (foto ~ '^[0-9a-f]{16}$'),
  nga     text not null check (char_length(nga) between 1 and 60),
  seria   text check (char_length(seria) <= 60),
  -- server time, not the phone's: the newest row wins, and phones' clocks differ
  kur     timestamptz not null default clock_timestamp()
);
create index vendimet_kodi_kur on public.vendimet (kodi, kur desc);
create index vendimet_kur on public.vendimet (kur);

alter table public.vendimet enable row level security;
revoke all on public.vendimet from anon, authenticated;
grant select, insert on public.vendimet to anon;
create policy vendimet_lexo on public.vendimet for select to anon using (true);
-- the column checks above are the validation
create policy vendimet_shto on public.vendimet for insert to anon with check (true);

create view public.vendimet_aktuale with (security_invoker = true) as
  select distinct on (kodi) kodi, vendimi, foto, nga, kur
  from public.vendimet
  order by kodi, kur desc;
revoke all on public.vendimet_aktuale from anon, authenticated;
grant select on public.vendimet_aktuale to anon;

-- Public for reading only; nothing but small WebP files fits in.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotot', 'fotot', true, 2097152, array['image/webp']);

-- Uploading (upload-photos.mjs) needs, for the duration of the upload only:
--   create policy fotot_ngarkim on storage.objects for insert to anon with check (bucket_id = 'fotot');
-- and right afterwards:
--   drop policy fotot_ngarkim on storage.objects;
