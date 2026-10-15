# PeptideScanner — consignes du projet

Ce fichier complète `~/.claude/CLAUDE.md` (la méthode de James), qui prime en cas de contradiction.
Réécrit le 14/10/2026 (cap stores) ; design Clarté appliqué le 15/10/2026, repris à 100 % du kit le soir même.

## Cap décidé le 14/10/2026
- Appli **uniquement** pour l'App Store et Google Play. Plus de version web, plus de version bureau.
- Abonnement via **RevenueCat** (achats Apple et Google). **Lemon Squeezy abandonné.**
- **Boutiques retirées** de l'appli (motif de refus des stores). Code dans `_archive/pages/`.
- **Aucun texte ne conseille une dose** ni ne vante un produit non approuvé : ton neutre et documentaire.
  Le calculateur convertit la dose saisie par l'utilisateur, il n'en propose jamais.
- **Conseiller IA retiré** (même éteint, il répondait avec des doses toutes faites). Code dans `_archive/pages/ia.html`.
- Un petit site gardera seulement les pages légales (CGU, confidentialité, support, suppression de compte). Plus tard.
- Aucun utilisateur réel : seulement les comptes démo de James.
- Détail : `docs/audit_stores_2026-10-14.md`.

## Design « Clarté » à 100 % (15/10/2026, kit « Clarté enrichie » de ChatGPT validé par James)
- **Toutes les pages sont la reproduction des maquettes du kit** (33 écrans) : mêmes blocs, mêmes composants,
  mêmes textes, mêmes états (vide, chargement, erreur). Les maquettes sources ne sont pas dans le dépôt (zip dans
  le projet Claude) ; les anciennes pages sont dans `_archive/pages-carnet-2026-10-15/`.
- **Une seule feuille de style** : `peptidescanner.css` = jetons du kit (clair / sombre / système) + composants
  du kit avec LES MÊMES NOMS DE CLASSES (`.card`, `.hero-card`, `.list-row`, `.field`, `.status`, `.calendar`,
  `.equipment`, `dialog.sheet`, `.toast`…) + quelques ajouts (`.kv`, `.table`, `.pills`, `.back-row`).
  Les ANCIENS noms de variables (`--muted`, `--accent-soft`, `--danger`…) restent des alias (pages légales).
  `peptidescanner-extra.css` est archivé (`_archive/pages-carnet-2026-10-15/`) : plus aucune page ne le charge.
- **Palette bleu cobalt** : clair fond `#F4F7FC` / accent `#2457D6` ; sombre fond `#0C1424` / accent `#8CABFF`.
  **Police Inter variable** (`fonts/`). Icônes Heroicons, dessins du matériel dans `assets/` (bundle).
- **Coque commune** : en-tête et barre de 5 onglets (Accueil / Cure / Matériel / Suivi / Savoir) rendus par
  `PS_initShell()` d'après les attributs du `<body>` : `data-tab`, `data-back` (sous-écran), `data-title`,
  `data-no-profile`. Gabarit de page : voir `dashboard.html` (même `<head>`, même ordre de scripts).
- **Ordre de chargement** : `lang.js` → `/assets/assets-bundle.js` → `ps-app.js` (→ `ps-calc.js` sur le
  calculateur) ; Supabase UMD en bas de page, balise sans code.
- **`ps-app.js` v2** : en plus de `psDay`, `psDayStr`, `PS_isNativeApp`, les rappels et les dessins, il expose
  `window.PS` = outils communs de toutes les pages : textes (`esc`, `fmtDate`, `fmtNum`), étiquettes (`getTag`,
  `setTag`), modèle de cure (`cure()`, `slotStates`, `cureStats`, `dayCodes`), stock (`updateStock`), composants
  (`status`, `legend`, `vialHtml`, `empty`, `notice`, `skeleton`, `errorState`, `toast` avec Annuler, `openSheet`,
  `confirm`, `statusSheet`, `field`, `select`), session (`requireSession`, `logout`), thème (`applyTheme`).
  Toute page doit passer par ces outils plutôt que de les recopier.
- **`ps-calc.js`** : moteur du calculateur repris du kit (fractions exactes, aucun arrondi caché).
- **Les 6 états** : fait = vert, partiel = VIOLET, manqué = ARDOISE (jamais rouge), reporté = AMBRE,
  prévu = bleu, repos = neutre ; chaque état a aussi sa forme (lisible sans couleur). Rouge = vraies erreurs.
