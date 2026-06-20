// ═══════════════════════════════════════════════════════════════
// PeptideScanner — Edge Function : ai-proxy
// Proxy sécurisé vers l'API Google Gemini Flash (gratuit)
// Vérifie : auth Supabase + statut Premium + quota mensuel
// ═══════════════════════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GEMINI_MODEL   = 'gemini-1.5-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const MONTHLY_QUOTA  = 30; // questions / utilisateur Premium / mois

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // ── 1. Auth Supabase ────────────────────────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return json({ error: 'Non authentifié' }, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return json({ error: 'Session invalide' }, 401);
    }

    // ── 2. Vérifier le statut Premium ───────────────────────────
    const { data: profile } = await supabase
      .from('profiles')
      .select('premium, premium_until')
      .eq('id', user.id)
      .single();

    const isPremium = profile?.premium === true &&
      (!profile?.premium_until || new Date(profile.premium_until) > new Date());

    if (!isPremium) {
      return json({ error: 'Accès Premium requis pour utiliser le Conseiller IA.' }, 403);
    }

    // ── 3. Vérifier le quota mensuel ────────────────────────────
    const now        = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

    let monthUsed = 0;
    try {
      const { count } = await supabase
        .from('ia_usage')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', monthStart)
        .lt('created_at', monthEnd);
      monthUsed = count || 0;
    } catch (_) {
      // Table ia_usage pas encore créée → on continue sans quota serveur
    }

    if (monthUsed >= MONTHLY_QUOTA) {
      return json({
        error: `Quota mensuel atteint (${MONTHLY_QUOTA} questions/mois). Renouvellement le 1er du mois.`
      }, 402);
    }

    // ── 4. Parser le body ───────────────────────────────────────
    const { system, messages } = await req.json();
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return json({ error: 'Messages manquants' }, 400);
    }

    // ── 5. Appel Gemini Flash ───────────────────────────────────
    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiKey) {
      return json({ error: 'Clé API Gemini non configurée' }, 500);
    }

    // Convertir le format messages (OpenAI/Anthropic) → Gemini
    const geminiContents = messages.slice(-10).map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const geminiBody = {
      system_instruction: system ? { parts: [{ text: system }] } : undefined,
      contents: geminiContents,
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.7,
      }
    };

    const geminiRes = await fetch(`${GEMINI_API_URL}?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiBody),
    });

    if (!geminiRes.ok) {
      const err = await geminiRes.json().catch(() => ({}));
      console.error('Gemini error:', err);
      return json({ error: 'Erreur API Gemini : ' + (err.error?.message || geminiRes.status) }, 500);
    }

    const geminiData = await geminiRes.json();
    const content = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!content) {
      return json({ error: 'Réponse vide reçue de Gemini' }, 500);
    }

    // ── 6. Logger l'usage ───────────────────────────────────────
    try {
      await supabase.from('ia_usage').insert({
        user_id:    user.id,
        tokens_in:  geminiData.usageMetadata?.promptTokenCount     || 0,
        tokens_out: geminiData.usageMetadata?.candidatesTokenCount || 0,
      });
    } catch (_) {
      // Silencieux si table absente
    }

    return json({ content }, 200);

  } catch (err) {
    console.error('ai-proxy error:', err);
    return json({ error: 'Erreur interne du serveur' }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
