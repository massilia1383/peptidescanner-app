# PepLog — analyse de l'intérieur de l'appli (18/10/2026)

54 captures de James (18/10, 01:00-01:10), PepLog 1.4.2 avec Pro actif. Index : `interieur/00_INDEX.md`.
Comparaison avec PeptideScanner beta `0774f70` (lecture du code le 18/10).
Le tunnel est traité à part (`ANALYSE.md`) et sera fait dans son propre lot.

## 1. Comment PepLog est construit
- **4 onglets + un bouton rond « + »** : Home (accueil), Stack (flacons), Measure (calculateur), Stats (statistiques).
  Le « + » ouvre 3 actions : Log peptide / Log weigh-in / Take progress photo.
- **Le flacon est au centre** : on choisit un peptide (catalogue de 68 noms ou nom libre), on « mélange un flacon »
  (mg + eau + date + coût facultatif + rappels par jour de semaine), puis chaque dose se déduit du flacon.
  Il n'y a pas de notion de « cure » avec durée : c'est le flacon qui a un début et une fin (« Mark finished »).
- **Tout se fait dans des feuilles** qui montent du bas (Add peptides, Mix vial, Log dose, Edit dose, Profile).
- **Une seule couleur d'accent** (vert d'eau), gros chiffres, phrases courtes, mode sombre par un bouton dans l'en-tête.
- **Données sur le téléphone** (pas de synchronisation), compte seulement pour l'abonnement.

## 2. Inventaire écran par écran

### Accueil (Home)
- « Good morning, James » + date du jour.
- Bandeau **THIS WEEK** : 7 ronds (lun → dim), coché quand une dose est enregistrée, étoile sur aujourd'hui,
  pastille « N day streak » avec une flamme.
- Carte **Up next** : prochain créneau (peptide, Today · 8:00, « Last logged · 0,05 mg »), barre « vial at 90 % »,
  gros bouton **Log dose**, ligne « 0 paused · 2 doses logged this month ».
- **At a glance** : Progress photos (prendre / ouvrir la photothèque), Last weigh-in (81,6 kg, « ▲ 0 kg 2 days ago »,
  mini-courbe), Hydration (0 of 64,2 oz, « tap to log »).
- **Your peptides** : une ligne par peptide ajouté, barre de niveau du flacon, bouton **Mix vial** (pas de flacon) ou
  **+ Log** (flacon prêt). « Add Peptide » en pointillés.
- **Today** : les doses du jour avec heure et coche, lien History.

### Stack (flacons)
- Bascule **Stack / Vial History**. Vide : « Mix a vial to start logging » + « Not mixed yet? Try Measure ».
- Carte flacon : nom, **100 %**, barre, « 2,00 mL · mixed 18 Oct », menu « … ».
- **Mix vial** : rappels S M T W T F S (quand on coche un jour : heure + « Next Sunday 18 Oct »), interrupteur
  « Added BAC Water » (cache le champ eau), mg du flacon, mL d'eau, date, coût $ facultatif. Dès que mg et mL sont
  saisis : bandeau **« Every 1 mg is 200 units »**. Save grisé tant que c'est incomplet.
- **La demande de notifications iOS arrive juste après le premier Save avec un rappel** (pas dans le tunnel).
- **Détail du flacon** : dessin, « 1 mg vial · mixed with 2 mL », pastille « Ready to log » puis « 19 doses left »,
  **Remaining 1,90 / 2,00 mL** avec barre, 3 tuiles (Mixed on / Since mixed / 1 mg equals 200 units),
  **LAST 7 DAYS** (dernier site, doses, total mg), bouton Log dose, Edit vial / Mark finished.
- **Vial History** : « N vials completed », « your lifetime record, vial by vial ».

### Log dose (feuille)
- **Gros chiffre** (10 IU ou 0,05 mg) + taille de seringue 30 / 50 / 100 + **règle à glisser** (drag to set amount).
- Bascule d'unité **IU / mg / mL** : la même dose exprimée dans les 3.
- **Now · 1:06** / **Earlier…** (date + heure) / **+ Note** (champ facultatif).
- **Choose injection site** : anneau « 0 doses logged » + liste (Not recorded, Left abdomen, Right abdomen…) avec
  « last used » et compteur par site. Tuiles « Most-used site » et « Logged this week ».
- Pied : « Stats reflect only what you've logged. PepLog is for personal record-keeping and does not provide dosing
  advice. »
- **Edit dose** : mêmes champs, bouton « Save changes ». On peut changer date, heure, dose, site, note.
- Après la 1re dose : fenêtre de **notation** (« 1st DOSE LOGGED — Help someone else find it ★★★★★ »).

