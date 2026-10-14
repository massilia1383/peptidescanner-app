-- ═══════════════════════════════════════════════════════════════
-- PeptideScanner — 14/10/2026 — À LANCER PAR JAMES (éditeur SQL Supabase)
--
-- Problème : la règle « profiles_own » laisse chaque utilisateur modifier
-- toute sa ligne, y compris premium, premium_until et is_admin.
-- N'importe qui pouvait donc se passer Premium (ou admin) tout seul.
--
-- Correctif : un garde-fou avant chaque modification de profiles.
-- Ces trois colonnes ne peuvent changer que si l'appel vient :
--   - du serveur (clé service_role : future liaison RevenueCat, fonctions), ou
--   - d'un compte déjà admin (page d'administration).
-- Les autres colonnes (prénom, objectif, langue…) restent modifiables.
-- Rien n'est supprimé ; le script peut être relancé sans danger.
-- ═══════════════════════════════════════════════════════════════

create or replace function public.ps_protect_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_role text := coalesce(current_setting('request.jwt.claims', true)::json ->> 'role', '');
  caller_is_admin boolean := false;
begin
  -- Le serveur (service_role) et les connexions directes à la base passent toujours
  if caller_role = 'service_role' or caller_role = '' then
    return new;
  end if;

  select coalesce(p.is_admin, false) into caller_is_admin
  from public.profiles p
  where p.id = auth.uid();

  if caller_is_admin then
    return new;
  end if;

  if new.premium       is distinct from old.premium
  or new.premium_until is distinct from old.premium_until
  or new.is_admin      is distinct from old.is_admin then
    raise exception 'Modification non autorisée (premium / admin)';
  end if;

  return new;
end;
$$;

drop trigger if exists ps_protect_profile_privileges on public.profiles;
create trigger ps_protect_profile_privileges
  before update on public.profiles
  for each row execute function public.ps_protect_profile_privileges();

-- Vérification (lecture seule) : doit afficher une ligne
select tgname from pg_trigger where tgname = 'ps_protect_profile_privileges';
