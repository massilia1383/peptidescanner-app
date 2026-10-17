# Lot « PepLog + retours » — liste complète, fichier par fichier (18/10/2026)

Proposé par Claude après lecture des 54 captures intérieures de PepLog (`docs/veille/peplog/ANALYSE_INTERIEUR.md`)
et du code beta `0774f70`. Rien n'est codé avant le go de James. Le tunnel d'accueil est HORS lot (lot à part).

## 0. À trancher par James avant le go (sinon je prends le choix en gras)
| # | Question | Choix proposé |
|---|---|---|
| D1 | Bandeau semaine : 7 ronds (jour renseigné = coché) | **Oui, sans flamme ni compteur de série** (décision du 15/10) |
| D2 | Objectif de poids facultatif (ligne sur la courbe + « écart ») | **Oui, facultatif, éteint par défaut, affichage neutre** ; jamais de « bravo » |
| D3 | Hydratation (carte accueil + objectif) | **Oui, en option éteinte par défaut**, données sur le téléphone seulement |
| D4 | Coût du flacon + carte « Dépenses » | **Oui, facultatif**, mot « Dépenses », jamais « investissement » ; monnaie € / $ selon la langue |
| D5 | Photos de progression | **Oui, version 1 : caméra du système, stockage sur le téléphone, 3 poses, comparaison 2 photos**. Silhouettes, calque « Ghost » et rappel photo : plus tard |
| D6 | Badges | **Version carnet** (8 badges, aucun ne compte des doses ni des produits) |
| D7 | Historique détaillé des injections | **Gratuit** (l'essentiel est gratuit) ; Premium garde comparaison de périodes, PDF, widgets |
| D8 | Rappel de pesée hebdomadaire | **Oui, option éteinte par défaut**, un seul rappel par semaine |
| D9 | Règle à glisser pour la dose | **Non** : saisie au clavier + boutons −/+ par pas (plus précis) |
| D10 | Demande de notation | **Pas dans ce lot** (extension native, jamais après la 1re dose) |
| D11 | Icône de l'étape 2 de la frise d'essai (lot tunnel) | **Étoile** plutôt que cloche |

## 1. Fichiers de l'appli

### `ps-app.js` (outils communs, +≈ 320 lignes)
1. `PS.APP_VERSION = '1.1.0'` : une seule source pour le profil et la note de reprise.
2. `updateStock` renvoie `{ avant, apres, manque }` au lieu de rien ; le reste est toujours bloqué à 0 mais l'appelant
   est prévenu quand la dose dépasse le stock (retour 3).
3. Sites d'injection communs : `PS.SITES` (6 sous-cutanés, 4 intramusculaires), `PS.siteLabel(clé)`,
   `PS.suggestSite(cure, injections)` = rotation calculée d'après la DERNIÈRE injection enregistrée (plus de mémoire
   séparée Accueil / Cure : correction de l'incohérence 1). `injection_site` reçoit désormais la CLÉ (`site_abd_g`),
   les anciens libellés FR/EN sont reconnus à la lecture.
4. `PS.vialUnits(mg, ml)` : « 1 mg = N unités U-100 » et « 1 mg = X ml » (pour la fiche flacon, le formulaire, la
   feuille d'injection).
5. Préférences : `PS.prefs.get()` / `PS.prefs.set({...})` dans `user_metadata.prefs` (aucun SQL) + copie locale :
   `weight_unit` (kg | lb), `hydration` (on/off, objectif ml, unité ml | oz), `weight_goal_kg`, `low_vial_pct`
   (10 | 20 | 30), `badges` (on/off), `weigh_reminder` (jour, heure). Conversions `PS.kgTo`, `PS.toKg`, `PS.fmtWeight`.
6. Coque : bouton **« + » flottant** sur les 5 pages à onglets (Enregistrer une injection → accueil ; Ajouter une
   pesée → poids.html#add ; Ajouter une photo → photos.html#add) ; **bouton thème** (soleil / lune) dans l'en-tête
   qui bascule clair / sombre et enregistre `ps_theme`.
7. Composants : `PS.segmented(items, actif)`, `PS.weekBand(jours)`, `PS.donut(parts)` (SVG maison, couleurs des
   jetons, lisible sans couleur grâce à la liste à côté), `PS.stepper(id, valeur, pas, unité)`.
8. `PS.badges(données)` : moteur des 8 badges « carnet » (voir §3), tous calculés sur place, rien d'envoyé.
9. `PS.greeting(prenom)` : « Bonjour, James » / « Good morning, James » selon l'heure.
10. `PS.supportId(userId)` : 8 premiers caractères en majuscules.

### `peptidescanner.css` (+≈ 180 lignes, jetons uniquement)
`.fab` + `.fab-menu` · `.week-band` · `.donut` · `.badge-grid` + `.badge` (anneau de progression, état gagné / en cours) ·
`.photo-grid` + `.photo-compare` · `.result-sentence` + `.chips` · `.site-list` · `.stepper` · `.history-day` ·
`.icon-btn.theme`. Rien d'autre ne change.

### `dashboard.html` (Accueil, +≈ 260 lignes)
1. En-tête de page : « Bonjour, James » (prénom du profil, sinon « Bonjour ») + date complète.
2. **Bandeau semaine** (D1) : 7 ronds lun → dim, coché quand au moins un créneau du jour est renseigné (fait, partiel,
   repos…), étoile sur aujourd'hui, aucun compteur.
3. Carte « Vos injections » inchangée + ligne **« Flacon lié : 90 % · ≈ 18 doses »** quand la cure a un flacon.
4. **Liste des cures actives** (remplace la carte « Cure en cours » qui ne montrait que la première) : nom, jour X / Y,
   prochain créneau, barre du flacon lié, bouton « Enregistrer » (prochain créneau vide) ou « Voir ».
5. Petites cartes : **Dernière pesée** avec écart par rapport à la précédente et « il y a N jours » ; **Hydratation**
   (D3, si activée) : « 750 / 2 000 ml », appui = + 250 ml, long appui = corriger ; **Prochain rappel** conservé.
6. Carte « Flacon bientôt vide » : seuil réglable (10 / 20 / 30 %) au lieu de 20 % fixe.
7. Feuille de modification d'une injection : ajout de la **quantité réellement injectée** (mg, préremplie avec la dose
   de la cure, avec l'équivalent « ≈ 20 U · 0,2 ml » si flacon lié), du **site** (liste, suggestion marquée
   « conseillé », « dernier utilisé » affiché), et de la **date** (injection passée). « Marquer comme faite » reste en
   un appui (dose de la cure + site suggéré), on corrige après si besoin.
8. Avertissement de stock (retour 3) : toast « Le flacon n'avait plus que 0,3 mg : stock à 0. Vérifiez vos saisies »
   + lien vers le flacon.
9. Lien « Historique » vers `analytics.html#history`.
10. Pied de la feuille : « Le carnet n'enregistre que ce que vous saisissez. Aucun conseil de dose. »

### `cure.html` (+≈ 220 lignes)
1. **Dupliquer** (retour 2) : bouton dans les réglages de chaque cure (en cours ou terminée) → formulaire prérempli
   (dose, fréquence, jours, horaires, durée, administration, matériel), nom « … (copie) », début = aujourd'hui, flacon
   lié NON recopié, enregistrée comme nouvelle cure active.
2. Feuille de créneau : **site au choix** (liste + suggestion), **quantité réelle** sur « Fait » (facultative), **note
   par injection** (`note:`) en plus de la note du jour ; équivalents U / ml si flacon lié.
3. Avertissement de stock identique à l'accueil.
4. Choix du peptide : bouton « Choisir dans la liste » → feuille avec recherche, 48 fiches + noms du matériel, saisie
   libre conservée (le champ texte reste).
5. Correction de l'incohérence 2 : « Partiel » ne remplace plus `dose_mcg` par la quantité (la quantité va dans `qty:`
   comme sur l'accueil).

### `inventaire.html` (+≈ 170 lignes)
1. Bascule **« En cours | Terminés »** en haut de la liste ; « Terminés » = « N flacons terminés », du plus récent au
   plus ancien (Vial History).
2. Fiche flacon : **% restant en texte**, tuile **« 1 mg = 200 unités »** (d'après mg et eau), **« ≈ 18 doses
   restantes »** en reprenant la dose de la cure liée quand `idose:` manque, bloc **« 7 derniers jours »** (dernier site,
   doses, total mg) d'après les injections de la cure liée, bouton **« Marquer terminé »** avec confirmation et Annuler
   (toast), bouton « Enregistrer une injection » si cure liée.
3. Formulaire : ligne « 1 mg = N unités » calculée en direct sous le champ eau ; champ **« Prix payé »** facultatif
   (D4, étiquette `cost:` dans `notes`, aucune colonne à créer) ; libellé « Seringue à insuline » (retour 1).
4. Seuil « bientôt vide » = préférence (10 / 20 / 30 %).

### `calculateur.html` + `ps-calc.js` (+≈ 130 lignes)
1. Titre **« Conversion des valeurs saisies »** / **« Equivalence calculated from your entries »** (retour 4), sous-titre
   « Convertit les valeurs que vous saisissez ».
2. Choix du matériel en **segments** (30 U · 50 U · 100 U · Cartouche) au lieu du menu déroulant.
3. **Calcul en direct** pendant la saisie (le bouton « Calculer » disparaît ; Entrée fonctionne toujours).
4. Carte **Résultat** en tête : phrase « **20 U** mesurent **1 mg** · seringue U-100 » + 3 puces « 10 mg · 2 ml d'eau
   → 1 mg » ; les 3 valeurs (mg/ml, ml, U) et le dessin qui se remplit sont conservés, ainsi que zoom, cartouche et
   « choisir une seringue plus grande ».
5. Unité **mg / mcg** pour le flacon et la dose (conversion, jamais d'arrondi caché).
6. Pied : « Les calculs n'utilisent que vos valeurs. Vérifiez chaque résultat. »

### `analytics.html` (Statistiques, réécrite, ≈ 420 lignes)
1. Segments en tête : **Injections | Poids | Badges** (Poids → `poids.html`).
2. Période **7 j · 30 j · 90 j · Tout** (mémorisée).
3. Carte **Doses** : par cure, « 12 doses · 3,0 mg » + barre, « Les totaux ne reflètent que vos saisies ».
4. Carte **Sites d'injection** : anneau + liste (nombre par site, « dernier utilisé »).
5. Carte **Suivi des créneaux** : l'actuelle (saisies / prévues, 6 états) conservée, par cure.
6. Carte **Dépenses** (D4) : visible seulement si au moins un prix est saisi : total sur la période, coût par dose,
   flacon le plus coûteux.
7. **Historique** (D7, gratuit) : groupé par jour (Aujourd'hui, Hier, lundi 12 octobre…), chaque ligne
   « 0,05 mg · abdomen gauche · 01:07 › » ouvre le jour dans `cure.html` où l'on modifie.
8. Section **Badges** (D6) : 8 badges carnet avec progression, « Le plus proche ».
9. Carte Premium réduite à ce qui est vraiment Premium : « Comparer deux périodes », « PDF pour une consultation »,
   « Widgets ».

### `poids.html` (+≈ 110 lignes)
1. Unité **kg / lb** (saisie et affichage, préférence du profil ; la base reste en kg).
2. **Variation sur la période** : « −1,2 kg sur 30 jours » / « pas de changement ».
3. **Objectif facultatif** (D2) : ligne pointillée « Objectif 68 kg » sur la courbe + « écart : 13,6 kg », ton neutre.
4. Segments **Injections | Poids | Badges** en tête ; `#add` (depuis le bouton « + ») ouvre le formulaire.
5. Les boutons 7 / 30 / 90 / Tout passent en `.segmented` (même composant partout).

### `photos.html` (NOUVELLE page, ≈ 380 lignes) — D5
1. 3 poses : **Visage de face**, **Corps de face**, **Corps de dos**. Prendre (caméra du téléphone via le sélecteur
   système) ou importer. Les photos sont réduites (1 600 px, JPEG) et gardées **sur le téléphone seulement**
   (IndexedDB), jamais envoyées : phrase affichée en haut de la page et dans la confidentialité.
2. Photothèque : filtres Toutes · Visage · Corps face · Corps dos, date sous chaque vignette, ouverture plein écran.
3. **Comparer** : deux photos côte à côte avec leurs dates et l'écart de jours.
4. Supprimer une photo (confirmation) ; « Supprimer toutes mes données » du profil efface aussi les photos.
5. Accès : carte « Photos de progression » sur l'accueil, bouton « + », segments de la page Suivi.
6. Sans silhouette ni calque « Ghost » dans cette version (impossible sans vue caméra en direct).

### `profil.html` (+≈ 150 lignes)
1. Sections dans l'ordre : Compte · Préférences (prénom, langue, apparence) · **Unités** (poids kg / lb, hydratation
   ml / oz) · **Suivi** (hydratation on/off + objectif, objectif de poids facultatif, seuil « bientôt vide », badges
   on/off) · Abonnement (+ Restaurer mes achats) · Rappels · **Avertissement d'utilisation** (texte + lien) · **Vos
   données** (en ligne, chiffrées, export JSON gratuit, aucune vente, aucun entraînement d'IA, photos sur le
   téléphone) · Informations légales · Exporter · **Assistance** (e-mail + **Identifiant d'assistance** à copier) ·
   Version (`PS.APP_VERSION`) · Déconnexion · Supprimer.
2. Export et « Supprimer toutes mes données » incluent `day_notes` et les photos (incohérence 4).
3. Texte « contactez l'assistance depuis votre profil » devient vrai (incohérence 6).

### `premium.html`
Retrait de « Export de vos données » (retour 6) ; les 3 fonctions deviennent : Comparaison de périodes, PDF pour
consultation, Widgets. Reste inchangé (RevenueCat = lot à part).

### `alertes.html` (+≈ 50 lignes) — D8
Option « Rappel de pesée » : jour de la semaine + heure, éteinte par défaut, une notification par semaine, texte discret.

### `onboarding.html`
« Seringue » → « Seringue à insuline » (retour 1). Rien d'autre (tunnel = lot à part).

### `cgu.html`, `privacy.html` (retour 7)
CGU : « vérifiez chaque résultat du calculateur », « en cas d'urgence appelez le 15 ou le 112 (911 aux États-Unis) »,
« aucune vente de données, aucun entraînement d'IA ». Confidentialité : « toute fuite est signalée sous 72 h »,
« les photos de progression restent sur votre téléphone ».

### `lang.js` (≈ +230 clés dans CHAQUE bloc, parité vérifiée)
Nouvelles clés (accueil, cures, inventaire, calculateur, stats, poids, photos, profil, badges, sites), renommages
« Seringue à insuline » (`cure2_dev_syringe`, `inv2_*`, `onb_*`), `err_retry_text` corrigé, `prem2_f3*`, titres du
calculateur, `prof2_version` supprimé au profit de `PS.APP_VERSION`.

### `sw.js`, `scripts/build-www.sh`
`photos.html` ajouté aux deux listes ; cache `v3.1`.

### `ios/App/App/Info.plist`
`NSCameraUsageDescription` et `NSPhotoLibraryUsageDescription` (« PeptideScanner uses the camera for your progress
photos. Photos stay on this device. »). Sans elles, iOS refuse l'accès caméra.

### `CLAUDE.md`
Procédure TECHNIQUE de test, cap stores (Vercel n'est plus la production), nouvelles conventions : clés de site dans
`injection_site`, `cost:` dans `inventory.notes`, préférences dans `user_metadata.prefs`, photos en IndexedDB,
`PS.APP_VERSION`, compte de clés lang.

### `docs/reprise/note_reprise_2026-10-18.md` (fin de séance, copiée dans `claude/`)

## 2. Ce qui n'est PAS dans ce lot (et pourquoi)
- Tunnel d'accueil + frise d'essai + paywall : lot à part, après la réponse de ChatGPT.
- RevenueCat, prix en dollars, anglais par défaut sur la fiche App Store : lot « stores ».
- Cure sans date de fin, pause / reprise, masquer le poids, cacher « fuseau » (retour 8) : lot suivant.
- Demande de notation, silhouettes caméra, calque Ghost, rappel photo, Dynamic Island.
- Aucune table ni colonne Supabase à créer : tout passe par `notes` (étiquettes), `user_metadata` et le téléphone.

## 3. Les 8 badges « carnet » (D6)
| Badge | Condition | Pourquoi c'est acceptable |
|---|---|---|
| Carnet ouvert | première cure créée | récompense l'organisation |
| Semaine à jour | 7 jours de suite où chaque créneau prévu est renseigné (fait, partiel, manqué, repos, reporté comptent) | « à jour » ≠ « injecté » |
| Mois à jour | 30 jours de suite | idem |
| Rotation des sites | 4 sites différents utilisés sur 30 jours | bonne pratique de sécurité |
| Matériel suivi | premier flacon ou stylo renseigné avec sa date | traçabilité |
| Pesée régulière | 4 semaines de suite avec au moins une pesée | suivi neutre |
| Sauvegarde faite | un export JSON réalisé | protège ses données |
| Repos noté | un jour de repos ou une pause enregistrés | valorise l'arrêt autant que la prise |
Aucun badge ne compte des doses, des flacons terminés ni des produits différents.

## 4. Tests prévus (procédure TECHNIQUE, avant le commit)
Playwright, iPhone 16 Pro Max 440 × 956 et iPhone SE 375 × 667, clair et sombre, FR et EN, Supabase simulé, réseau
bloqué : 1) compte neuf → accueil → cure → injection avec site et quantité → flacon → stock à 0 → avertissement ;
2) dupliquer une cure ; 3) calculateur en direct, mg / mcg, dépassement ; 4) stats : période, sites, historique,
badges ; 5) poids en lb + objectif ; 6) photos : import d'une image, filtres, comparaison ; 7) profil : préférences,
export, identifiant d'assistance ; 8) 0 erreur console, 0 appel réseau sortant, parité lang 100 %.
Puis UNE commande de commit sur beta, et `npm run www && npx cap sync ios` + ▶ Xcode par James.
