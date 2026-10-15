/* ═══════════════════════════════════════════════════════════════
   ps-app.js — fonctions communes PeptideScanner
   À charger APRÈS lang.js et /assets/assets-bundle.js, sur chaque page.

   1. Dates en heure locale (BUG-11) : psDay(), psDayStr()
   2. Appli installée ou navigateur : PS_isNativeApp()
   3. Planning des cures : PS_cure() — fréquences, jours précis de la semaine
      (étiquette dow:), dates personnalisées (dates:), créneaux (times:)
   4. États des créneaux (kit Clarté) : fait, partiel, manqué, reporté, prévu, repos
      — états saisis rangés dans notes de l'injection (st:missed|st:partial|st:rest)
   5. Rappels sur le téléphone (Local Notifications), texte discret par défaut
   6. Stock : déduction / remise de la dose dans le flacon lié
   7. Interface du kit : en-tête, barre d'onglets, feuilles, fenêtres de
      confirmation, toast avec « Annuler », feuille des 6 états, icônes, dessins
   Refondu le 15/10/2026 (design Clarté à 100 %).
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  function pad(n) { return String(n).padStart(2, '0'); }
  function tr(k, fb) { var v = (typeof window.t === 'function') ? window.t(k) : null; return (v && v !== k) ? v : (fb || k); }
  function lang() { return (typeof window.PS_getLang === 'function') ? window.PS_getLang() : 'fr'; }
  function locale() { return lang() === 'en' ? 'en-US' : 'fr-FR'; }
  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // ── 1. Dates ────────────────────────────────────────────────────
  function psDay(v) {
    if (v instanceof Date) { var c = new Date(v.getTime()); c.setHours(0, 0, 0, 0); return c; }
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v == null ? '' : v));
    if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    var d = new Date(v); d.setHours(0, 0, 0, 0); return d;
  }
  function psDayStr(d) {
    d = d || new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function addDays(d, n) { var x = new Date(d.getTime()); x.setDate(x.getDate() + n); return x; }
  function dayIndex(start, d) { return Math.round((psDay(d) - psDay(start)) / 86400000); }
  function fmtDate(d, opts) { return psDay(d).toLocaleDateString(locale(), opts || { day: 'numeric', month: 'long' }); }
  // Horodatage local « AAAA-MM-JJTHH:MM:00 » (lu partout par comparaison de chaîne)
  function localStamp(ds, hm) {
    var t = String(hm || '').slice(0, 5);
    if (!/^\d{2}:\d{2}$/.test(t)) t = '00:00';
    return String(ds).slice(0, 10) + 'T' + t + ':00';
  }
  function nowHM() { var n = new Date(); return pad(n.getHours()) + ':' + pad(n.getMinutes()); }

  function isNativeApp() {
    var C = window.Capacitor;
    return !!(C && typeof C.isNativePlatform === 'function' && C.isNativePlatform());
  }
  function plugin(name) { var C = window.Capacitor; return C && C.Plugins ? C.Plugins[name] : null; }

  // ── Étiquettes dans les champs notes (« a:1|b:2 ») ──────────────
  function getTag(notes, key) {
    var re = new RegExp('(?:^|\\|)\\s*' + key + ':([^|]*)');
    var m = re.exec(String(notes || ''));
    return m ? m[1].trim() : null;
  }
  function setTag(notes, key, val) {
    var parts = String(notes || '').split('|').map(function (s) { return s.trim(); }).filter(Boolean)
      .filter(function (s) { return s.indexOf(key + ':') !== 0; });
    if (val !== null && val !== undefined && val !== '') parts.push(key + ':' + val);
    return parts.join('|');
  }
  function hasFlag(notes, flag) {
    return String(notes || '').split('|').some(function (s) { return s.trim() === flag; });
  }

  // ── 3. Planning d'une cure ──────────────────────────────────────
  // frequency (texte) : 1, 2, 3 = injections par jour ; 0.5 = 1 jour sur 2 ;
  // 0.28 ≈ 2×/semaine (tous les 4 jours) ; 0.14 = 1×/semaine.
  // notes : dow:1,3,5 (lundi = 1) | dates:AAAA-MM-JJ,… | times:08:00,20:00 | dev:syringe|prefilled|refillable
  function defaultTimes(n) { return n === 1 ? ['08:00'] : n === 2 ? ['08:00', '20:00'] : ['07:00', '13:00', '20:00']; }
  function cureModel(cure) {
    if (!cure) return null;
    var notes = cure.notes || '';
    var f = parseFloat(cure.frequency); if (!isFinite(f) || f <= 0) f = 1;
    var perDay = f >= 1 ? Math.max(1, Math.ceil(f)) : 1;
    var interval = f >= 1 ? 1 : Math.max(1, Math.round(1 / f));
    var dowTag = getTag(notes, 'dow'), datesTag = getTag(notes, 'dates'), timesTag = getTag(notes, 'times');
    var dow = dowTag ? dowTag.split(',').map(Number).filter(function (n) { return n >= 1 && n <= 7; }) : null;
    var dates = datesTag ? datesTag.split(',').map(function (s) { return s.trim(); }).filter(Boolean) : null;
    var times = timesTag ? timesTag.split(',').map(function (s) { return s.trim(); }).filter(function (s) { return /^\d{2}:\d{2}$/.test(s); }) : null;
    if (times && times.length) perDay = times.length; else times = defaultTimes(perDay);
    var start = psDay(cure.start_date || new Date());
    var duration = parseInt(cure.duration_days, 10) || 30;
    var end = addDays(start, duration); // exclusif
    var mode = dates ? 'dates' : dow ? 'dow' : (interval > 1 ? 'interval' : 'daily');
    var today = psDay(new Date());
    var model = {
      id: cure.id, raw: cure, name: cure.peptide_name || cure.name || '',
      start: start, end: end, duration: duration, perDay: perDay, interval: interval,
      dow: dow, dates: dates, times: times, mode: mode,
      admin: (getTag(notes, 'admin') || 'SC'), device: getTag(notes, 'dev') || 'syringe',
      inv: getTag(notes, 'inv'), label: getTag(notes, 'label') || '',
      dose: cure.dose_mcg, unit: cure.unit || 'mg',
      doseLabel: cure.dose_mcg ? (String(cure.dose_mcg).replace('.', lang() === 'en' ? '.' : ',') + ' ' + (cure.unit || 'mg')) : '',
      state: end <= today ? 'ended' : (start > today ? 'future' : 'active'),
      inCure: function (d) { var x = psDay(d); return x >= start && x < end; },
      isScheduled: function (d) {
        var x = psDay(d);
        if (x < start || x >= end) return false;
        if (dates) return dates.indexOf(psDayStr(x)) >= 0;
        if (dow) { var w = x.getDay() || 7; return dow.indexOf(w) >= 0; }
        return dayIndex(start, x) % interval === 0;
      }
    };
    model.dayNumber = function (d) { return dayIndex(start, d) + 1; };
    model.freqLabel = function () {
      if (dates) return tr('freq_custom_dates', 'Dates personnalisées');
      var per = perDay > 1 ? perDay + '× / ' + tr('freq_day_short', 'jour') : '';
      if (dow) {
        var names = (window.PS_LANG && window.PS_LANG[lang()] && window.PS_LANG[lang()].days_short) || ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
        return dow.slice().sort().map(function (n) { return names[n - 1]; }).join(' ') + (per ? ' · ' + per : '');
      }
      if (interval === 1) return perDay + '× / ' + tr('freq_day_short', 'jour');
      if (interval === 2) return tr('freq_1_2d', '1× tous les 2 jours');
      if (interval === 7) return tr('freq_1x_w', '1× par semaine');
      if (interval === 4) return tr('freq_2x_w', '2× par semaine');
      return '1× / ' + interval + ' ' + tr('days', 'jours');
    };
    return model;
  }

  // ── 4. Injections et états ──────────────────────────────────────
  function injDay(inj) { return String((inj && inj.injected_at) || '').slice(0, 10); }
  function injTime(inj) { return String((inj && inj.injected_at) || '').slice(11, 16); }
  function injSlot(inj) { var s = getTag(inj && inj.notes, 'slot'); var n = parseInt(s, 10); return isFinite(n) ? n : 0; }
  // États saisis : done (par défaut), partial, missed, rest, postponed (report vers to:AAAA-MM-JJ HH:MM)
  function injStatus(inj) {
    var st = getTag(inj && inj.notes, 'st');
    return (st === 'missed' || st === 'partial' || st === 'rest' || st === 'postponed') ? st : 'done';
  }
  function postponedTo(inj) {
    var v = getTag(inj && inj.notes, 'to'); if (!v) return null;
    var m = /^(\d{4}-\d{2}-\d{2})(?:[ T](\d{2}:\d{2}))?/.exec(v);
    return m ? { ds: m[1], time: m[2] || '' } : null;
  }
  function isTaken(inj) { var s = injStatus(inj); return s === 'done' || s === 'partial'; }
  function readReport(inj) { var r = getTag(inj && inj.notes, 'report'); return /^\d{4}-\d{2}-\d{2}$/.test(r || '') ? r : null; }

  // Liens de report décidés par l'utilisateur : « cette injection couvre le jour prévu X »
  function reportMap(model, injs) {
    var toDs = {}, fromDs = {};
    (injs || []).forEach(function (inj) {
      var target = readReport(inj); if (!target) return;
      var at = injDay(inj); if (!at || at === target || toDs[target]) return;
      toDs[target] = { ds: at, time: injTime(inj), inj: inj }; fromDs[at] = target;
    });
    return { toDs: toDs, fromDs: fromDs };
  }

  // États des créneaux d'un jour pour une cure.
  // Renvoie null hors cure ; [] = repos planifié ; sinon un tableau d'objets
  // { slot, time, status, inj, auto } — auto = vrai si l'état n'a pas été saisi
  // (créneau passé non renseigné → « manqué » par règle explicite, modifiable).
  function slotStates(model, injs, ds, rep) {
    if (!model) return null;
    var day = psDay(ds); if (!model.inCure(day)) {
      var extraOut = (injs || []).filter(function (i) { return injDay(i) === ds && i.cure_id === model.id; });
      return extraOut.length ? extraOut.map(function (i) { return { slot: injSlot(i), time: injTime(i), status: injStatus(i), inj: i, auto: false, off: true }; }) : null;
    }
    var todayStr = psDayStr();
    var dayInjs = (injs || []).filter(function (i) { return i.cure_id === model.id && injDay(i) === ds; });
    rep = rep || reportMap(model, injs);
    var out = [];
    if (!model.isScheduled(day)) {
      // Jour de repos : on montre quand même une injection décalée enregistrée ce jour-là
      dayInjs.forEach(function (i) { out.push({ slot: injSlot(i), time: injTime(i), status: injStatus(i), inj: i, auto: false, off: true }); });
      appendIncoming(model, injs, ds, out);
      return out;
    }
    var used = {};
    for (var s = 0; s < model.perDay; s++) {
      var rec = null;
      for (var k = 0; k < dayInjs.length; k++) {
        if (used[dayInjs[k].id]) continue;
        var rr = readReport(dayInjs[k]); if (rr && rr !== ds) continue;   // couvre un autre jour (report)
        if (injSlot(dayInjs[k]) === s || (model.perDay === 1)) { rec = dayInjs[k]; break; }
      }
      if (rec) { used[rec.id] = 1; out.push({ slot: s, time: injTime(rec) || model.times[s], status: injStatus(rec), inj: rec, auto: false }); continue; }
      if (rep.toDs[ds] && s === 0) { out.push({ slot: s, time: model.times[s], status: 'postponed', inj: null, auto: false, to: rep.toDs[ds] }); continue; }
      out.push({ slot: s, time: model.times[s], status: ds < todayStr ? 'missed' : 'planned', inj: null, auto: true });
    }
    // Injections supplémentaires (hors créneau) gardées visibles
    dayInjs.forEach(function (i) { if (!used[i.id]) out.push({ slot: injSlot(i), time: injTime(i), status: injStatus(i), inj: i, auto: false, extra: true, from: readReport(i) }); });
    appendIncoming(model, injs, ds, out);
    return out;
  }
  // Créneaux reportés VERS ce jour (st:postponed + to:) : affichés « prévu » tant qu'aucune
  // injection n'a été enregistrée avec report:<jour d'origine>.
  function appendIncoming(model, injs, ds, out) {
    (injs || []).forEach(function (i) {
      if (i.cure_id !== model.id || injStatus(i) !== 'postponed') return;
      var to = postponedTo(i); if (!to || to.ds !== ds) return;
      var origin = injDay(i), slot = injSlot(i);
      var covered = (injs || []).some(function (x) { return x.cure_id === model.id && readReport(x) === origin && injSlot(x) === slot && injStatus(x) !== 'postponed'; });
      if (covered) return;
      out.push({ slot: slot, time: to.time || injTime(i), status: ds < psDayStr() ? 'missed' : 'planned', inj: null, auto: true, incoming: true, from: origin, source: i });
    });
  }
  // Codes d'un jour pour le calendrier : au plus 2 symboles + compteur
  function dayCodes(states) {
    if (states === null) return null;
    if (!states.length) return ['rest'];
    var seen = []; states.forEach(function (s) { if (seen.indexOf(s.status) < 0) seen.push(s.status); });
    return seen;
  }
  // Statistiques d'une cure jusqu'à aujourd'hui (inclus) — jours de repos exclus.
  function cureStats(model, injs) {
    var r = { done: 0, partial: 0, missed: 0, postponed: 0, notRecorded: 0, planned: 0, restDays: 0, slotsElapsed: 0, recorded: 0, totalSlots: 0 };
    if (!model) return r;
    var rep = reportMap(model, injs), today = psDay(new Date());
    for (var d = new Date(model.start); d < model.end; d = addDays(d, 1)) {
      var ds = psDayStr(d);
      if (!model.isScheduled(d)) { if (d <= today) r.restDays++; continue; }
      r.totalSlots += model.perDay;
      if (d > today) { r.planned += model.perDay; continue; }
      var st = slotStates(model, injs, ds, rep) || [];
      st.forEach(function (s) {
        if (s.extra || s.incoming) return;
        r.slotsElapsed++;
        if (s.status === 'planned') { r.planned++; r.slotsElapsed--; return; }
        if (s.auto) { r.notRecorded++; r.missed++; return; }
        r[s.status] = (r[s.status] || 0) + 1; r.recorded++;
      });
    }
    r.recordedPct = r.slotsElapsed ? Math.round(r.recorded / r.slotsElapsed * 100) : 0;
    return r;
  }

  // ── 5. Rappels ─────────────────────────────────────────────────
  // remindersMap = réglages de la page Rappels (localStorage 'ps_reminders_<userId>')
  function buildInjectionPlan(cures, injections, remindersMap, days) {
    days = days || 7;
    var out = [], now = new Date(), today = psDay(now);
    var discreet = true; try { discreet = localStorage.getItem('ps_notif_discreet') !== '0'; } catch (e) {}
    (cures || []).forEach(function (cure) {
      if (!cure || cure.status !== 'active' || !cure.start_date) return;
      var m = cureModel(cure);
      var saved = (remindersMap || {})[cure.id];
      if (saved && saved.enabled === false) return;
      var times = (saved && saved.times && saved.times.length) ? saved.times : m.times;
      for (var k = 0; k < days; k++) {
        var day = addDays(today, k);
        if (!m.isScheduled(day)) continue;
        var ds = psDayStr(day);
        times.forEach(function (hm, i) {
          var p = String(hm).split(':');
          var at = new Date(day.getTime()); at.setHours(Number(p[0]) || 0, Number(p[1]) || 0, 0, 0);
          if (at <= now) return;
          var taken = (injections || []).some(function (inj) {
            return inj.cure_id === cure.id && injDay(inj) === ds && (m.perDay === 1 || injSlot(inj) === i);
          });   // tout créneau déjà renseigné (fait, partiel, manqué, repos, reporté) ne sonne plus
          if (taken) return;
          out.push({
            cureId: cure.id, at: at,
            title: discreet ? 'PeptideScanner' : (m.name || 'Injection'),
            body: discreet ? tr('notif_discreet', 'Vous avez un rappel de suivi.') : ((m.doseLabel ? m.doseLabel + ' · ' : '') + hm)
          });
        });
      }
    });
    out.sort(function (a, b) { return a.at - b.at; });
    return out;
  }
  async function scheduleReminders(items, ask) {
    if (!isNativeApp()) return false;
    var LN = plugin('LocalNotifications'); if (!LN) return false;
    try {
      var perm = await LN.checkPermissions();
      if (perm.display !== 'granted' && ask) perm = await LN.requestPermissions();
      if (perm.display !== 'granted') return false;
      var pending = await LN.getPending();
      var old = (pending.notifications || []).filter(function (n) { return n.extra && n.extra.ps === 1; }).map(function (n) { return { id: n.id }; });
      if (old.length) await LN.cancel({ notifications: old });
      if (!items || !items.length) return true;
      // iOS garde au plus 64 notifications en attente : 60 au maximum
      await LN.schedule({ notifications: items.slice(0, 60).map(function (it, i) {
        return { id: 7000 + i, title: it.title, body: it.body, schedule: { at: it.at, allowWhileIdle: true }, extra: { ps: 1, cureId: it.cureId } };
      }) });
      return true;
    } catch (e) { console.warn('[ps-app] rappels :', e); return false; }
  }
  async function permissionState() {
    if (!isNativeApp()) return (typeof Notification !== 'undefined') ? Notification.permission : 'unavailable';
    var LN = plugin('LocalNotifications'); if (!LN) return 'unavailable';
    try { var p = await LN.checkPermissions(); return p.display; } catch (e) { return 'unavailable'; }
  }
  async function cancelReminders() {
    if (!isNativeApp()) return;
    var LN = plugin('LocalNotifications'); if (!LN) return;
    try {
      var pending = await LN.getPending();
      var old = (pending.notifications || []).filter(function (n) { return n.extra && n.extra.ps === 1; }).map(function (n) { return { id: n.id }; });
      if (old.length) await LN.cancel({ notifications: old });
    } catch (e) { console.warn('[ps-app] annulation rappels :', e); }
  }
  // Reprogramme les rappels si l'utilisateur les a activés (appelé après chaque saisie)
  function refreshReminders(cures, injs, userId) {
    try {
      if (!isNativeApp() || localStorage.getItem('ps_notif_choice') !== 'on') return;
      var rem = {}; try { rem = JSON.parse(localStorage.getItem('ps_reminders_' + userId) || '{}'); } catch (e) {}
      scheduleReminders(buildInjectionPlan(cures, injs, rem, 7), false);
    } catch (e) {}
  }

  // ── 6. Stock : dose déduite du flacon lié (inv:UUID) ou du même nom ─
  async function updateStock(sb, userId, cure, direction, qtyMg) {
    if (!sb || !cure) return;
    var m = cureModel(cure), flaconId = m.inv;
    if (!flaconId) {
      var pn = (m.name || '').toLowerCase(); if (!pn) return;
      var r = await sb.from('inventory').select('id, peptide_name, notes').eq('user_id', userId).order('created_at', { ascending: false });
      var match = (r.data || []).find(function (f) {
        var fn = (f.peptide_name || '').toLowerCase();
        return (fn === pn || fn.indexOf(pn) >= 0 || pn.indexOf(fn) >= 0) && !hasFlag(f.notes, 'finished') && !/^pen/.test(getTag(f.notes, 'type') || '');
      });
      if (match) flaconId = match.id;
    }
    if (!flaconId) return;
    var fr = await sb.from('inventory').select('id, remaining_units, vial_qty_mg, notes, reconstituted_at').eq('id', flaconId).single();
    var flacon = fr.data; if (!flacon) return;
    var doseMg = (qtyMg !== undefined && qtyMg !== null) ? Number(qtyMg) : (parseFloat(cure.dose_mcg) || 0);
    if ((qtyMg === undefined || qtyMg === null) && String(cure.unit || 'mg').toLowerCase() === 'mcg') doseMg = doseMg / 1000;
    var remain = parseFloat(flacon.remaining_units != null ? flacon.remaining_units : (flacon.vial_qty_mg || 0));
    remain = Math.max(0, remain + direction * doseMg);
    var notes = flacon.notes || '';
    if (direction === -1 && hasFlag(notes, 'sealed')) notes = notes.replace('sealed', 'active');
    await sb.from('inventory').update({
      remaining_units: Math.round(remain * 1000) / 1000,
      notes: direction === -1 ? notes : flacon.notes,
      reconstituted_at: (direction === -1 && !flacon.reconstituted_at) ? psDayStr() : flacon.reconstituted_at
    }).eq('id', flaconId);
  }

  // ── 7. Interface du kit ─────────────────────────────────────────
  var serial = 0;
  function psIcon(name, cl) {
    var icons = window.PS_ICONS || {};
    var s = icons[name] || icons['information-circle'] || '';
    return s ? s.replace('<svg ', '<svg aria-hidden="true" class="icon ' + (cl || '') + '" ') : '';
  }
  function psAsset(name, cl) {
    var assets = window.PS_ASSETS || {};
    var s = assets[name] || ''; if (!s) return '';
    var id = 'a' + (++serial) + '-';
    if (lang() === 'en') s = assetEN(s);
    s = s.replace(/id="([^"]+)"/g, function (_, v) { return 'id="' + id + v + '" data-part="' + v + '"'; })
         .replace(/url\(#([^\)]+)\)/g, function (_, v) { return 'url(#' + id + v + ')'; });
    return s.replace('<svg ', '<svg class="' + (cl || 'equipment') + '" ');
  }
  // Textes intégrés aux dessins du kit (titres, légendes) : version anglaise
  var ASSET_EN = [
    ['Cartouche de stylo, capacité 3 ml', 'Pen cartridge, 3 ml capacity'], ['Cartouche · capacité 3 ml', 'Cartridge · 3 ml capacity'],
    ['Flacon et repère au frais', 'Vial with cold-storage marker'], ['Flacon non reconstitué : poudre', 'Vial not reconstituted: powder'],
    ['Flacon presque vide', 'Vial almost empty'], ['Flacon reconstitué, plein', 'Reconstituted vial, full'], ['Flacon vide', 'Empty vial'],
    ['Flacon à moitié plein', 'Vial half full'], ['Stylo prérempli générique, dose non renseignée', 'Generic prefilled pen, dose not entered'],
    ['Stylo rechargeable générique', 'Generic refillable pen'], ['unités, graduation tous les', 'units, marking every'],
    ['Seringue', 'Syringe'], ['0,3 ml · pas 0,5 U', '0.3 ml · step 0.5 U'], ['0,5 ml · pas 1 U', '0.5 ml · step 1 U'], ['1,0 ml · pas 2 U', '1.0 ml · step 2 U']
  ];
  function assetEN(s) { ASSET_EN.forEach(function (p) { s = s.split(p[0]).join(p[1]); }); return s; }

  // Les 6 formes d'état du kit — reconnaissables sans la couleur
  var SHAPES = {
    done: '<circle cx="12" cy="12" r="9" fill="currentColor"/><path d="m8 12 3 3 5-6" stroke="var(--surface)" stroke-width="2" fill="none"/>',
    partial: '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.7" fill="none"/><path d="M12 3a9 9 0 0 0 0 18Z" fill="currentColor"/>',
    missed: '<rect x="3" y="3" width="18" height="18" rx="4" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M8 12h8" stroke="currentColor" stroke-width="2"/>',
    postponed: '<path d="m12 2 10 10-10 10L2 12Z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8 16v-5h8m-3-3 3 3-3 3" fill="none" stroke="currentColor" stroke-width="1.5"/>',
    planned: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.7"/>',
    rest: '<rect x="2" y="5" width="20" height="14" rx="7" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M9 9v6m6-6v6" stroke="currentColor" stroke-width="2"/>'
  };
  var STATUS_ORDER = ['done', 'partial', 'missed', 'postponed', 'planned', 'rest'];
  function statusLabel(code) {
    var fb = { done: 'Fait', partial: 'Partiel', missed: 'Manqué', postponed: 'Reporté', planned: 'Prévu', rest: 'Repos' };
    return tr('st_' + code, fb[code] || code);
  }
  function psStatus(code, withLabel) {
    code = SHAPES[code] ? code : 'planned';
    return '<span class="status" data-status="' + code + '"><svg class="status-icon" viewBox="0 0 24 24" aria-hidden="true">' +
      SHAPES[code] + '</svg>' + (withLabel === false ? '' : esc(withLabel === undefined || withLabel === true ? statusLabel(code) : withLabel)) + '</span>';
  }
  function legend() {
    return '<div class="legend">' + STATUS_ORDER.map(function (k) { return psStatus(k); }).join('') + '</div>';
  }
  function updateLevel(svg, type, ml, units, label) {
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
    var mk = part(type + '-level-marker'); if (mk) mk.setAttribute('visibility', 'visible');
    var lab = part(type + '-level-label');
    if (lab) { lab.setAttribute('x', Math.max(80, Math.min(type === 'syringe' ? 300 : 280, x))); lab.textContent = label; }
    svg.setAttribute('aria-label', label);
  }
  function vialLevel(svg, fraction) {
    if (!svg) return;
    function part(n) { return svg.querySelector('[data-part="' + n + '"]'); }
    var v = Math.max(0, Math.min(1, Number(fraction) || 0)), y = 178 - v * 106;
    var fill = part('vial-liquid-fill'); if (fill) { fill.setAttribute('y', y); fill.setAttribute('height', 178 - y); }
    var men = part('vial-meniscus'); if (men) men.setAttribute('d', 'M42 ' + y + 'Q70 ' + (y + 6) + ' 98 ' + y);
    var liq = part('vial-liquid'); if (liq) liq.setAttribute('visibility', v === 0 ? 'hidden' : 'visible');
    svg.setAttribute('aria-label', tr('vial_level_aria', 'Flacon') + ' ' + Math.round(v * 100) + ' %');
  }
  // Flacon dessiné au bon niveau (renvoie le HTML ; le niveau est posé à l'insertion)
  function vialHtml(fraction, sealed, cl) {
    var html = psAsset(sealed ? 'vial-powder' : 'vial-full', cl || 'equipment');
    if (sealed) return html;
    var holder = document.createElement('div'); holder.innerHTML = html;
    vialLevel(holder.querySelector('svg'), fraction);
    return holder.innerHTML;
  }

  // Bloc « état vide » du kit
  function emptyState(title, text, icon, ctaLabel, ctaHref, ctaAction) {
    var cta = '';
    if (ctaLabel) cta = ctaHref ? '<a class="btn full" href="' + esc(ctaHref) + '">' + esc(ctaLabel) + '</a>'
                                : '<button class="btn full" type="button" data-ps-action="' + esc(ctaAction || '') + '">' + esc(ctaLabel) + '</button>';
    return '<div class="empty"><div class="empty-icon">' + psIcon(icon || 'information-circle') + '</div><h2>' + esc(title) + '</h2>' +
      (text ? '<p class="muted small">' + esc(text) + '</p>' : '') + cta + '</div>';
  }
  function notice(text, kind, raw) {
    return '<div class="notice ' + (kind || '') + '"' + (kind === 'error' ? ' role="alert"' : '') + '>' +
      psIcon(kind === 'error' ? 'exclamation-circle' : 'information-circle') + '<div>' + (raw ? text : esc(text)) + '</div></div>';
  }
  function skeleton() {
    return '<div aria-busy="true" class="stack"><section class="card"><div class="stack"><div class="skeleton short"></div><div class="skeleton tall"></div><div class="skeleton"></div></div></section>' +
      '<section class="card"><div class="stack"><div class="skeleton short"></div><div class="skeleton"></div></div></section></div>' +
      '<p role="status" class="small muted">' + esc(tr('loading_carnet', 'Chargement de votre carnet…')) + '</p>';
  }
  function errorState(retryFn) {
    var id = 'retry' + (++serial);
    setTimeout(function () { var b = document.getElementById(id); if (b) b.onclick = retryFn || function () { location.reload(); }; }, 0);
    return notice(tr('err_load', 'Impossible de charger ces informations. Vos saisies déjà enregistrées ne sont pas modifiées.'), 'error') +
      '<section class="card">' + emptyState(tr('err_retry_title', 'Réessayez dans un instant'), tr('err_retry_text', 'Si le problème persiste, contactez l’assistance depuis votre profil.'), 'arrow-path') + '</section>' +
      '<button class="btn full" id="' + id + '" type="button">' + esc(tr('retry', 'Réessayer')) + '</button>';
  }

  // Toast du kit (sans focus) — avec « Annuler » il reste jusqu'à l'action
  var toastTimer;
  function toast(message, undo) {
    var t = document.getElementById('psToast');
    if (!t) {
      t = document.createElement('div'); t.id = 'psToast'; t.className = 'toast';
      t.setAttribute('role', 'status'); t.setAttribute('aria-live', 'polite'); t.hidden = true;
      document.body.appendChild(t);
    }
    clearTimeout(toastTimer);
    t.innerHTML = '<span class="grow">' + esc(message) + '</span>' + (undo
      ? '<button type="button" data-t="undo">' + esc(tr('undo', 'Annuler')) + '</button>'
      : '<button type="button" data-t="close" aria-label="' + esc(tr('close', 'Fermer')) + '">' + psIcon('x-mark') + '</button>');
    t.hidden = false;
    t.querySelector('button').onclick = function () {
      t.hidden = true;
      if (undo) { Promise.resolve(undo()).then(function () { toast(tr('change_undone', 'Modification annulée.')); }); }
    };
    toastTimer = setTimeout(function () { t.hidden = true; }, undo ? 10000 : 6000);
  }

  // Feuille montante du kit (<dialog class="sheet">)
  function getDialog(id, cls) {
    var d = document.getElementById(id);
    if (!d) {
      d = document.createElement('dialog'); d.id = id; if (cls) d.className = cls;
      d.setAttribute('aria-labelledby', id + '-title');
      document.body.appendChild(d);
      d.addEventListener('click', function (e) { if (e.target === d) d.close('backdrop'); });
    }
    return d;
  }
  function openSheet(title, bodyHtml, onReady) {
    var d = getDialog('psSheet', 'sheet');
    d.innerHTML = '<div class="sheet-handle" aria-hidden="true"></div><div class="row between"><h2 id="psSheet-title">' + esc(title) +
      '</h2><button class="icon-btn" type="button" data-close aria-label="' + esc(tr('close', 'Fermer')) + '">' + psIcon('x-mark') + '</button></div>' +
      '<div class="stack" style="margin-top:18px">' + bodyHtml + '</div>';
    d.querySelectorAll('[data-close]').forEach(function (b) { b.onclick = function () { d.close('cancel'); }; });
    if (!d.open) d.showModal();
    if (onReady) onReady(d);
    return d;
  }
  function closeSheet() { var d = document.getElementById('psSheet'); if (d && d.open) d.close('done'); }

  // Fenêtre de confirmation du kit → Promise<boolean>
  function confirmBox(opts) {
    opts = opts || {};
    return new Promise(function (resolve) {
      var d = getDialog('psConfirm', '');
      d.innerHTML = '<div class="stack"><h2 id="psConfirm-title">' + esc(opts.title || '') + '</h2>' +
        (opts.text ? '<p class="small muted">' + esc(opts.text) + '</p>' : '') +
        '<button class="btn secondary full" type="button" data-r="0">' + esc(opts.cancel || tr('cancel', 'Annuler')) + '</button>' +
        '<button class="btn ' + (opts.danger ? 'danger' : '') + ' full" type="button" data-r="1">' + esc(opts.ok || tr('confirm', 'Confirmer')) + '</button></div>';
      var done = false;
      d.querySelectorAll('[data-r]').forEach(function (b) { b.onclick = function () { done = true; d.close(); resolve(b.dataset.r === '1'); }; });
      d.onclose = function () { if (!done) resolve(false); };
      d.showModal();
    });
  }

  // Feuille « Renseigner le créneau » : les 6 états du kit → Promise<{status, date, time, qty}|null>
  function statusSheet(opts) {
    opts = opts || {};
    var allow = opts.allow || ['done', 'partial', 'missed', 'postponed', 'rest'];
    return new Promise(function (resolve) {
      var settled = false;
      function finish(v) { if (settled) return; settled = true; closeSheet(); resolve(v); }
      var body = (opts.sub ? '<p class="muted small">' + esc(opts.sub) + '</p>' : '') +
        allow.map(function (k) { return '<button class="btn secondary full row-btn" type="button" data-st="' + k + '">' + psStatus(k) + '</button>'; }).join('') +
        (opts.canClear ? '<button class="btn ghost full" type="button" data-st="clear">' + esc(tr('st_clear', 'Effacer l’enregistrement')) + '</button>' : '');
      var d = openSheet(opts.title || tr('st_sheet_title', 'Renseigner le créneau'), body, function (dlg) {
        dlg.onclose = function () { if (!settled) { settled = true; resolve(null); } };
        dlg.querySelectorAll('[data-st]').forEach(function (b) {
          b.onclick = function () {
            var st = b.dataset.st;
            if (st === 'postponed') {
              var tomorrow = psDayStr(addDays(psDay(opts.date || new Date()), 1));
              openSheet(tr('st_postpone_title', 'Reporter le créneau'),
                '<p class="small muted">' + esc(tr('msg_postpone', 'Choisissez une nouvelle date et une heure.')) + '</p>' +
                field(tr('new_date', 'Nouvelle date'), 'psPDate', '', 'date', tomorrow) +
                field(tr('new_time', 'Nouvelle heure'), 'psPTime', '', 'time', opts.time || '08:00') +
                '<button class="btn full" type="button" id="psPOk">' + esc(tr('st_postpone_ok', 'Enregistrer le report')) + '</button>',
                function (d2) {
                  d2.onclose = function () { if (!settled) { settled = true; resolve(null); } };
                  d2.querySelector('#psPOk').onclick = function () {
                    var dd = d2.querySelector('#psPDate').value, tt = d2.querySelector('#psPTime').value;
                    if (!dd || !tt) { d2.querySelector('#psPDate').setAttribute('aria-invalid', 'true'); return; }
                    finish({ status: 'postponed', date: dd, time: tt });
                  };
                });
              return;
            }
            if (st === 'partial') {
              openSheet(tr('st_partial_title', 'Enregistrement partiel'),
                field(tr('st_partial_qty', 'Quantité réellement saisie, facultative'), 'psQty', 'mg', 'text', '', tr('no_value_suggested', 'Aucune valeur n’est suggérée.'), 'placeholder="—" inputmode="decimal"') +
                '<button class="btn full" type="button" id="psQOk">' + esc(tr('st_partial_ok', 'Enregistrer comme partiel')) + '</button>',
                function (d2) {
                  d2.onclose = function () { if (!settled) { settled = true; resolve(null); } };
                  d2.querySelector('#psQOk').onclick = function () {
                    var v = String(d2.querySelector('#psQty').value || '').trim().replace(',', '.');
                    if (v && !(Number(v) > 0)) { d2.querySelector('#psQty').setAttribute('aria-invalid', 'true'); return; }
                    finish({ status: 'partial', qty: v ? Number(v) : null });
                  };
                });
              return;
            }
            finish({ status: st });
          };
        });
      });
    });
  }

  // Champ du kit (label + unité + aide)
  function field(label, id, unit, type, value, hint, attrs) {
    return '<div class="field"><label class="label" for="' + id + '">' + esc(label) + '</label><div class="input-wrap">' +
      '<input class="input" id="' + id + '" name="' + id + '" type="' + (type || 'text') + '" value="' + esc(value || '') + '" ' +
      (unit ? 'inputmode="decimal" ' : '') + (hint ? 'aria-describedby="' + id + '-help" ' : '') + (attrs || '') + '>' +
      (unit ? '<span class="input-unit">' + esc(unit) + '</span>' : '') + '</div>' +
      (hint ? '<p class="help" id="' + id + '-help">' + esc(hint) + '</p>' : '') + '</div>';
  }
  function select(label, id, opts, value, attrs) {
    return '<div class="field"><label class="label" for="' + id + '">' + esc(label) + '</label><select class="select" id="' + id + '" ' + (attrs || '') + '>' +
      opts.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(value) ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select></div>';
  }
  function progress(p, label) {
    p = Math.max(0, Math.min(100, Math.round(p)));
    return '<div class="progress" role="progressbar" aria-label="' + esc(label || '') + '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + p + '"><span style="width:' + p + '%"></span></div>';
  }

  // En-tête + barre d'onglets du kit, rendus depuis les attributs du <body> :
  //   data-tab="home|cure|inventory|weight|library"  data-back="page.html"  data-title="clé lang"
  var TABS = [['home', 'dashboard.html', 'home', 'nav_home', 'Accueil'], ['cure', 'cure.html', 'calendar-days', 'nav_cure', 'Cure'],
    ['inventory', 'inventaire.html', 'archive-box', 'nav_materiel', 'Matériel'], ['weight', 'poids.html', 'chart-bar', 'nav_suivi', 'Suivi'],
    ['library', 'peptide-database.html', 'book-open', 'nav_savoir', 'Savoir']];
  function renderShell() {
    var b = document.body;
    var head = document.getElementById('psHeader');
    if (head) {
      var back = b.dataset.back, title = b.dataset.title;
      var logo = (window.PS_LOGO || '').replace('<svg ', '<svg class="brand-logo" aria-hidden="true" ');
      head.className = 'header';
      head.innerHTML =
        (back ? '<a class="icon-btn back" href="' + esc(back) + '" aria-label="' + esc(tr('back', 'Retour')) + '">' + psIcon('chevron-left') + '</a>' : '') +
        (title ? '<h1 class="grow">' + esc(tr(title, title)) + '</h1>'
               : '<a class="brand grow" href="dashboard.html" aria-label="PeptideScanner">' + logo + '<span>PeptideScanner</span></a>') +
        (b.dataset.noProfile === '1' ? '' : '<a class="icon-btn" href="profil.html" aria-label="' + esc(tr('nav_profile', 'Profil')) + '">' + psIcon('user-circle') + '</a>');
    }
    var nav = document.getElementById('psTabbar');
    if (nav) {
      var active = b.dataset.tab;
      nav.className = 'tabbar'; nav.setAttribute('aria-label', tr('nav_main', 'Navigation principale'));
      nav.innerHTML = TABS.map(function (x) {
        return '<a class="tab-item" href="' + x[1] + '"' + (x[0] === active ? ' aria-current="page"' : '') + '>' + psIcon(x[2]) +
          '<span>' + esc(tr(x[3], x[4])) + '</span></a>';
      }).join('');
    } else { b.classList.add('no-tabs'); }
    document.querySelectorAll('[data-ps-logo]').forEach(function (el) { el.innerHTML = (window.PS_LOGO || '').replace('<svg ', '<svg aria-hidden="true" '); });
    document.querySelectorAll('[data-ps-i]').forEach(function (el) { el.innerHTML = psIcon(el.dataset.psI, el.dataset.psCl || ''); });
    // Texte agrandi par le téléphone → mode agenda et grilles empilées (kit)
    try { if (parseFloat(getComputedStyle(document.documentElement).fontSize) >= 20) b.classList.add('large-text'); } catch (e) {}
  }
  // Thème : 'light' | 'dark' | 'system' (localStorage ps_theme)
  function applyTheme(v) {
    var root = document.documentElement;
    if (v === 'light' || v === 'dark') root.dataset.theme = v; else root.removeAttribute('data-theme');
    try { localStorage.setItem('ps_theme', v || 'system'); } catch (e) {}
  }
  function initShell() {
    renderShell();
    if (typeof window.PS_renderLangSwitcher === 'function') window.PS_renderLangSwitcher();
  }

  // Session : renvoie la session, sinon redirige. Vérifie l'avertissement (v1) et le parcours d'arrivée.
  async function requireSession(sb, opts) {
    opts = opts || {};
    var r = await sb.auth.getSession();
    var session = r && r.data && r.data.session;
    if (!session) { location.href = '/login.html'; return null; }
    var meta = session.user.user_metadata || {};
    if (opts.disclaimer !== false && (!meta.disclaimer_accepted_at || Number(meta.disclaimer_version) < 1)) { location.replace('/avertissement.html'); return null; }
    if (opts.onboarding && !meta.onboarding_done) { location.replace('/onboarding.html'); return null; }
    return session;
  }
  async function logout(sb) { try { await sb.auth.signOut(); } catch (e) {} location.href = '/login.html'; }

  // Saisie décimale (virgule ou point) → nombre ou NaN
  function num(v) { var s = String(v == null ? '' : v).trim().replace(',', '.'); return s === '' ? NaN : Number(s); }
  function fmtNum(n, d) {
    if (n === null || n === undefined || !isFinite(n)) return '—';
    return Number(n).toLocaleString(locale(), { maximumFractionDigits: d === undefined ? 2 : d });
  }

  // Exports
  window.psDay = psDay; window.psDayStr = psDayStr;
  window.PS_isNativeApp = isNativeApp;
  window.PS_buildInjectionPlan = buildInjectionPlan; window.PS_scheduleReminders = scheduleReminders;
  window.PS_cancelReminders = cancelReminders; window.PS_permissionState = permissionState; window.PS_refreshReminders = refreshReminders;
  window.PS_icon = psIcon; window.PS_asset = psAsset; window.PS_statusIcon = psStatus; window.PS_status = psStatus;
  window.PS_statusLabel = statusLabel; window.PS_legend = legend; window.PS_STATUS_ORDER = STATUS_ORDER;
  window.PS_updateLevel = updateLevel; window.PS_vialLevel = vialLevel; window.PS_vialHtml = vialHtml;
  window.PS_initShell = initShell; window.PS_applyTheme = applyTheme;
  window.PS = {
    esc: esc, tr: tr, lang: lang, locale: locale, pad: pad, addDays: addDays, dayIndex: dayIndex, fmtDate: fmtDate,
    localStamp: localStamp, nowHM: nowHM, getTag: getTag, setTag: setTag, hasFlag: hasFlag,
    cure: cureModel, defaultTimes: defaultTimes, injDay: injDay, injTime: injTime, injSlot: injSlot, injStatus: injStatus,
    isTaken: isTaken, readReport: readReport, postponedTo: postponedTo, reportMap: reportMap, slotStates: slotStates, dayCodes: dayCodes, cureStats: cureStats,
    updateStock: updateStock, refreshReminders: refreshReminders,
    icon: psIcon, asset: psAsset, status: psStatus, statusLabel: statusLabel, legend: legend, vialHtml: vialHtml,
    empty: emptyState, notice: notice, skeleton: skeleton, errorState: errorState,
    toast: toast, openSheet: openSheet, closeSheet: closeSheet, confirm: confirmBox, statusSheet: statusSheet,
    field: field, select: select, progress: progress, requireSession: requireSession, logout: logout,
    applyTheme: applyTheme, num: num, fmtNum: fmtNum
  };
})();