### Measure (calculateur)
- Sous-titre « Converts the values you enter ». Carte **Result** : « 20 units measures 1 mg · Based on a U-100
  syringe » + 3 puces « 10 mg vial + 2 mL BAC water → 1 mg ». Calcul **en direct** pendant la saisie.
- Seringue 30 / 50 / 100 en segments, **dessin qui se remplit**, « Exceeds the selected syringe's capacity » si trop.
- 3 champs : Vial contents (mg / mcg), Water added (mL), Your dose (mg / mcg).
- Pied : « Calculations use only the values you enter. Verify with your healthcare provider. »

### Stats
- Bascule **Stats / Photos / Badges**. « Tracking since 12 Oct ».
- **Weight** : 81,6 kg, « no change last 30 days », « 13,6 kg to go », courbe avec ligne « Goal 68 », 7D / 30D / 90D / All.
- **Doses** (this range) : par peptide « 2 doses · 0,1 mg » + barre. « Totals reflect only what you've logged. »
- **Injection sites** : anneau à 2 couleurs + liste (Left abdomen 1, Right abdomen 1).
- **Invested** : « $0 spent », « per dose », « Top vial — Add a vial cost to see it here ».
- **History** : par jour (TODAY, MONDAY 12 OCT), chaque ligne « 0,05 mg · Left abdomen · 01:07 › » ouvre Edit dose.
- **Badges** : 19 badges, « 0 of 19 earned », barre 0 %, « Closest badge ». Groupes : Consistency (One week locked
  1/7, Month of discipline 1/30, Century club 1/100, Year one 1/365, Back on it 0/7), Volume (First vial down,
  Five deep, Ten strong, Full locker 0/25, Broad spectrum 4/5 peptides, Scale keeper 2/10 weigh-ins), Craft
  (Bookkeeper 1/10 logged, Clean sheet 0/20 on time, Site rotation 2/4 sites, Hidden), Photos (First frame,
  Five frames, The long view 0/90 days, Every angle 0/3).

### Photos de progression
- Feuille : **Body photo** (Front · Back) ou **Face photo** (Front).
- Caméra guidée plein écran : silhouette en pointillés, consignes (« Arms straight · palms in · look ahead »,
  « Chin level · neutral expression · hair off face », « Elbows up · feet planted »), outils Flash / Ghost (calque de la
  photo précédente) / Timer / Level / Skip angle, « Front 1 of 2 ».
- Demande caméra iOS avec la phrase « Photos are stored only on this device ». Refus géré : « Open iOS Settings ».
- **Photothèque** : filtres All / Body·Front / Body·Back / Face·Front, Take photo / Import photo, « Poses to start ».

### Profil & réglages
- Compte (prénom, e-mail, photo « saved on this device »).
- **Weight** : unité kg / lb, Goal weight. **Hydration** : unité oz / mL, Daily goal, Check-in reminders.
- **Units & flags** : **Low vial flag** 20 % left (seuil réglable).
- **PepLog Pro** : « Pro is active », Restore Purchases, « Purchases are handled by the App Store on this device ».
- **Account** : Signed in as, Sign Out, **Delete Account** (« removes your sign-in details from our servers. Entries
  on this device stay on this device »).
- **Progress photos** : Photo day reminder. **Manage** : Peptides Logged, Your Vials.
- **Medical disclaimer** (texte complet) et **Your data** (texte complet : entrées sur l'appareil, pas d'analytique
  sur les doses).
- **About** : Version 1.4.2 (16), Contact Support, **Support ID** (à copier, « share it only if you contact support
  about a purchase »).

## 3. Face à PeptideScanner : ce qu'on a déjà, ce qui manque

