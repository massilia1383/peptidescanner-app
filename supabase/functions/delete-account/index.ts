// ═══════════════════════════════════════════════════════════════
// PeptideScanner — Edge Function : delete-account
// Créée le 14/10/2026 — exigence Apple 5.1.1(v) et Google Play :
// l'utilisateur doit pouvoir supprimer son compte depuis l'appli.
//
// Ce que fait la fonction :
//   1. vérifie qui appelle (jeton de session envoyé par profil.html) ;
//   2. supprime CET utilisateur de l'authentification Supabase.
// La base efface ensuite en cascade : profiles → cures, injections,
// weight_logs, inventory, alerts (clés « on delete cascade »).
//
// La clé SUPABASE_SERVICE_ROLE_KEY est fournie automatiquement par
// Supabase aux Edge Functions : elle n'apparaît dans aucun fichier.
// Déploiement : par James uniquement.
// ═══════════════════════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST')    return json({ error: 'Méthode non autorisée' }, 405);

  try {
    // 1. Qui appelle ? (on ne supprime jamais un autre compte que le sien)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Non authentifié' }, 401);

    const asUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authError } = await asUser.auth.getUser();
    if (authError || !user) return json({ error: 'Session invalide' }, 401);

    // 2. Suppression avec les droits serveur
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    );
    const { error: delError } = await admin.auth.admin.deleteUser(user.id);
    if (delError) {
      console.error('delete-account', user.id, delError.message);
      return json({ error: 'Suppression impossible' }, 500);
    }

    return json({ ok: true });
  } catch (e) {
    console.error('delete-account', (e as Error).message);
    return json({ error: 'Erreur serveur' }, 500);
  }
});
