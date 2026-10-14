-- ═══════════════════════════════════════════════════════════════
-- PeptideScanner — script 2026-10-15 — À LANCER PAR JAMES (éditeur SQL Supabase)
--
-- BUG-09 : les notes du jour de la page Cure n'étaient enregistrées que dans le
-- téléphone (perdues si on change d'appareil ou si on vide le navigateur).
-- Ce script crée la table qui les garde dans Supabase.
--
-- Tant que ce script n'est pas lancé, l'appli continue d'écrire dans le téléphone.
-- Une fois lancé, les notes restées dans le téléphone sont recopiées toutes seules
-- à la prochaine ouverture de la page Cure.
-- Rien n'est supprimé ; le script peut être relancé sans danger.
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.day_notes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  cure_id     uuid not null references public.cures(id)    on delete cascade,
  day         date not null,
  note        text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, cure_id, day)
);

alter table public.day_notes enable row level security;

drop policy if exists "day_notes_own" on public.day_notes;
create policy "day_notes_own" on public.day_notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Vérification (lecture seule) : doit afficher day_notes avec rowsecurity = true
select tablename, rowsecurity from pg_tables where schemaname = 'public' and tablename = 'day_notes';
