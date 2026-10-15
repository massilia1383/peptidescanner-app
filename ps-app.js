/* ═══════════════════════════════════════════════════════════════
   ps-app.js — fonctions communes PeptideScanner
   Créé le 14/10/2026 (lot 2). À charger juste APRÈS lang.js et
   /assets/assets-bundle.js, sur chaque page.

   1. Dates en heure locale (BUG-11)
      new Date('2026-08-01') lit la date en UTC : selon le fuseau, on obtient
      la veille. psDay() lit toujours la date telle qu'elle est écrite.
   2. Détection « appli installée » (iPhone / Android via Capacitor) ou navigateur.
   3. Rappels d'injection
      Dans l'appli : notifications programmées par le téléphone pour les 7 jours
      à venir (extension Capacitor « Local Notifications »).
      Dans un navigateur : rien ici, alertes.html garde son ancien fonctionnement.
   4. Design Clarté (15/10/2026) : icônes, illustrations du matériel,
      formes des 6 états, ossature commune (logo, menu avatar, thème).
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

  /* ═════════════════════════════════════════════════════════════
     Design Clarté — icônes, matériel, états, ossature commune
     (les dessins viennent de /assets/assets-bundle.js : PS_ICONS,
     PS_ASSETS, PS_LOGO ; source éditable dans assets/)
     ═════════════════════════════════════════════════════════════ */
  var serial = 0;

  // Icône Heroicons (24×24, trait currentColor). cl = classes CSS en plus.
  function psIcon(name, cl) {
    var icons = window.PS_ICONS || {};
    var s = icons[name] || icons['information-circle'] || '';
    if (!s) return '';
    return s.replace('<svg ', '<svg aria-hidden="true" class="icon ' + (cl || '') + '" ');
  }

  // Illustration du matériel (flacon, seringue, cartouche, stylo).
  // Les id internes sont préfixés pour pouvoir insérer plusieurs fois le même
  // dessin dans la page ; data-part garde le nom stable pour PS_updateLevel.
  function psAsset(name, cl) {
    var assets = window.PS_ASSETS || {};
    var s = assets[name] || '';
    if (!s) return '';
    var id = 'a' + (++serial) + '-';
    s = s.replace(/id="([^"]+)"/g, function (_, v) { return 'id="' + id + v + '" data-part="' + v + '"'; })
         .replace(/url\(#([^\)]+)\)/g, function (_, v) { return 'url(#' + id + v + ')'; });
    return s.replace('<svg ', '<svg class="' + (cl || 'equipment') + '" ');
  }

  // Les 6 formes d'état : reconnaissables sans la couleur.
  // Codes acceptés : done, partial, missed, shifted (= reporté), planned, rest.
  var STATUS_SHAPES = {
    done: '<circle cx="12" cy="12" r="9" fill="currentColor"/><path d="m8 12 3 3 5-6" stroke="var(--surface,#fff)" stroke-width="2" fill="none"/>',
    partial: '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.7" fill="none"/><path d="M12 3a9 9 0 0 0 0 18Z" fill="currentColor"/>',
    missed: '<rect x="3" y="3" width="18" height="18" rx="4" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M8 12h8" stroke="currentColor" stroke-width="2"/>',
    shifted: '<path d="m12 2 10 10-10 10L2 12Z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8 16v-5h8m-3-3 3 3-3 3" fill="none" stroke="currentColor" stroke-width="1.5"/>',
    planned: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.7"/>',
    rest: '<rect x="2" y="5" width="20" height="14" rx="7" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M9 9v6m6-6v6" stroke="currentColor" stroke-width="2"/>'
  };
  STATUS_SHAPES.postponed = STATUS_SHAPES.shifted;
  STATUS_SHAPES['shifted-origin'] = STATUS_SHAPES.shifted;
  STATUS_SHAPES['shifted-received'] = STATUS_SHAPES.shifted;

  // Puce d'état complète : <span class="status" data-status="…">forme + libellé</span>
  // label : texte à afficher ('' = forme seule, le conteneur porte alors l'aria-label).
  function psStatusIcon(code, label) {
    var shape = STATUS_SHAPES[code] || STATUS_SHAPES.planned;
    return '<span class="status" data-status="' + code + '">' +
      '<svg class="status-icon" viewBox="0 0 24 24" aria-hidden="true">' + shape + '</svg>' +
      (label ? label : '') + '</span>';
  }

  // Place le niveau de liquide sur une seringue ou une cartouche déjà insérée
  // (svg = l'élément <svg>, type = 'syringe' | 'cartridge', ml / units calculés,
  //  label = texte du repère, ex. '0,25 ml · 25 U'). Règles du kit Clarté.
  function psUpdateLevel(svg, type, ml, units, label) {
    if (!svg) return;
    function part(n) { return svg.querySelector('[data-part="' + n + '"]'); }
    var x;
    if (type === 'syringe') {
      var cap = Number(svg.dataset.capacity) || 100;
      x = 80 + 250 * units / cap;
      var f1 = part('syringe-liquid-fill'); if (f1) f1.setAttribute('width', 250 * units / cap);
      var l1 = part('syringe-level-line'); if (l1) l1.setAttribute('d', 'M' + x + ' 42V91');
    } else {
      x = 68 + 230 * ml / 3;
      var f2 = part('cartridge-liquid-fill'); if (f2) f2.setAttribute('width', 230 * ml / 3);
      var l2 = part('cartridge-level-line'); if (l2) l2.setAttribute('d', 'M' + x + ' 40V109');
    }
    var m = part(type + '-level-marker'); if (m) m.setAttribute('visibility', 'visible');
    var lab = part(type + '-level-label');
    if (lab) {
      lab.setAttribute('x', Math.max(80, Math.min(type === 'syringe' ? 300 : 280, x)));
      lab.textContent = label;
    }
    svg.setAttribute('aria-label', label);
  }

  // Niveau de liquide d'un flacon (fraction entre 0 et 1)
  function psVialLevel(svg, fraction) {
    if (!svg) return;
    function part(n) { return svg.querySelector('[data-part="' + n + '"]'); }
    var v = Math.max(0, Math.min(1, Number(fraction) || 0));
    var y = 178 - v * 106;
    var fill = part('vial-liquid-fill');
    if (fill) { fill.setAttribute('y', y); fill.setAttribute('height', 178 - y); }
    var men = part('vial-meniscus');
    if (men) men.setAttribute('d', 'M42 ' + y + 'Q70 ' + (y + 6) + ' 98 ' + y);
    var liq = part('vial-liquid');
    if (liq) liq.setAttribute('visibility', v === 0 ? 'hidden' : 'visible');
    svg.setAttribute('aria-label', 'Flacon, ' + Math.round(v * 100) + ' % restant');
  }

  // Ossature commune des pages de l'appli : logo dans [data-ps-logo],
  // menu avatar (ouverture/fermeture), bouton de thème, sélecteur de langue.
  // À appeler une fois le DOM construit (les pages l'appellent en bas de script).
  function psInitShell() {
    // Logo Clarté injecté en SVG (couleur = currentColor → suit le thème)
    if (window.PS_LOGO) {
      document.querySelectorAll('[data-ps-logo]').forEach(function (el) {
        el.innerHTML = window.PS_LOGO.replace('<svg ', '<svg aria-hidden="true" ');
      });
    }
    // Menu avatar
    var btn = document.getElementById('avatarButton');
    var menu = document.getElementById('avatarMenu');
    if (btn && menu) {
      btn.addEventListener('click', function () {
        var open = menu.hidden;
        menu.hidden = !open;
        btn.setAttribute('aria-expanded', String(open));
      });
      document.addEventListener('click', function (e) {
        if (!menu.hidden && !menu.contains(e.target) && !btn.contains(e.target)) {
          menu.hidden = true; btn.setAttribute('aria-expanded', 'false');
        }
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !menu.hidden) { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); }
      });
    }
    // Thème clair / sombre
    var themeBtn = document.getElementById('themeToggle');
    if (themeBtn) themeBtn.addEventListener('click', function () {
      var root = document.documentElement;
      var dark = root.dataset.theme === 'dark' ||
                 (!root.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
      root.dataset.theme = dark ? 'light' : 'dark';
      try { localStorage.setItem('ps_theme', root.dataset.theme); } catch (e) {}
      if (menu) menu.hidden = true;
    });
    try {
      var t = localStorage.getItem('ps_theme');
      if (t) document.documentElement.dataset.theme = t;
    } catch (e) {}
    // Sélecteur de langue (rendu par lang.js dans #langToggleBtn)
    if (typeof window.PS_renderLangSwitcher === 'function') window.PS_renderLangSwitcher();
  }

  window.psDay = psDay;
  window.psDayStr = psDayStr;
  window.PS_isNativeApp = isNativeApp;
  window.PS_buildInjectionPlan = buildInjectionPlan;
  window.PS_scheduleReminders = scheduleReminders;
  window.PS_cancelReminders = cancelReminders;
  window.PS_icon = psIcon;
  window.PS_asset = psAsset;
  window.PS_statusIcon = psStatusIcon;
  window.PS_updateLevel = psUpdateLevel;
  window.PS_vialLevel = psVialLevel;
  window.PS_initShell = psInitShell;
})();
