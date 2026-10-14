# Note de reprise — 14 octobre 2026 (Bangkok)

## Le cap a changé
- Appli **uniquement** pour l'App Store et Google Play : plus de version web ni de bureau.
- Abonnement via **RevenueCat** (achats Apple / Google). **Lemon Squeezy abandonné.**
- **Boutiques retirées** de l'appli, **conseiller IA retiré** (même éteint, il répondait avec des doses toutes faites).
- Ton neutre et documentaire : l'appli ne conseille aucune dose.
- Aucun utilisateur réel : seulement les comptes démo de James.
- Audit complet : `docs/audit_stores_2026-10-14.md`.
- Nouvelle méthode de livraison : **branche `beta`** (adresse de test Vercel), `main` = production.

## Ce qui a été fait (grand lot « ménage stores », sur la branche `beta`)

**Archivé (rien supprimé)** dans `_archive/pages/` : `boutiques.html`, `lemon-checkout.html`, `ia.html`,
`onboarding.html` (relié à rien, écrivait dans la mémoire du téléphone et pas dans Supabase), `demo.html`,
`demo-live.html`, ancienne landing `index.html`. Dans `_archive/ia/` : `ia.txt`, `ia_usage.sql`.
`.bak_lotB/` → `_to_delete/bak_lotB/` (corbeille locale, non suivie).

**Navigation (9 pages)** : retrait de « Abonnement » (menu du compte), « IA », « Abonnement », « Boutiques »
(tiroir Plus). « 80+ peptides » → « 48 peptides ».

**`index.html`** : simple renvoi vers `dashboard.html` (qui renvoie vers la connexion si besoin).

**`peptide-database.html`** : plus d'affichage du dosage, de la fréquence, de la durée, du protocole, des stacks,
de la note, ni des liens d'achat. Restent : catégorie, voie, phase de recherche, effets étudiés, effets indésirables,
contre-indications. Fiches masquées : 45 (stack), 48 (relance), 49 et 52 (doublons) → 48 fiches. Les données restent
dans le fichier (`HIDDEN_IDS`). Surnom « Barbie drug » retiré.

**`calculateur.html`** : onglet Titration retiré (le code JS reste, inutilisé), presets HGH/HCG retirés, consigne
« dose minimale recommandée » retirée. Restent : reconstitution, conversion dose → unités, guide d'injection,
alerte dose élevée.

**`profil.html`** :
- carte Premium → « Premium — bientôt disponible », sans bouton ;
- **faille corrigée côté page** : l'ancien bouton passait le profil en Premium sans paiement (`activatePremium`, retiré) ;
- nouveau bouton **« Supprimer mon compte »** (double confirmation → fonction `delete-account` → déconnexion) ;
- « Supprimer toutes mes données » efface aussi les alertes ;
- ligne « Page d'accueil » retirée ;
- **bug CSS réparé** : un morceau d'ancienne règle sans sélecteur avalait le style des boutons de la zone de danger
  (ils s'affichaient en boutons bruts).

**`login.html`** : design Carnet de protocole (couleurs et mode sombre de `peptidescanner.css`), plus de lien vers la
landing, email de confirmation affiché sans `innerHTML`.

**`reset-password.html`** (nouvelle) : la page « nouveau mot de passe » n'existait pas, le lien « Mot de passe
oublié » menait à une erreur.

**`lang.js`** : 16 clés ajoutées dans les deux blocs (suppression de compte, Premium bientôt, nouveau mot de passe),
sous-titre de la bibliothèque neutre, « Effets étudiés », « 48 peptides ». **Parité : 1017 clés FR / 1017 EN.**

**`manifest.json`, `sw.js`** : raccourci et mention IA retirés, pages archivées retirées du cache, cache v1.2.

**Serveur, préparé, à lancer par James** :
- `supabase/functions/delete-account/index.ts` ;
- `docs/sql/2026-10-14_proteger_premium_admin.sql` (empêche un utilisateur de modifier lui-même `premium`,
  `premium_until`, `is_admin` ; l'admin garde la main).

**Rangement** : `.gitignore` créé ; `supabase-schema.sql` et `SETUP-SUPABASE.md` → `docs/supabase/` ; `CLAUDE.md`
réécrit ; notes du 19 et du 29 août recopiées dans `docs/reprise/` ; audit dans `docs/`.

## Vérifications faites
- 0 erreur JavaScript sur tous les blocs de script des pages.
- 0 lien restant vers une page archivée.
- Rendu de 11 pages × 3 largeurs (390 / 768 / 1440) × clair/sombre × FR/EN = 132 combinaisons, avec une base Supabase
  simulée : 0 erreur, 0 débordement horizontal, 0 clé de traduction affichée brute, 5 entrées de navigation partout.
- Contrôlé à l'œil : connexion (clair et sombre), bibliothèque et fiche détaillée, calculateur, profil.

## Reste à faire — dans l'ordre
1. **James** : commit + push sur `beta`, vérification à l'écran sur l'adresse de test Vercel.
2. **James** : lancer le SQL `docs/sql/2026-10-14_proteger_premium_admin.sql`.
3. **James** : déployer la fonction `delete-account`.
4. **James** : ajouter l'adresse de test (et plus tard celle de l'appli) dans Supabase → Authentication → URL
   Configuration → Redirect URLs, pour « Mot de passe oublié ».
5. Fusion `beta` → `main` quand James décide.
6. Lot suivant : emballage Capacitor (Supabase et polices embarqués dans l'appli au lieu des CDN, notifications
   natives pour les rappels), puis RevenueCat (produits Apple/Google, webhook → `premium` côté serveur).
7. Petit site légal (CGU, confidentialité — elles parlent encore de Lemon Squeezy et d'Anthropic —, support,
   suppression de compte).
8. Toujours ouverts : BUG-09 (notes de cure en mémoire locale), BUG-11 (dates), doublons de `lang.js`.
