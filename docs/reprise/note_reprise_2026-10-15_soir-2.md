# Note de reprise — 15/10/2026, soir (2) — Clarté à 100 % du kit

## Où on en est
- Branche `beta`. Dernier commit poussé avant ce lot : `c354f47` (Clarté v1, environ 15 % du kit).
- James a refusé la v1 (« tu as pris 15 %, je voulais presque 100 % ») et a donné son go pour tout reprendre.
- Ce lot : **toutes les pages refaites à partir des maquettes du kit « Clarté enrichie »** (33 écrans).
  Estimation : environ 90-95 % du kit repris (structure, composants, textes, états vide / chargement / erreur,
  clair et sombre). Ce qui diffère volontairement : données réelles au lieu des données de démonstration,
  « Informations légales » ouvert en feuille depuis le profil au lieu d'une page.

## Ce qui a changé (fichiers)
- `peptidescanner.css` : réécrit, jetons + composants du kit avec les mêmes noms de classes.
- `ps-app.js` v2 : outils communs `window.PS` (statuts, cures, stock, feuilles, toasts, session…).
- `ps-calc.js` (nouveau) : moteur du calculateur du kit.
- `lang.js` : 1848 clés FR = 1848 EN, sans doublon ni valeur vide.
- Pages refaites : dashboard, cure, inventaire, calculateur, poids, analytics, alertes, peptide-database,
  profil, login, reset-password, avertissement, cgu, privacy, mentions-legales (+ `legal.css`).
- Pages nouvelles : `onboarding.html` (matériel puis préférences, facultatif), `premium.html` (offre des stores,
  aucun prix inventé).
- `sw.js` (cache v3.0), `scripts/build-www.sh` (nouvelles pages + ps-calc.js, sans peptidescanner-extra.css),
  `index.html` (couleur de fond Clarté), `CLAUDE.md` (section design réécrite, étiquettes, 1848 clés).
- Archivés dans `_archive/pages-carnet-2026-10-15/` : les 15 anciennes pages, ancien `legal.css`,
  `peptidescanner.css`, `ps-app.js`, `lang.js`, et `peptidescanner-extra.css`.

## Vérifications faites (environnement de Claude)
- Banc d'essai iPhone 16 Pro Max simulé, fausse base, réseau bloqué : 71 rendus (clair, sombre, FR, EN, vide),
  0 erreur, 0 texte trop petit, 0 cible trop petite, 0 contraste faible, 0 émoji, 0 débordement, 0 clé brute.
- 61 comparaisons côte à côte maquette du kit / notre appli, relues écran par écran.
- `node --check` sur tous les scripts, aucune date en `toISOString()`, balise Supabase sans code.

## Décisions ouvertes (à trancher par James)
1. **`inventory.bac_water_ml` = eau ajoutée en ml** maintenant ; la dose par injection va dans l'étiquette
   `idose:`. Les anciens flacons démo s'en servaient comme dose : leur volume peut s'afficher faux → les
   ressaisir (ou les supprimer) dans l'appli.
2. **« Fuseau des rappels »** (page Rappels) est enregistré mais n'a pas encore d'effet : le cacher ou le brancher.
3. Après un refus des notifications, pas encore de bouton « Ouvrir les réglages » (demande un petit module natif).
4. Texte de confidentialité : parle encore de « seringues possédées » et de « taille » → à revoir au brainstorming légal.
5. Création de compte : la confirmation du mot de passe a été retirée (comme le kit), minimum 6 caractères.
6. Fiches de la bibliothèque : rubriques « effets étudiés » et « contre-indications » reprises des données
   existantes, ton documentaire ; à relire avec l'avis des autres IA sur les règles Apple 1.4.1.

## Prochaines étapes
1. James : commit + push sur beta (commande donnée en fin de séance), puis `npm run www && npx cap sync ios`, ▶ Xcode,
   test global sur l'iPhone.
2. Retours de James sur l'iPhone → corrections.
3. Lot suivant décidé : vraie Dynamic Island (Live Activities, module Swift).
4. Puis : RevenueCat et prix, réponse du brainstorming ChatGPT à recouper, SQL (×2), fonction delete-account,
   redirections Supabase, textes légaux [À compléter] (James).
