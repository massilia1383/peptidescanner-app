/* ═══════════════════════════════════════════════════════════════
   ps-calc.js — moteur de conversion du calculateur (kit Clarté, 15/10/2026)
   Repris du kit (calculator.js) : arithmétique décimale EXACTE en fractions
   BigInt, aucune dose proposée, aucun arrondi à la graduation.
   Seul ajout : les messages d'erreur passent par t() (lang.js) en FR/EN.
   ═══════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';
  function tr(key, fallback) {
    var v = (typeof root.t === 'function') ? root.t(key) : null;
    return (v && v !== key) ? v : fallback;
  }
  const gcd = (a, b) => b ? gcd(b, a % b) : a;
  const fraction = (n, d = 1n) => {
    if (d === 0n) throw Error(tr('calc_err_div0', 'Division par zéro'));
    const g = gcd(n < 0n ? -n : n, d < 0n ? -d : d);
    return { n: n / g, d: d / g };
  };

  function parse(value, label = 'Valeur') {
    const s = String(value ?? '').trim().replace(',', '.');
    if (!/^\d{1,9}(\.\d{1,6})?$/.test(s)) throw Error(label + ' : ' + tr('calc_err_format', 'saisissez un nombre positif, avec au plus 6 décimales.'));
    const [a, b = ''] = s.split('.');
    const q = fraction(BigInt(a + b), 10n ** BigInt(b.length));
    if (q.n <= 0n) throw Error(label + ' : ' + tr('calc_err_zero', 'la valeur doit être supérieure à zéro.'));
    return q;
  }
  const div = (a, b) => fraction(a.n * b.d, a.d * b.n);
  const mul = (a, b) => fraction(a.n * b.n, a.d * b.d);
  const gt = (a, b) => a.n * b.d > b.n * a.d;
  const toNumber = x => Number(x.n) / Number(x.d);

  // Affichage : jusqu'à 6 décimales, « ≈ » si arrondi d'affichage, jamais « 0 » pour un petit positif
  function display(q, places = 6) {
    const scale = 10n ** BigInt(places);
    const scaled = q.n * scale / q.d;
    const rem = q.n * scale % q.d;
    const rounded = scaled + (rem * 2n >= q.d ? 1n : 0n);
    const dec = (rounded % scale).toString().padStart(places, '0').replace(/0+$/, '');
    let v = (rounded / scale).toString();
    const sep = (typeof root.PS_getLang === 'function' && root.PS_getLang() === 'en') ? '.' : ',';
    if (dec) v += sep + dec;
    if (rounded === 0n && q.n > 0n) return '< 0' + sep + '0'.repeat(places - 1) + '1';
    return (rem !== 0n ? '≈ ' : '') + v;
  }

  function calculate({ mass, water, dose, capacity = 50, mode = 'syringe', loadedVolume = '', confirmed = false, unitStep = '' }) {
    const m = parse(mass, tr('calc_f_mass', 'Quantité de peptide')),
          w = parse(water, tr('calc_f_water', 'Volume ajouté')),
          d = parse(dose, tr('calc_f_dose', 'Votre dose'));
    if (gt(d, m)) throw Error(tr('calc_err_dose_gt', 'La dose saisie dépasse la quantité totale du flacon. Vérifiez vos valeurs.'));
    const concentration = div(m, w),
          volume = div(d, concentration),
          units = mul(volume, fraction(100n));
    let cap, step, loaded, completeDoses = null;
    if (mode === 'cartridge') {
      cap = fraction(3n);
      loaded = parse(loadedVolume, tr('calc_f_loaded', 'Volume chargé'));
      if (gt(loaded, cap)) throw Error(tr('calc_err_loaded_cap', 'Le volume chargé dépasse la capacité de 3 ml.'));
      if (gt(loaded, w)) throw Error(tr('calc_err_loaded_water', 'Le volume chargé dépasse le volume de solution déclaré.'));
      if (gt(volume, loaded)) throw Error(tr('calc_err_vol_loaded', 'Le volume calculé dépasse le volume chargé dans la cartouche.'));
      const q = div(loaded, volume);
      completeDoses = Number(q.n / q.d);
      step = confirmed ? parse(unitStep, tr('calc_f_step', 'Pas du stylo')) : null;
    } else {
      if (![30, 50, 100].includes(Number(capacity))) throw Error(tr('calc_err_capacity', 'Capacité non reconnue.'));
      cap = fraction(BigInt(capacity), 100n);
      step = Number(capacity) === 30 ? fraction(1n, 2n) : fraction(Number(capacity) === 50 ? 1n : 2n);
    }
    const overflow = gt(volume, cap);
    const aligned = step ? div(units, step).d === 1n : null;
    const alternatives = mode === 'syringe' && overflow ? [30, 50, 100].filter(c => !gt(volume, fraction(BigInt(c), 100n))) : [];
    return {
      concentration: display(concentration),
      volume: display(volume),
      units: mode === 'cartridge' && !confirmed ? null : display(units),
      volumeValue: toNumber(volume),
      unitsValue: toNumber(units),
      loadedValue: loaded ? toNumber(loaded) : null,
      completeDoses, overflow, aligned, alternatives, mode,
      capacity: Number(capacity),
      step: step ? display(step) : null
    };
  }
  root.PS_CALC = { calculate, parse, display };
  if (typeof module !== 'undefined') module.exports = root.PS_CALC;
})(typeof window !== 'undefined' ? window : globalThis);
