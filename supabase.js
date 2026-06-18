// ═══════════════════════════════════════════════════════════════
// PEPTIDESCANNER — Client Supabase v1.0
// Remplace localStorage par une vraie base de données
// ═══════════════════════════════════════════════════════════════

// ── CONFIG ────────────────────────────────────────────────────
// Remplacer par vos vraies valeurs Supabase
const SUPABASE_URL = 'https://VOTRE-PROJET.supabase.co';
const SUPABASE_ANON_KEY = 'VOTRE_ANON_KEY';

// Import SDK Supabase (à ajouter dans le <head> des pages HTML)
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ═══════════════════════════════════════════════════════════════
// AUTH — Authentification
// ═══════════════════════════════════════════════════════════════

const Auth = {

  // Inscription
  async register({ prenom, email, password, age, taille, objectif, poids, plan }) {
    const { data, error } = await db.auth.signUp({
      email,
      password,
      options: {
        data: { prenom } // Transmis au trigger handle_new_user
      }
    });
    if (error) throw error;

    // Mettre à jour le profil avec les infos complètes
    if (data.user) {
      await Profile.update(data.user.id, { prenom, age, taille, objectif, plan });

      // Ajouter le poids initial si fourni
      if (poids) {
        await Weight.add({ weight_kg: parseFloat(poids), note: 'Poids initial' });
      }
    }
    return data;
  },

  // Connexion
  async login({ email, password }) {
    const { data, error } = await db.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  // Déconnexion
  async logout() {
    const { error } = await db.auth.signOut();
    if (error) throw error;
  },

  // Mot de passe oublié
  async forgotPassword(email) {
    const { error } = await db.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login.html?reset=true`
    });
    if (error) throw error;
  },

  // Utilisateur courant
  async getUser() {
    const { data: { user } } = await db.auth.getUser();
    return user;
  },

  // Écouter les changements d'auth
  onAuthChange(callback) {
    return db.auth.onAuthStateChange(callback);
  },

  // Vérifier si connecté
  async isLoggedIn() {
    const user = await this.getUser();
    return !!user;
  }
};

// ═══════════════════════════════════════════════════════════════
// PROFILE — Profil utilisateur
// ═══════════════════════════════════════════════════════════════

const Profile = {

  // Charger le profil
  async get() {
    const user = await Auth.getUser();
    if (!user) return null;

    const { data, error } = await db
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) throw error;
    return data;
  },

  // Mettre à jour le profil
  async update(userId, updates) {
    const id = userId || (await Auth.getUser())?.id;
    if (!id) throw new Error('Non connecté');

    const { data, error } = await db
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Vérifier si Premium
  async isPremium() {
    const profile = await this.get();
    if (!profile) return false;
    if (profile.plan === 'premium' || profile.plan === 'pro') {
      // Vérifier expiration
      if (profile.premium_until) {
        return new Date(profile.premium_until) > new Date();
      }
      return true;
    }
    return false;
  },

  // Activer Premium (après paiement Stripe)
  async activatePremium(stripeSubscriptionId) {
    const premiumUntil = new Date();
    premiumUntil.setFullYear(premiumUntil.getFullYear() + 1);

    return await this.update(null, {
      plan: 'premium',
      premium_until: premiumUntil.toISOString()
    });
  },

  // Stats utilisateur
  async getStats() {
    const user = await Auth.getUser();
    if (!user) return null;

    const { data, error } = await db
      .from('user_stats')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) throw error;
    return data;
  }
};

// ═══════════════════════════════════════════════════════════════
// CURES — Gestion des protocoles
// ═══════════════════════════════════════════════════════════════

const Cures = {

  // Toutes les cures de l'utilisateur
  async getAll() {
    const { data, error } = await db
      .from('cures')
      .select('*')
      .order('start_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Cure active aujourd'hui
  async getActive() {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await db
      .from('active_cures')
      .select('*');

    if (error) throw error;
    return data || [];
  },

  // Créer une cure
  async create({ peptide, dosage, admin, freq, start_date, duration, notes }) {
    const user = await Auth.getUser();
    if (!user) throw new Error('Non connecté');

    const { data, error } = await db
      .from('cures')
      .insert({
        user_id: user.id,
        peptide,
        dosage,
        admin,
        freq: parseFloat(freq),
        start_date,
        duration: parseInt(duration),
        notes,
        status: 'active'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Modifier une cure
  async update(id, updates) {
    const { data, error } = await db
      .from('cures')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Supprimer une cure
  async delete(id) {
    const { error } = await db
      .from('cures')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Compliance d'une cure
  async getCompliance(cureId) {
    const { data, error } = await db
      .rpc('get_cure_compliance', { cure_uuid: cureId });

    if (error) throw error;
    return data;
  }
};

// ═══════════════════════════════════════════════════════════════
// INJECTION LOGS — Journal des injections
// ═══════════════════════════════════════════════════════════════

const InjectionLogs = {

  // Logs d'une cure pour une période
  async getByCure(cureId, startDate, endDate) {
    let query = db
      .from('injection_logs')
      .select('*')
      .eq('cure_id', cureId)
      .order('log_date', { ascending: true });

    if (startDate) query = query.gte('log_date', startDate);
    if (endDate) query = query.lte('log_date', endDate);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  // Logs du jour
  async getToday(cureId) {
    const today = new Date().toISOString().split('T')[0];
    return await this.getByCure(cureId, today, today);
  },

  // Marquer une injection comme faite
  async markDone(cureId, logDate, slot) {
    const user = await Auth.getUser();
    if (!user) throw new Error('Non connecté');

    const { data, error } = await db
      .from('injection_logs')
      .upsert({
        cure_id: cureId,
        user_id: user.id,
        log_date: logDate,
        slot,
        injected_at: new Date().toTimeString().split(' ')[0]
      }, { onConflict: 'cure_id,log_date,slot' })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Annuler une injection
  async markUndone(cureId, logDate, slot) {
    const { error } = await db
      .from('injection_logs')
      .delete()
      .eq('cure_id', cureId)
      .eq('log_date', logDate)
      .eq('slot', slot);

    if (error) throw error;
  },

  // Ajouter une note à un jour
  async addNote(cureId, logDate, note) {
    const user = await Auth.getUser();
    if (!user) throw new Error('Non connecté');

    // Upsert sur le slot 0 pour la note du jour
    const { error } = await db
      .from('injection_logs')
      .update({ note })
      .eq('cure_id', cureId)
      .eq('log_date', logDate);

    if (error) throw error;
  }
};

// ═══════════════════════════════════════════════════════════════
// WEIGHT — Suivi du poids
// ═══════════════════════════════════════════════════════════════

const Weight = {

  // Tout l'historique
  async getAll(limitDays = 0) {
    let query = db
      .from('weight_entries')
      .select('*')
      .order('entry_date', { ascending: true });

    if (limitDays > 0) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - limitDays);
      query = query.gte('entry_date', cutoff.toISOString().split('T')[0]);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  // Ajouter / mettre à jour un poids
  async add({ weight_kg, entry_date, note }) {
    const user = await Auth.getUser();
    if (!user) throw new Error('Non connecté');

    const date = entry_date || new Date().toISOString().split('T')[0];

    const { data, error } = await db
      .from('weight_entries')
      .upsert({
        user_id: user.id,
        entry_date: date,
        weight_kg: parseFloat(weight_kg),
        note: note || null
      }, { onConflict: 'user_id,entry_date' })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Supprimer une entrée
  async delete(id) {
    const { error } = await db
      .from('weight_entries')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Dernière pesée
  async getLatest() {
    const { data, error } = await db
      .from('weight_entries')
      .select('*')
      .order('entry_date', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  }
};

// ═══════════════════════════════════════════════════════════════
// ALERTS — Alertes & rappels
// ═══════════════════════════════════════════════════════════════

const Alerts = {

  // Toutes les alertes
  async getAll() {
    const { data, error } = await db
      .from('alerts')
      .select('*')
      .order('alert_date', { ascending: true })
      .order('alert_time', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Alertes non lues
  async getUnread() {
    const { data, error } = await db
      .from('alerts')
      .select('*')
      .eq('is_read', false)
      .order('alert_date', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Créer une alerte
  async create({ message, alert_date, alert_time, priority, is_recurrent, recur_days }) {
    const user = await Auth.getUser();
    if (!user) throw new Error('Non connecté');

    const { data, error } = await db
      .from('alerts')
      .insert({
        user_id: user.id,
        message,
        alert_date,
        alert_time,
        priority: priority || 'green',
        is_recurrent: is_recurrent || false,
        recur_days: recur_days || null
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Marquer comme lue
  async markRead(id) {
    const { error } = await db
      .from('alerts')
      .update({ is_read: true })
      .eq('id', id);

    if (error) throw error;
  },

  // Supprimer
  async delete(id) {
    const { error } = await db
      .from('alerts')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

// ═══════════════════════════════════════════════════════════════
// IA — Conversation avec le Conseiller
// ═══════════════════════════════════════════════════════════════

const IA = {

  // Récupérer la conversation
  async getConversation() {
    const { data, error } = await db
      .from('ia_conversations')
      .select('*')
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },

  // Sauvegarder les messages
  async saveMessages(messages, questionsUsed) {
    const user = await Auth.getUser();
    if (!user) throw new Error('Non connecté');

    const { data, error } = await db
      .from('ia_conversations')
      .upsert({
        user_id: user.id,
        messages: messages.slice(-20), // Garder les 20 derniers
        questions_used: questionsUsed
      }, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Appel à l'IA via Edge Function (proxy sécurisé)
  async ask(messages, systemPrompt) {
    const { data: { session } } = await db.auth.getSession();

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/ai-chat`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ messages, systemPrompt })
      }
    );

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Erreur IA');
    }

    const data = await response.json();
    return data.content?.[0]?.text || 'Désolé, je n\'ai pas pu répondre.';
  }
};

