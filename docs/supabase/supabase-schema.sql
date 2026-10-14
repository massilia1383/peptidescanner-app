-- ============================================================
-- PEPTIDESCANNER — Schéma Supabase complet
-- À coller dans : Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- 0. Extensions
-- ──────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ──────────────────────────────────────────────────────────────
-- 1. PROFILES  (complète auth.users)
-- ──────────────────────────────────────────────────────────────
create table public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text,
  full_name       text,
  weight_kg       numeric(5,2),
  goal            text,                         -- ex: "perte_graisse", "muscle", "anti_age"
  experience      text,                         -- "debutant" | "intermediaire" | "avance"
  lang            text default 'fr',            -- 'fr' | 'en' | 'es'
  premium         boolean default false,
  premium_until   timestamptz,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- trigger : crée un profil automatiquement à l'inscription
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ──────────────────────────────────────────────────────────────
-- 2. PEPTIDES  (bibliothèque globale — read-only pour users)
-- ──────────────────────────────────────────────────────────────
create table public.peptides (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  category        text,                         -- "GH", "PT", "IGF", etc.
  description_fr  text,
  description_en  text,
  description_es  text,
  typical_dose_mcg numeric(8,2),
  unit            text default 'mcg',           -- 'mcg' | 'IU' | 'mg'
  half_life_hours numeric(6,2),
  storage_temp    text,
  tags            text[],
  created_at      timestamptz default now()
);

-- ──────────────────────────────────────────────────────────────
-- 3. CURES  (protocoles utilisateur)
-- ──────────────────────────────────────────────────────────────
create table public.cures (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  name            text not null,
  peptide_id      uuid references public.peptides(id),
  peptide_name    text,                         -- nom libre si hors bibliothèque
  dose_mcg        numeric(8,2),
  unit            text default 'mcg',
  frequency       text,                         -- "1x/jour", "2x/jour", etc.
  duration_days   integer,
  start_date      date,
  end_date        date,
  status          text default 'active',        -- 'active' | 'paused' | 'completed'
  notes           text,
  injection_sites text[],                       -- rotation des sites
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ──────────────────────────────────────────────────────────────
-- 4. INJECTIONS  (log quotidien)
-- ──────────────────────────────────────────────────────────────
create table public.injections (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  cure_id         uuid references public.cures(id) on delete set null,
  peptide_name    text,
  dose_mcg        numeric(8,2),
  unit            text default 'mcg',
  injection_site  text,
  injected_at     timestamptz default now(),
  notes           text,
  skipped         boolean default false,
  created_at      timestamptz default now()
);

-- ──────────────────────────────────────────────────────────────
-- 5. POIDS  (suivi du poids)
-- ──────────────────────────────────────────────────────────────
create table public.weight_logs (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  weight_kg       numeric(5,2) not null,
  logged_at       date default current_date,
  notes           text,
  created_at      timestamptz default now()
);

-- ──────────────────────────────────────────────────────────────
-- 6. STOCK  (inventaire flacons)
-- ──────────────────────────────────────────────────────────────
create table public.inventory (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references public.profiles(id) on delete cascade,
  peptide_name        text not null,
  vial_qty_mg         numeric(8,2),             -- quantité par flacon
  vial_count          integer default 1,        -- nombre de flacons
  bac_water_ml        numeric(5,2),             -- eau bactériostatique
  reconstituted_at    date,
  expiry_date         date,
  lot_number          text,
  supplier            text,
  remaining_units     numeric(8,2),             -- unités restantes (mcg/IU)
  notes               text,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- ──────────────────────────────────────────────────────────────
-- 7. ALERTES
-- ──────────────────────────────────────────────────────────────
create table public.alerts (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  cure_id         uuid references public.cures(id) on delete cascade,
  type            text,                         -- 'injection' | 'stock_low' | 'expiry'
  title           text,
  message         text,
  scheduled_at    timestamptz,
  is_read         boolean default false,
  created_at      timestamptz default now()
);

-- ──────────────────────────────────────────────────────────────
-- 8. ROW LEVEL SECURITY
-- ──────────────────────────────────────────────────────────────

-- activer RLS sur toutes les tables user
alter table public.profiles   enable row level security;
alter table public.cures      enable row level security;
alter table public.injections enable row level security;
alter table public.weight_logs enable row level security;
alter table public.inventory  enable row level security;
alter table public.alerts     enable row level security;

-- peptides : lecture publique, écriture admin seulement
alter table public.peptides   enable row level security;
create policy "peptides_read" on public.peptides for select using (true);

-- profiles
create policy "profiles_own" on public.profiles
  for all using (auth.uid() = id);

-- cures
create policy "cures_own" on public.cures
  for all using (auth.uid() = user_id);

-- injections
create policy "injections_own" on public.injections
  for all using (auth.uid() = user_id);

-- weight_logs
create policy "weight_own" on public.weight_logs
  for all using (auth.uid() = user_id);

-- inventory
create policy "inventory_own" on public.inventory
  for all using (auth.uid() = user_id);

-- alerts
create policy "alerts_own" on public.alerts
  for all using (auth.uid() = user_id);

-- ──────────────────────────────────────────────────────────────
-- 9. INDEXES  (performances)
-- ──────────────────────────────────────────────────────────────
create index idx_cures_user      on public.cures(user_id);
create index idx_cures_status    on public.cures(status);
create index idx_injections_user on public.injections(user_id);
create index idx_injections_date on public.injections(injected_at);
create index idx_weight_user     on public.weight_logs(user_id);
create index idx_weight_date     on public.weight_logs(logged_at);
create index idx_inventory_user  on public.inventory(user_id);
create index idx_alerts_user     on public.alerts(user_id, is_read);

-- ──────────────────────────────────────────────────────────────
-- 10. UPDATED_AT auto-trigger
-- ──────────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger t_profiles_updated   before update on public.profiles   for each row execute procedure public.set_updated_at();
create trigger t_cures_updated      before update on public.cures      for each row execute procedure public.set_updated_at();
create trigger t_inventory_updated  before update on public.inventory  for each row execute procedure public.set_updated_at();
