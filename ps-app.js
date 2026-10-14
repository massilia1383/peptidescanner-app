/* ═══════════════════════════════════════════════════════════════
   ps-app.js — fonctions communes PeptideScanner
   Créé le 14/10/2026 (lot 2). À charger juste APRÈS lang.js, sur chaque page.

   1. Dates en heure locale (BUG-11)
      new Date('2026-08-01') lit la date en UTC : selon le fuseau, on obtient
      la veille. psDay() lit toujours la date telle qu'elle est écrite.
   2. Détection « appli installée » (iPhone / Android via Capacitor) ou navigateur.
   3. Rappels d'injection
      Dans l'appli : notifications programmées par le téléphone pour les 7 jours
      à venir (extension Capacitor « Local Notifications »).
      Dans un navigateur : rien ici, alertes.html garde son ancien fonctionnement.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  function pad(n) { return String(n).padStart(2, '0'); }

  // 'AAAA-MM-JJ' (ou date+heure) → Date à minuit, heure locale
  function psDay(v) {
    if (v instanceof Date) { var c = new Date(v.getTime()); c.setHours(0, 0, 0, 0); return c; }
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v == null ? '' : v));
    if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    var d = new Date(v); d.setHours(0, 0, 0, 0); return d;
  }

  // Date → 'AAAA-MM-JJ' en heure locale (remplace toISOString().split('T')[0])
  function psDayStr(d) {
    d = d || new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function isNativeApp() {
    var C = window.Capacitor;
    return !!(C && typeof C.isNativePlatform === 'function' && C.isNativePlatform());
  }

  function plugin(name) {
    var C = window.Capacitor;
    return C && C.Plugins ? C.Plugins[name] : null;
  }

  // ── Rappels : mêmes règles que alertes.html ───────────────────
  // cure.frequency = injections par jour (1, 2, 3, 0.5 = tous les 2 j, 0.14 = 1×/sem)
  function perDay(c) { var f = parseFloat(c && c.frequency); return (isFinite(f) && f > 0) ? f : 1; }
  function slotCount(c) { return Math.max(1, Math.ceil(perDay(c))); }
  function intervalDays(c) { var f = perDay(c); return f >= 1 ? 1 : Math.max(1, Math.round(1 / f)); }
  function defaultTimes(n) { return n === 1 ? ['08:00'] : n === 2 ? ['08:00', '20:00'] : ['07:00', '13:00', '20:00']; }

  // Liste des rappels à venir sur `days` jours.
  // remindersMap = réglages de la page Alertes (localStorage 'ps_reminders_<userId>').
  function buildInjectionPlan(cures, injections, remindersMap, days) {
    days = days || 7;
    var out = [], now = new Date(), today = psDay(now);
    (cures || []).forEach(function (cure) {
      if (!cure || cure.status !== 'active' || !cure.start_date) return;
      var s = psDay(cure.start_date);
      if (isNaN(s.getTime())) return;
      var e = new Date(s.getTime()); e.setDate(e.getDate() + (parseInt(cure.duration_days, 10) || 30));
      var saved = (remindersMap || {})[cure.id];
      if (saved && saved.enabled === false) return;
      var times = (saved && saved.times) || defaultTimes(slotCount(cure));
      var label = cure.peptide_name || cure.name || 'Injection';
      var dose = ((cure.dose_mcg || '') + ' ' + (cure.unit || '')).trim();
      for (var k = 0; k < days; k++) {
        var day = new Date(today.getTime()); day.setDate(day.getDate() + k);
        if (day < s || day > e) continue;
        if (Math.round((day - s) / 86400000) % intervalDays(cure) !== 0) continue;
        var ds = psDayStr(day);
        times.forEach(function (hm, i) {
          var p = String(hm).split(':');
          var at = new Date(day.getTime()); at.setHours(Number(p[0]) || 0, Number(p[1]) || 0, 0, 0);
          if (at <= now) return;
          // Créneau du jour déjà fait : pas de rappel
          var done = (injections || []).some(function (inj) {
            return inj.cure_id === cure.id && String(inj.injected_at || '').indexOf(ds) === 0 &&
                   String(inj.notes || '').indexOf('slot:' + i) >= 0;
          });
          if (done) return;
          out.push({ cureId: cure.id, title: '💉 ' + label, body: (dose ? dose + ' · ' : '') + hm, at: at });
        });
      }
    });
    out.sort(function (a, b) { return a.at - b.at; });
    return out;
  }

  // Programme les rappels sur le téléphone (remplace les précédents).
  // ask = true : demande l'autorisation si besoin (bouton de la page Alertes).
  // Renvoie true si la programmation a réussi, false sinon (navigateur, refus, erreur).
  async function scheduleReminders(items, ask) {
    if (!isNativeApp()) return false;
    var LN = plugin('LocalNotifications');
    if (!LN) return false;
    try {
      var perm = await LN.checkPermissions();
      if (perm.display !== 'granted' && ask) perm = await LN.requestPermissions();
      if (perm.display !== 'granted') return false;
      var pending = await LN.getPending();
      var old = (pending.notifications || [])
        .filter(function (n) { return n.extra && n.extra.ps === 1; })
        .map(function (n) { return { id: n.id }; });
      if (old.length) await LN.cancel({ notifications: old });
      if (!items || !items.length) return true;
      // iOS garde au plus 64 notifications en attente : on en programme 60 au maximum
      await LN.schedule({
        notifications: items.slice(0, 60).map(function (it, i) {
          return {
            id: 7000 + i,
            title: it.title,
            body: it.body,
            schedule: { at: it.at, allowWhileIdle: true },
            extra: { ps: 1, cureId: it.cureId }
          };
        })
      });
      return true;
    } catch (e) {
      console.warn('[ps-app] rappels :', e);
      return false;
    }
  }

  // Annule tous les rappels PeptideScanner programmés sur le téléphone
  async function cancelReminders() {
    if (!isNativeApp()) return;
    var LN = plugin('LocalNotifications');
    if (!LN) return;
    try {
      var pending = await LN.getPending();
      var old = (pending.notifications || [])
        .filter(function (n) { return n.extra && n.extra.ps === 1; })
        .map(function (n) { return { id: n.id }; });
      if (old.length) await LN.cancel({ notifications: old });
    } catch (e) { console.warn('[ps-app] annulation rappels :', e); }
  }

  window.psDay = psDay;
  window.psDayStr = psDayStr;
  window.PS_isNativeApp = isNativeApp;
  window.PS_buildInjectionPlan = buildInjectionPlan;
  window.PS_scheduleReminders = scheduleReminders;
  window.PS_cancelReminders = cancelReminders;
})();