- **Nouvelles pages** : `onboarding.html` (après l'avertissement, matériel puis préférences, facultatif) et
  `premium.html` (offre des stores, aucun prix inventé tant que RevenueCat n'est pas branché).
- **Stylos branchés aux données** : inventaire (prérempli, rechargeable), cure au stylo, calculateur cartouche.
- **Pas d'émojis dans l'interface.** Banc d'essai : iPhone 16 Pro Max simulé, fausse base, réseau bloqué
  (dans l'environnement de Claude, jamais sur le vrai compte).

## À lire avant tout : ce qui fait le plus mal si on l'oublie
- **Pousser sur `main`, c'est mettre en production** : Vercel publie tout seul. La version de test, c'est la
  **branche `beta`** (Vercel donne une adresse de test par branche). James fusionne dans `main` quand il décide.
- **Une seule base Supabase** pour tout : toute écriture de test crée de vraies lignes.
- **`lang.js` est le fichier le plus fragile** : clés dans le mauvais bloc. Vérifier la parité FR/EN après chaque
  édition (**1848 clés de chaque côté au 15/10 soir**, sans doublon, sans valeur vide).
- **Ne pas lancer de commande git qui écrit** depuis l'environnement distant : un verrou `.git/index.lock` peut
  rester et bloquer les `git add` de James. Lire avec `git status`, `git log`, `git config --get`.

## Technique
HTML/CSS/JS purs, **aucun framework**. Emballage en appli : **Capacitor 8** (Node 22 minimum), identifiant
**`app.peptidescanner`** (définitif une fois publié). `package.json` + `capacitor.config.json` à la racine ;
`scripts/build-www.sh` (`npm run www`) copie les seuls fichiers de l'appli dans `www/` (ignoré par Git) —
dossiers copiés : fonts, vendor, brand, icons, **assets, licences**.
**Tout est embarqué, rien n'est chargé depuis Internet** : Supabase UMD figé dans `vendor/supabase-2.117.3.umd.js`,
police dans `fonts/`, dessins dans `assets/`.
Supabase (ref `dkwztwlkjewdzfichkgk`). Tables : profiles, cures, injections, weight_logs, inventory, alerts, peptides —
RLS partout, suppression en cascade depuis `auth.users`. Table `day_notes` (notes du jour) créée par
`docs/sql/2026-10-15_notes_du_jour.sql` ; tant qu'elle n'existe pas, cure.html retombe sur la mémoire du téléphone.
Dépôt : `massilia1383/peptidescanner-app`. Dossier : `~/development/peptidescanner-app`.
Git : identifiants **locaux** à ce dossier (`credential.helper osxkeychain`, compte massilia1383) ; ne jamais toucher
à la configuration git globale.
Fonctions serveur : `supabase/functions/ai-proxy` (archivée côté appli), `supabase/functions/delete-account`.
Schéma et procédure Supabase : `docs/supabase/`. Scripts SQL datés : `docs/sql/` (un script livré est gelé).
iOS : projet dans `ios/` (sans CocoaPods). Icône : `ios/App/App/Assets.xcassets/AppIcon.appiconset/` (une seule
image 1024). Écran de démarrage : `Splash.imageset` (fond cobalt + symbole). Mise à jour sur l'iPhone :
`npm run www && npx cap sync ios`, puis ▶ dans Xcode.

## Rail de livraison (James décide à chaque étape)
1. Claude lit librement, puis présente la liste complète des changements, fichier par fichier → go de James.
2. Claude modifie les fichiers directement dans le dossier, en gros lots.
3. Vérifications : script à ancres (n'écrit rien si une ancre ne correspond pas), `node --check` sur tous les blocs
   de script, parité FR/EN, aucun lien vers une page archivée, rendu 390 / 768 / 1440 px, clair et sombre, FR et EN.
4. Claude donne UNE commande : branche `beta`, fichiers par leur chemin, commit d'une ligne, push.
5. James vérifie sur l'adresse de test Vercel, puis fusionne dans `main` quand il veut.
6. SQL, déploiement des fonctions Supabase, clés, RevenueCat, consoles des stores : **James seul**.

## Pièges connus
1. **`lang.js`** : valeurs EN dans le bloc FR ; toute nouvelle clé dans les DEUX blocs. Une clé = une ligne par bloc.
2. **Dates** : jamais `toISOString()` ni `new Date('AAAA-MM-JJ')` (décalage d'un jour selon le fuseau).
   Utiliser `psDay()` et `psDayStr()` de `ps-app.js`. BUG-11 corrigé le 14/10 (27 endroits).
3. **`t` comme nom de variable** masque la fonction de traduction.
4. **`${t('clé')}` dans du HTML statique** s'affiche tel quel ; une page doit charger `lang.js` en premier.
5. La balise `<script>` qui charge Supabase UMD ne doit contenir aucun code (ignoré sans erreur).
6. Champs `notes` porteurs d'étiquettes : ne pas « nettoyer », toujours `P.getTag` / `P.setTag`.
   Injections : `slot:N`, `report:AAAA-MM-JJ`, `st:missed|partial|rest|postponed`, `to:AAAA-MM-JJ HH:MM`,
   `qty:`, `note:`. Cures : `admin:`, `inv:UUID`, `times:08:00,20:00`, `dow:1,4`, `dates:…`,
   `dev:syringe|prefilled|refillable`, `label:` (anciennes étiquettes de titration conservées). Inventaire :
   `sealed|active|finished`, `temp:`, `days:`, `snote:`, `type:vial|pen-prefilled|pen-refillable`, `pdose:`,
   `pleft:`, `pstep:`, `pscale:100`, `ploaded:`, `idose:` (dose par injection, mg). Fréquence de prise en texte
   dans `lot_number`. `cures.frequency` reste un nombre en texte (1, 2, 3 par jour ; 0.5 ; 0.28 ; 0.14).
   **`inventory.bac_water_ml` = eau ajoutée en ml** depuis le 15/10 (les anciens flacons démo s'en servaient
   comme dose : leur volume affiché peut être faux, à ressaisir).
7. `PS_applyI18n()` une fois par rendu ; fonctions définies avant d'être appelées ; doses en mg ;
   `padding-bottom: 120px` ; pas d'`overflow:hidden` sur une carte dont des éléments dépassent.
8. **Dans l'appli installée, `Notification` n'existe pas** : passer par `PS_isNativeApp()` et les rappels de `ps-app.js`.
9. **Avertissement d'utilisation** : `dashboard.html` renvoie vers `avertissement.html` tant que
   `user_metadata.disclaimer_accepted_at` manque (version 1). Changer le texte de façon importante = augmenter
   `WARN_VERSION` dans `avertissement.html` ET le seuil dans `dashboard.html`.
10. **Un style propre à une page** va dans le `<style>` de la page, avec les jetons `var(--…)` uniquement
    (aucune couleur en dur). `peptidescanner-extra.css` est archivé : ne pas le recharger.
11. **`PS_icon`/`PS_asset` exigent `/assets/assets-bundle.js` chargé avant** ; sinon elles renvoient ''.

## Fichiers clés
`lang.js` (1848 clés × 2) · `login.html` (connexion, création, mot de passe oublié), `reset-password.html`,
`avertissement.html`, `onboarding.html` (écrans publics) · `dashboard.html` (Aujourd'hui) · `cure.html`
(calendrier, réglages, statuts) · `poids.html` · `inventaire.html` (flacons, stylos, fiches matériel) ·
`alertes.html` (rappels) · `analytics.html` (statistiques) · `calculateur.html` + `ps-calc.js` ·
`peptide-database.html` (48 fiches, ton neutre) · `profil.html` (suppression de compte, export) ·
`premium.html` · `cgu.html`, `privacy.html`, `mentions-legales.html` + `legal.css` ([À compléter] à remplir
par James) · `index.html` · `peptidescanner.css` · `ps-app.js` · `assets/` (bundle, equipment, icons) · `brand/logo-clarte.svg`,
`brand/app-icon-clarte.svg` · `fonts/` (Inter) · `licences/` · `vendor/` · `icons/` (PWA, régénérées) ·
`package.json` · `capacitor.config.json` · `scripts/build-www.sh` · `sw.js` (cache v3.0) · `manifest.json` ·
`ios/` · `ps-admin-x7k9m/admin.html` (PAS migré au design Clarté : garde l'ancien, hors appli).
Archivés : `_archive/pages/`, `_archive/ia/`, `_archive/supabase.js`, `_archive/fonts/` (Space),
`_archive/css/peptidescanner-carnet-2026-10-15.css`, `_archive/brand/` (ancien logo),
`_archive/pages-carnet-2026-10-15/` (pages, CSS, lang.js et ps-app.js d'avant la reprise à 100 %).
Corbeille locale non suivie : `_to_delete/`.

## Notes de reprise — `docs/reprise/`
Source de vérité. Au démarrage, lire la note la plus récente sans qu'on le demande. En fin de session, écrire
`note_reprise_AAAA-MM-JJ[_soir|_nuit].md` (heure de Bangkok), sans écraser, la recopier dans le projet Claude
(`claude/`), puis livrer une seule commande de commit (code + note). Tout document durable va dans `docs/`.