// ═══════════════════════════════════════════════════════════════
// AFFILIATE — Tracking boutiques
// ═══════════════════════════════════════════════════════════════

const Affiliate = {

  // Logger un clic
  async trackClick(shopId, shopName, sourcePage) {
    const user = await Auth.getUser();

    const { error } = await db
      .from('affiliate_clicks')
      .insert({
        user_id: user?.id || null,
        shop_id: shopId,
        shop_name: shopName,
        source_page: sourcePage || window.location.pathname
      });

    if (error) console.warn('Affiliate tracking error:', error);
  }
};

// ═══════════════════════════════════════════════════════════════
// REALTIME — Synchronisation temps réel
// ═══════════════════════════════════════════════════════════════

const Realtime = {

  // S'abonner aux changements de cures
  subscribeCures(callback) {
    return db
      .channel('cures-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'cures' },
        callback
      )
      .subscribe();
  },

  // S'abonner aux nouvelles alertes
  subscribeAlerts(callback) {
    return db
      .channel('alerts-changes')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'alerts' },
        callback
      )
      .subscribe();
  },

  // Se désabonner
  unsubscribe(channel) {
    db.removeChannel(channel);
  }
};

// ═══════════════════════════════════════════════════════════════
// MIGRATION — localStorage → Supabase
// Fonction one-shot pour migrer les données existantes
// ═══════════════════════════════════════════════════════════════

