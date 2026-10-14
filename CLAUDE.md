# PeptideScanner — consignes du projet

Ce fichier complète `~/.claude/CLAUDE.md` (la méthode de James), qui prime en cas de contradiction.
Réécrit le 14/10/2026 après le changement de cap (appli stores uniquement).

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

## À lire avant tout : ce qui fait le plus mal si on l'oublie
- **Pousser sur `main`, c'est mettre en production** : Vercel publie tout seul. La version de test, c'est la
  **branche `beta`** (Vercel donne une adresse de test par branche). James fusionne dans `main` quand il décide.
- **Une seule base Supabase** pour tout : toute écriture de test crée de vraies lignes.
- **`lang.js` est le fichier le plus fragile** : clés dans le mauvais bloc. Vérifier la parité FR/EN après chaque
  édition (1017 clés de chaque côté au 14/10, sans doublon).
- **Ne pas lancer de commande git qui écrit** depuis l'environnement distant : un verrou `.git/index.lock` peut
  rester et bloquer les `git add` de James. Lire avec `git status`, `git log`, `git config --get`.

## Technique
HTML/CSS/JS purs, **aucun framework**. Emballage en appli : **Capacitor 8** (Node 22 minimum), identifiant
**`app.peptidescanner`** (définitif une fois publié). `package.json` + `capacitor.config.json` à la racine ;
`scripts/build-www.sh` (`npm run www`) copie les seuls fichiers de l'appli dans `www/` (ignoré par Git).
**Tout est embarqué, rien n'est chargé depuis Internet** : Supabase UMD figé dans `vendor/supabase-2.117.3.umd.js`,
polices dans `fonts/` (`fonts/fonts.css`). Plus aucune page en ESM (login compris, depuis le 14/10).
**`ps-app.js`** (chargé juste après `lang.js`) : `psDay()` / `psDayStr()` pour les dates en heure locale,
`PS_isNativeApp()`, rappels programmés sur le téléphone (`PS_buildInjectionPlan`, `PS_scheduleReminders`).
Supabase (ref `dkwztwlkjewdzfichkgk`). Tables : profiles, cures, injections, weight_logs, inventory, alerts, peptides —
RLS partout, suppression en cascade depuis `auth.users`. Table `day_notes` (notes du jour) créée par
`docs/sql/2026-10-15_notes_du_jour.sql` ; tant qu'elle n'existe pas, cure.html retombe sur la mémoire du téléphone.
Dépôt : `massilia1383/peptidescanner-app`. Dossier : `~/development/peptidescanner-app`.
Git : identifiants **locaux** à ce dossier (`credential.helper osxkeychain`, compte massilia1383) ; ne jamais toucher
à la configuration git globale.
Fonctions serveur : `supabase/functions/ai-proxy` (archivée côté appli), `supabase/functions/delete-account`.
Schéma et procédure Supabase : `docs/supabase/`. Scripts SQL datés : `docs/sql/` (un script livré est gelé).

## Rail de livraison (James décide à chaque étape)
1. Claude lit librement, puis présente la liste complète des changements, fichier par fichier → go de James.
2. Claude modifie les fichiers directement dans le dossier, en gros lots.
3. Vérifications : script à ancres (n'écrit rien si une ancre ne correspond pas), `node --check` sur tous les blocs
   de script, parité FR/EN, aucun lien vers une page archivée, rendu 390 / 768 / 1440 px, clair et sombre, FR et EN.
4. Claude donne UNE commande : branche `beta`, fichiers par leur chemin, commit d'une ligne, push.
5. James vérifie sur l'adresse de test Vercel, puis fusionne dans `main` quand il veut.
6. SQL, déploiement des fonctions Supabase, clés, RevenueCat, consoles des stores : **James seul**.

## Pièges connus
1. **`lang.js`** : valeurs EN dans le bloc FR ; toute nouvelle clé dans les DEUX blocs. Doublons retirés le 14/10
   (contenu vérifié identique) : une clé = une ligne par bloc, garder ça.
9. **Avertissement d'utilisation** : `dashboard.html` renvoie vers `avertissement.html` tant que
   `user_metadata.disclaimer_accepted_at` manque (version 1). Changer le texte de façon importante = augmenter
   `WARN_VERSION` dans `avertissement.html` ET le seuil dans `dashboard.html`.
8. **Dans l'appli installée, `Notification` n'existe pas** : passer par `PS_isNativeApp()` et les rappels de `ps-app.js`.
2. **Dates** : jamais `toISOString()` ni `new Date('AAAA-MM-JJ')` (décalage d'un jour selon le fuseau).
   Utiliser `psDay()` et `psDayStr()` de `ps-app.js`. BUG-11 corrigé le 14/10 (27 endroits).
3. **`t` comme nom de variable** masque la fonction de traduction.
4. **`${t('clé')}` dans du HTML statique** s'affiche tel quel ; une page doit charger `lang.js` en premier.
5. La balise `<script>` qui charge Supabase UMD ne doit contenir aucun code (ignoré sans erreur).
6. Champs `notes` porteurs d'étiquettes (`temp:X|days:X|snote:X`, `inv:UUID`, `slot:0|report:…`) et fréquence en
   texte dans `lot_number` : ne pas « nettoyer ».
7. `PS_applyI18n()` une fois par rendu ; fonctions définies avant d'être appelées ; doses en mg ;
   `padding-bottom: 120px` ; pas d'`overflow:hidden` sur une carte dont des éléments dépassent.

## Fichiers clés
`lang.js` · `login.html` (design Carnet depuis le 14/10) · `reset-password.html` (créée le 14/10) ·
`dashboard.html` · `cure.html` (BUG-09 ouvert) · `poids.html` · `inventaire.html` · `alertes.html` ·
`analytics.html` · `calculateur.html` (sans titration ni presets depuis le 14/10) ·
`peptide-database.html` (48 fiches affichées, sans dosage ni protocole) · `profil.html` (suppression de compte) ·
`avertissement.html` (premier écran, accord 18+ et données de santé) · `cgu.html`, `privacy.html`,
`mentions-legales.html` + `legal.css` (réécrites le 15/10, [À compléter] à remplir par James) ·
`index.html` (simple renvoi vers l'accueil) · `peptidescanner.css` + `peptidescanner-extra.css` · `ps-app.js` ·
`vendor/` · `fonts/` · `package.json` · `capacitor.config.json` · `scripts/build-www.sh` ·
`sw.js` · `manifest.json` · `ps-admin-x7k9m/admin.html`.
Archivés : `_archive/pages/` (landing, démo, Boutiques, Lemon Squeezy, IA, onboarding), `_archive/ia/`,
`_archive/supabase.js` (ancienne couche ESM du login).
Corbeille locale non suivie : `_to_delete/`.

## Notes de reprise — `docs/reprise/`
Source de vérité. Au démarrage, lire la note la plus récente sans qu'on le demande. En fin de session, écrire
`note_reprise_AAAA-MM-JJ[_soir|_nuit].md` (heure de Bangkok), sans écraser, la recopier dans le projet Claude
(`claude/`), puis livrer une seule commande de commit (code + note). Tout document durable va dans `docs/`.
