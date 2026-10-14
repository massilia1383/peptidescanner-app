-- ============================================================
-- TABLE ia_usage — tracking des appels IA par utilisateur
-- Optionnelle : permet le quota mensuel côté serveur
-- À coller dans Supabase → SQL Editor → New query
-- ============================================================

create table if not exists public.ia_usage (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  tokens_in   integer default 0,
  tokens_out  integer default 0,
  created_at  timestamptz default now()
);

alter table public.ia_usage enable row level security;

-- L'utilisateur peut lire ses propres usages (pour afficher le compteur)
create policy "ia_usage_read_own" on public.ia_usage
  for select using (auth.uid() = user_id);

-- Seule la Edge Function (service role) peut insérer
-- → pas de policy INSERT côté client = sécurisé

create index idx_ia_usage_user_date on public.ia_usage(user_id, created_at);
