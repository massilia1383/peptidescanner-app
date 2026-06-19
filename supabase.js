// ============================================================
// supabase.js — Couche universelle PeptideScanner
// Importer dans chaque page : <script src="/supabase.js"></script>
// ============================================================

// ──────────────────────────────────────────────────────────────
// CONFIG  →  remplacer par tes vraies valeurs Supabase
// ──────────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://dkwztwlkjewdzfichkgk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrd3p0d2xramV3ZHpmaWNoa2drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MjYwOTAsImV4cCI6MjA5NzQwMjA5MH0.iT7ylcNvPCf2jMUYfJlsDJcoGjPolphQWONFusAAlAk';

// ──────────────────────────────────────────────────────────────
// INIT CLIENT
// ──────────────────────────────────────────────────────────────
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ══════════════════════════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════════════════════════

/**
 * Inscription email + mot de passe
 * @param {string} email
 * @param {string} password
 * @returns {{ user, error }}
 */
export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  return { user: data?.user ?? null, error };
}

/**
 * Connexion email + mot de passe
 * @returns {{ user, session, error }}
 */
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { user: data?.user ?? null, session: data?.session ?? null, error };
}

/**
 * Déconnexion
 */
export async function signOut() {
  await supabase.auth.signOut();
  window.location.href = '/login.html';
}

/**
 * Récupère l'utilisateur connecté (null si non authentifié)
 */
export async function getUser() {
  const { data } = await supabase.auth.getUser();
  return data?.user ?? null;
}

/**
 * Redirige vers /login.html si l'utilisateur n'est pas connecté.
 * À appeler en haut de chaque page protégée.
 */
export async function requireAuth() {
  const user = await getUser();
  if (!user) {
    window.location.href = '/login.html';
    return null;
  }
  return user;
}

/**
 * Écoute les changements d'état auth (connexion / déconnexion)
 * @param {function} callback  - reçoit (event, session)
 */
export function onAuthChange(callback) {
  return supabase.auth.onAuthStateChange(callback);
}

// ══════════════════════════════════════════════════════════════
// PROFIL
// ══════════════════════════════════════════════════════════════

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return { data, error };
}

export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  return { data, error };
}

// ══════════════════════════════════════════════════════════════
// CURES
// ══════════════════════════════════════════════════════════════

export async function getCures(userId, status = null) {
  let query = supabase
    .from('cures')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  return { data: data ?? [], error };
}

export async function getCure(id) {
  const { data, error } = await supabase
    .from('cures')
    .select('*')
    .eq('id', id)
    .single();
  return { data, error };
}

export async function createCure(userId, cure) {
  const { data, error } = await supabase
    .from('cures')
    .insert({ ...cure, user_id: userId })
    .select()
    .single();
  return { data, error };
}

export async function updateCure(id, updates) {
  const { data, error } = await supabase
    .from('cures')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  return { data, error };
}

export async function deleteCure(id) {
  const { error } = await supabase.from('cures').delete().eq('id', id);
  return { error };
}

// ══════════════════════════════════════════════════════════════
// INJECTIONS
// ══════════════════════════════════════════════════════════════

export async function getInjections(userId, { cureId = null, from = null, to = null, limit = 100 } = {}) {
  let query = supabase
    .from('injections')
    .select('*')
    .eq('user_id', userId)
    .order('injected_at', { ascending: false })
    .limit(limit);

  if (cureId) query = query.eq('cure_id', cureId);
  if (from)   query = query.gte('injected_at', from);
  if (to)     query = query.lte('injected_at', to);

  const { data, error } = await query;
  return { data: data ?? [], error };
}

export async function logInjection(userId, injection) {
  const { data, error } = await supabase
    .from('injections')
    .insert({ ...injection, user_id: userId })
    .select()
    .single();
  return { data, error };
}

export async function deleteInjection(id) {
  const { error } = await supabase.from('injections').delete().eq('id', id);
  return { error };
}

// ══════════════════════════════════════════════════════════════
// POIDS
// ══════════════════════════════════════════════════════════════

export async function getWeightLogs(userId, limit = 90) {
  const { data, error } = await supabase
    .from('weight_logs')
    .select('*')
    .eq('user_id', userId)
    .order('logged_at', { ascending: false })
    .limit(limit);
  return { data: data ?? [], error };
}

export async function logWeight(userId, weight_kg, notes = '') {
  const { data, error } = await supabase
    .from('weight_logs')
    .insert({ user_id: userId, weight_kg, notes })
    .select()
    .single();
  return { data, error };
}

export async function deleteWeightLog(id) {
  const { error } = await supabase.from('weight_logs').delete().eq('id', id);
  return { error };
}

// ══════════════════════════════════════════════════════════════
// INVENTAIRE (STOCK)
// ══════════════════════════════════════════════════════════════

export async function getInventory(userId) {
  const { data, error } = await supabase
    .from('inventory')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return { data: data ?? [], error };
}

export async function createInventoryItem(userId, item) {
  const { data, error } = await supabase
    .from('inventory')
    .insert({ ...item, user_id: userId })
    .select()
    .single();
  return { data, error };
}

export async function updateInventoryItem(id, updates) {
  const { data, error } = await supabase
    .from('inventory')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  return { data, error };
}

export async function deleteInventoryItem(id) {
  const { error } = await supabase.from('inventory').delete().eq('id', id);
  return { error };
}

