# Note de reprise — 15 octobre 2026, nuit (Bangkok)

Suite directe de `note_reprise_2026-10-14.md` (lot 1 « ménage stores », poussé sur `beta`).
James a choisi d'enchaîner les lots et de faire **un test global à la fin**.

## Lot 2 — préparer l'appli iPhone / Android et corriger les bugs de fond

**A. Tout est embarqué dans l'appli (plus rien depuis Internet)**
- `vendor/supabase-2.117.3.umd.js` : client Supabase figé, utilisé par toutes les pages (fini jsdelivr).
- `fonts/` : Space Grotesk 300-700 et Space Mono 400/700 en woff2 (@fontsource 5.3.0, licence OFL), `fonts/fonts.css`.
  Les `@import` Google Fonts des 12 pages et de `peptidescanner.css` pointent maintenant vers `/fonts/fonts.css`.
- `login.html` passe en UMD (fin de l'exception ESM). `supabase.js` (esm.sh) → `_archive/supabase.js`.
  La migration localStorage → Supabase après connexion est retirée (aucun compte de cette époque).
  Messages d'erreur de connexion traduits en anglais aussi.

**B. `ps-app.js` (nouveau)**, chargé juste après `lang.js` sur les 11 pages de l'appli :
`psDay()`, `psDayStr()`, `PS_isNativeApp()`, `PS_buildInjectionPlan()`, `PS_scheduleReminders()`, `PS_cancelReminders()`.

**C. BUG-11 corrigé** : 23 `new Date(…start_date)` → `psDay(…)` (dashboard 10, analytics 9, alertes 2, cure 1,
profil 1) et 4 `toISOString().split('T')[0]` → `psDayStr()` (analytics, cure, inventaire, profil). Testé sur
Bangkok, Paris, New York, Honolulu : l'ancien code donnait la veille à New York et Honolulu, le nouveau donne le bon jour.

**D. BUG-09 corrigé côté appli** : notes du jour de la page Cure dans la table `day_notes`
(script `docs/sql/2026-10-15_notes_du_jour.sql`, **à lancer par James**). Sans la table : repli sur le téléphone,
rien ne casse. Avec la table : les notes du téléphone sont recopiées puis retirées du téléphone. Texte de la note
échappé à l'affichage.

**E. Rappels d'injection**
- Avant : ne partaient que si la page Alertes restait ouverte (setTimeout).
- Dans l'appli installée : le téléphone programme les rappels des 7 prochains jours (extension Local Notifications,
  60 au maximum, créneau du jour déjà fait ignoré). Bouton « Activer » de la page Alertes = demande d'autorisation
  du téléphone. Reprogrammés à chaque changement de réglage et à chaque chargement de l'accueil.
- Dans un navigateur : ancien fonctionnement inchangé.
- `alertes.html` ne plante plus dans l'appli (`Notification` n'y existe pas).

**F. Squelette Capacitor** (rien d'installé) : `package.json` (Capacitor 8.5 : core, cli, ios, android,
local-notifications, status-bar ; Node 22 minimum), `capacitor.config.json` (identifiant **`app.peptidescanner`**,
validé par James, définitif après publication), `scripts/build-www.sh` (copie 15 pages + scripts + styles + fonts +
vendor + brand + icons dans `www/`, s'arrête au premier fichier manquant). `.gitignore` : `www/`, `node_modules/`.
Les scripts npm s'appellent `www` et `cap:*` (pas `build`) pour que Vercel ne lance rien de nouveau.
Note : un dossier `www/` a été fabriqué une fois pendant les tests dans le dossier de James ; il est ignoré par Git
et sera refait par `npm run www`.

**G. `lang.js` dédoublonné** : 145 lignes en double retirées (137 FR, 8 EN), en gardant chaque fois la dernière
définition. Vérifié : 1017 clés FR / 1017 EN, contenu strictement identique avant/après (comparaison profonde).

**Divers** : `sw.js` cache v1.3 (fonts, vendor, ps-app) ; `CLAUDE.md` mis à jour.

## Vérifications faites
- 0 erreur sur tous les blocs JavaScript ; `ps-app.js`, `lang.js`, `sw.js` vérifiés.
- Rendu 14 pages × 3 largeurs × clair/sombre × FR/EN = 168 combinaisons (une moitié avec une cure active simulée) :
  0 erreur JS, polices locales chargées partout, **0 requête vers Internet**, 0 clé brute, 5 entrées de navigation.
- Seul défaut vu : `mentions-legales.html` déborde de 27 px en largeur téléphone (page légale pas encore migrée).
- Simulation de l'appli installée : activer → 6 rappels programmés (les 7 prochains jours, 08:00 du jour déjà passé) ;
  désactiver → 6 annulés ; ouverture de l'accueil → rappels reprogrammés ; 0 erreur.
- `scripts/build-www.sh` testé sur une copie : 61 fichiers, tous les liens internes résolus.

## Reste à faire — dans l'ordre
1. **James** : commit + push du lot 2 sur `beta` (commande dans la conversation).
2. **James**, quand il veut : SQL `2026-10-14_proteger_premium_admin.sql`, SQL `2026-10-15_notes_du_jour.sql`,
   déploiement de la fonction `delete-account`, adresses de redirection Supabase.
3. Lot 3 — sur le Mac de James : Node 22, Xcode (+ CocoaPods), Android Studio ; `npm install`, `npm run www`,
   `npx cap add ios`, `npx cap add android` ; icônes et écran de démarrage ; premier lancement sur simulateur.
4. Lot 4 — RevenueCat : **il faut les prix** (paliers Apple/Google), produits dans les consoles, clés publiques,
   fonction serveur webhook → `premium`.
5. Petit site légal + migration des pages CGU / confidentialité / mentions (débordement, Lemon Squeezy, Anthropic).
6. Test global (décidé par James).