const Migration = {

  async migrateFromLocalStorage() {
    console.log('[Migration] Début de la migration localStorage → Supabase');
    let migrated = 0;
    const errors = [];

    try {
      // Migrer les cures
      const localCures = JSON.parse(localStorage.getItem('pt_cures') || '[]');
      for (const c of localCures) {
        try {
          const newCure = await Cures.create({
            peptide: c.peptide,
            dosage: c.dosage,
            admin: c.admin,
            freq: c.freq,
            start_date: c.startDate,
            duration: c.duration,
            notes: c.notes
          });

          // Migrer les logs de cette cure
          const localLogs = JSON.parse(localStorage.getItem('pt_logs_' + c.id) || '[]');
          for (const log of localLogs) {
            try {
              await InjectionLogs.markDone(newCure.id, log.date, log.slot || 0);
              migrated++;
            } catch (e) { /* skip doublon */ }
          }
        } catch (e) {
          errors.push('cure: ' + c.peptide + ' — ' + e.message);
        }
      }

      // Migrer le poids
      const localWeights = JSON.parse(localStorage.getItem('pt_weights') || '[]');
      for (const w of localWeights) {
        try {
          await Weight.add({ weight_kg: w.kg, entry_date: w.date, note: w.note });
          migrated++;
        } catch (e) { /* skip doublon */ }
      }

      // Migrer les alertes
      const localAlerts = JSON.parse(localStorage.getItem('pt_alertes') || '[]');
      for (const a of localAlerts) {
        try {
          await Alerts.create({
            message: a.msg,
            alert_date: a.date,
            alert_time: a.time,
            priority: a.priority
          });
          migrated++;
        } catch (e) { errors.push('alerte: ' + a.msg); }
      }

      // Migrer le profil
      const localProfil = JSON.parse(localStorage.getItem('pt_profil') || '{}');
      if (localProfil.prenom || localProfil.taille) {
        await Profile.update(null, {
          prenom: localProfil.prenom,
          age: localProfil.age ? parseInt(localProfil.age) : null,
          taille: localProfil.taille ? parseInt(localProfil.taille) : null,
          objectif: localProfil.objectif
        });
      }

      console.log(`[Migration] ✓ ${migrated} éléments migrés`);
      if (errors.length > 0) console.warn('[Migration] Erreurs:', errors);

      // Marquer la migration comme effectuée
      localStorage.setItem('pt_migrated_to_supabase', new Date().toISOString());

      return { success: true, migrated, errors };
    } catch (err) {
      console.error('[Migration] Erreur fatale:', err);
      return { success: false, error: err.message };
    }
  }
};

// ═══════════════════════════════════════════════════════════════
// HELPER — Vérifier la session au chargement de chaque page
// ═══════════════════════════════════════════════════════════════

async function requireAuth(redirectTo = 'login.html') {
  const user = await Auth.getUser();
  if (!user) {
    window.location.href = redirectTo;
    return null;
  }
  return user;
}

// Export global
window.PeptideDB = {
  Auth,
  Profile,
  Cures,
  InjectionLogs,
  Weight,
  Alerts,
  IA,
  Affiliate,
  Realtime,
  Migration,
  requireAuth,
  db // accès direct si besoin
};

console.log('[Supabase] PeptideScanner DB client v1.0 chargé');