// ══════════════════════════════════════════════════════════════
// ALERTES
// ══════════════════════════════════════════════════════════════

export async function getAlerts(userId, unreadOnly = false) {
  let query = supabase
    .from('alerts')
    .select('*')
    .eq('user_id', userId)
    .order('scheduled_at', { ascending: true });

  if (unreadOnly) query = query.eq('is_read', false);

  const { data, error } = await query;
  return { data: data ?? [], error };
}

export async function markAlertRead(id) {
  const { error } = await supabase
    .from('alerts')
    .update({ is_read: true })
    .eq('id', id);
  return { error };
}

// ══════════════════════════════════════════════════════════════
// PEPTIDES (bibliothèque)
// ══════════════════════════════════════════════════════════════

export async function searchPeptides(query = '', limit = 20) {
  let req = supabase
    .from('peptides')
    .select('*')
    .limit(limit);

  if (query) {
    req = req.ilike('name', `%${query}%`);
  }

  const { data, error } = await req;
  return { data: data ?? [], error };
}

// ══════════════════════════════════════════════════════════════
// MIGRATION localStorage → Supabase
// ══════════════════════════════════════════════════════════════

/**
 * Migre toutes les données localStorage vers Supabase.
 * À appeler une seule fois après la 1ère connexion de l'utilisateur.
 * Marque la migration comme faite dans localStorage pour éviter les doublons.
 */
export async function migrateLocalStorageToSupabase(userId) {
  const migrationKey = 'ps_migrated_v1';
  if (localStorage.getItem(migrationKey)) return { skipped: true };

  const results = { cures: 0, injections: 0, weight: 0, inventory: 0, errors: [] };

  try {
    // ── Cures ──────────────────────────────────────────────
    const localCures = JSON.parse(localStorage.getItem('cures') || '[]');
    for (const cure of localCures) {
      const { error } = await createCure(userId, {
        name:           cure.name || cure.peptide || 'Cure importée',
        peptide_name:   cure.peptide || cure.name,
        dose_mcg:       parseFloat(cure.dose) || null,
        unit:           cure.unit || 'mcg',
        frequency:      cure.frequency || null,
        duration_days:  parseInt(cure.duration) || null,
        start_date:     cure.startDate || null,
        status:         cure.status || 'active',
        notes:          cure.notes || null,
        injection_sites: cure.injectionSites || [],
      });
      if (error) results.errors.push(`cure: ${error.message}`);
      else results.cures++;
    }

    // ── Injections ─────────────────────────────────────────
    const localInjections = JSON.parse(localStorage.getItem('injections') || '[]');
    for (const inj of localInjections) {
      const { error } = await logInjection(userId, {
        peptide_name:   inj.peptide || inj.peptideName,
        dose_mcg:       parseFloat(inj.dose) || null,
        unit:           inj.unit || 'mcg',
        injection_site: inj.site || inj.injectionSite || null,
        injected_at:    inj.date || inj.injectedAt || new Date().toISOString(),
        notes:          inj.notes || null,
        skipped:        inj.skipped || false,
      });
      if (error) results.errors.push(`injection: ${error.message}`);
      else results.injections++;
    }

    // ── Poids ──────────────────────────────────────────────
    const localWeight = JSON.parse(localStorage.getItem('weightLogs') || localStorage.getItem('poids') || '[]');
    for (const w of localWeight) {
      const { error } = await logWeight(userId, parseFloat(w.weight || w.poids), w.notes);
      if (error) results.errors.push(`weight: ${error.message}`);
      else results.weight++;
    }

    // ── Inventaire ─────────────────────────────────────────
    const localInventory = JSON.parse(localStorage.getItem('inventory') || localStorage.getItem('stock') || '[]');
    for (const item of localInventory) {
      const { error } = await createInventoryItem(userId, {
        peptide_name:     item.name || item.peptide,
        vial_qty_mg:      parseFloat(item.qty || item.vialQty) || null,
        vial_count:       parseInt(item.count || item.vialCount) || 1,
        bac_water_ml:     parseFloat(item.bacWater || item.waterMl) || null,
        reconstituted_at: item.reconstitutedAt || null,
        expiry_date:      item.expiryDate || null,
        supplier:         item.supplier || null,
        notes:            item.notes || null,
      });
      if (error) results.errors.push(`inventory: ${error.message}`);
      else results.inventory++;
    }

    // Marquer migration comme terminée
    localStorage.setItem(migrationKey, JSON.stringify({ date: new Date().toISOString(), results }));
    console.log('[PeptideScanner] Migration localStorage → Supabase terminée', results);

  } catch (err) {
    results.errors.push(`global: ${err.message}`);
    console.error('[PeptideScanner] Erreur migration', err);
  }

  return results;
}

// ══════════════════════════════════════════════════════════════
// UTILITAIRES
// ══════════════════════════════════════════════════════════════

/**
 * Formate une erreur Supabase en message lisible
 */
export function formatError(error) {
  if (!error) return null;
  const messages = {
    'Invalid login credentials': 'Email ou mot de passe incorrect.',
    'Email not confirmed':       'Confirme ton email avant de te connecter.',
    'User already registered':   'Un compte existe déjà avec cet email.',
  };
  return messages[error.message] || error.message || 'Une erreur est survenue.';
}