| Fonction PepLog | Chez nous aujourd'hui | Verdict |
|---|---|---|
| Salutation + date | Titre « Aujourd'hui » + date | À ajouter (prénom du profil) |
| Bandeau semaine (7 ronds) | Non | À ajouter, **sans flamme ni compteur de série** (décision 15/10) |
| Carte « Up next » + gros bouton | Carte « Vos injections » : liste des créneaux + « Marquer comme faite » | On a mieux (6 états) ; ajouter la ligne « flacon à N % » |
| Dernière pesée + écart | Dernier poids seul | Ajouter l'écart et « il y a N jours » |
| Hydratation | Non | À ajouter en option (désactivée par défaut) |
| Liste des peptides avec barre de flacon | Carte « Cure en cours » (la première seulement) | À ajouter : toutes les cures actives, barre du flacon lié, bouton |
| « Today » avec coche + History | Dans la carte principale | Déjà fait ; ajouter le lien Historique |
| Bouton « + » (3 actions) | Non | À ajouter dans la coque commune |
| Thème clair/sombre dans l'en-tête | Dans le profil seulement | À ajouter dans l'en-tête |
| Flacon : « 1 mg = 200 unités » | Non | À ajouter (fiche flacon + formulaire en direct) |
| Flacon : % restant en texte | Barre + ml + mg, pas de % | Ajouter le % |
| « N doses restantes » | « ≈ d jours · n injections » si dose et fréquence saisies | Reprendre la dose de la cure liée quand `idose:` manque |
| « Last 7 days » sur le flacon | Non | À ajouter |
| Mark finished | Via le formulaire de modification | Bouton direct + confirmation |
| Vial History (terminés à part) | Mélangés à la liste | Bascule « En cours / Terminés » |
| Coût du flacon, « Invested » | Non | À ajouter en option, mot « Dépenses », jamais « investissement » |
| Rappels par jour de semaine | Oui (planning de la cure, heures) | Déjà fait, plus complet |
| Demande iOS au moment utile | Interrupteur général des rappels | Déjà fait |
| Log dose : gros chiffre, IU / mg / mL | Dose fixe de la cure ; quantité seulement en « Partiel » | Ajouter la quantité réelle sur « Fait » + équivalents U et ml d'après le flacon lié |
| Règle à glisser | Non | Non retenu (saisie au clavier plus précise) ; proposer des boutons −/+ par pas |
| Earlier… (date + heure) | Heure oui ; date via le calendrier de la cure | Déjà fait (cure) ; ajouter un raccourci |
| Note facultative | Oui (accueil) | Déjà fait ; l'ajouter dans la feuille de la cure |
| Choix du site + « last used » + compteur | Rotation automatique, pas de choix | **À ajouter** : liste des sites, suggestion = rotation, compteur, modifiable après coup |
| Stats : doses par peptide sur période | Par cure : saisies / prévues, états | Ajouter nombre et total mg par cure, période 7/30/90/tout |
| Stats : anneau des sites | Non | À ajouter (SVG maison) |
| Stats : historique par jour, modifiable | Verrouillé « Premium » | À rendre **gratuit** (décision : l'essentiel est gratuit), lignes modifiables |
| Poids : objectif + « to go » | « Sans objectif imposé » | Objectif **facultatif**, affichage neutre (« écart ») : à trancher |
| Poids : variation sur la période | Non | À ajouter |
| Poids en lb | kg seulement | À ajouter (marché US) |
| Badges (19) | Non | Version **carnet** (décision 15/10) : à jour 7 / 30 jours, rotation des sites, pesées régulières, export… Jamais « 100 doses », « 5 peptides » |
| Photos de progression (caméra guidée, Ghost) | Non | Version 1 **sur le téléphone seulement**, sans calque ni silhouette (caméra du système) ; silhouettes et Ghost plus tard |
| Measure : calcul en direct, phrase « 20 U = 1 mg » | Bouton « Calculer », 3 valeurs | Ajouter le direct et la phrase ; garder cartouche, zoom, seringue plus grande (on a plus) |
| Measure : mg / mcg | mg seulement | Ajouter mcg |
| Profil : unités | Non | À ajouter (kg / lb, oz / ml) |
| Profil : seuil « flacon bientôt vide » | 20 % fixe | Réglable 10 / 20 / 30 % |
| Profil : disclaimer + « vos données » | Non (page avertissement à part) | Ajouter les deux textes |
| Profil : version, support, Support ID | « v1.0 » fixe ; pas de support | Version réelle, e-mail de support, identifiant court |
| Demande de notation | Non | Plus tard (extension native), jamais après la 1re dose |
| Streak / flamme | Non | **Non** (décision) |
| Badges « Century club », « Broad spectrum » | Non | **Non** : récompensent la consommation |
| « Investment », photos avant/après torse nu | Non | **Non** : ton promotionnel |

## 4. Ce que PepLog fait moins bien que nous (à garder)
- Une seule dose par flacon, pas de cure avec durée, pas de 6 états (partiel, manqué, repos, reporté).
- Pas de stylos (préremplis / rechargeables), pas de cartouche dans le calculateur.
- Pas de bibliothèque documentaire.
- Pas de synchronisation : perdre le téléphone = perdre le carnet. Chez nous le carnet est en ligne.
- Hydratation affichée en oz alors que l'objectif a été saisi en mL (bug d'unité).
