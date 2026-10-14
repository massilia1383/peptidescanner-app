# Note de reprise — 15 octobre 2026 (Bangkok)

Suite de `note_reprise_2026-10-15_nuit.md` (lot 2, poussé sur `beta`, commit c9485c2).

## Décisions de James
- **Xcode est installé** sur son Mac.
- **RevenueCat et les prix : plus tard.** Un prompt a été donné à James pour croiser l'offre (prix, essai gratuit,
  séparation gratuit/Premium, concurrents) avec ChatGPT ; il rapportera la réponse.
- **Tunnel d'arrivée avec questions + écran d'abonnement : plus tard.** D'où un lot 3 réduit à l'écran d'avertissement.
- On enchaîne les lots, test global à la fin.

## Lot 3 — fait (sur la branche `beta`)

**A. `avertissement.html` (nouveau)** — premier écran après connexion : outil d'information, pas de conseil
médical ni de dose, réglementation selon les pays, vérifier ses valeurs, données de santé jamais vendues.
Case obligatoire « 18 ans ou plus + compris + j'accepte que mes données de suivi soient enregistrées »
(consentement explicite RGPD art. 9). Accord enregistré sur le compte (`user_metadata.disclaimer_accepted_at`,
`disclaimer_version: 1`), **sans SQL**. `dashboard.html` y renvoie tant que l'accord manque → **le compte démo de
James passera une fois par cet écran.** Bouton « Se déconnecter » pour qui refuse. Conçu pour devenir le 1er écran
du futur tunnel.

**B. Inscription (`login.html`)** — case obligatoire « J'ai 18 ans ou plus et j'accepte les CGU et la Politique de
confidentialité », placée au-dessus du bouton ; message si elle n'est pas cochée.

**C. Pages légales réécrites** (`cgu.html`, `privacy.html`, `mentions-legales.html`) + feuille commune `legal.css` :
- design Carnet, mode sombre, tableaux qui défilent dans leur cadre → **fin du débordement des mentions** ;
- retirés : Lemon Squeezy, garantie 30 jours, prix en dur, boutiques et liens affiliés, conseiller IA (Anthropic),
  « données dans le téléphone », version web/PWA, newsletter, analytics ;
- ajoutés : éditeur **Rivage Labs** (micro-entreprise), abonnement via App Store / Google Play (renouvellement,
  résiliation, remboursement, restauration), **RevenueCat** comme sous-traitant (à garder en phase avec le futur
  lot), notifications locales, consentement explicite santé, suppression de compte dans l'appli, médiateur de la
  consommation ;
- **à compléter par James** (surlignés « [À compléter] ») : nom et prénom de l'entrepreneur, SIRET, adresse,
  directeur de la publication, médiateur de la consommation (obligatoire en France pour vendre à des particuliers),
  adresse postale de Vercel ; vérifier la région d'hébergement Supabase et l'existence des adresses
  contact@ / privacy@peptidescanner.app ;
- pages en **français seulement** (version anglaise à prévoir avec le petit site) ;
- **textes rédigés sans avis juridique : à faire relire avant publication.**

**D. Finitions** — un seul lien « Pages légales » (vers les CGU) dans les 9 tiroirs ; Poids : « mesures sur la
période » (BUG-06) ; Profil : les messages de confirmation disent « Expérience / Prénom / Objectif » traduits
(plus « Âge »).

**Divers** — `lang.js` : 11 clés ajoutées dans les deux blocs → 1027 FR / 1027 EN, 0 doublon.
`scripts/build-www.sh` : + `avertissement.html`, `legal.css`. `sw.js` cache v1.4. `CLAUDE.md` mis à jour.

## Vérifications faites
- 0 erreur JavaScript ; parité FR/EN ; pas de doublon.
- 15 pages × 3 largeurs × clair/sombre × FR/EN = 180 combinaisons : 0 erreur, 0 débordement (mentions comprises),
  0 requête vers Internet, 0 clé brute.
- Parcours simulé : accueil sans accord → avertissement ; bouton grisé tant que la case n'est pas cochée ;
  Continuer → accueil. Inscription sans case → message ; avec case → écran « Vérifie tes emails ».
- Contrôlé à l'œil : avertissement (clair/sombre), inscription, confidentialité en sombre. Chevauchement du
  sélecteur de langue sur le logo de l'avertissement corrigé.

## Reste à faire
1. **James** : commit + push du lot 3 sur `beta`.
2. **James**, quand il veut : les deux SQL, la fonction `delete-account`, les adresses de redirection Supabase,
   et les « [À compléter] » des pages légales.
3. Lot suivant possible sans attendre les prix : installation Capacitor sur le Mac (Node 22, CocoaPods,
   Android Studio), `npm install`, `npx cap add ios/android`, icônes, écran de démarrage, simulateur.
4. Après réponse ChatGPT : prix → RevenueCat → tunnel d'arrivée avec écran d'abonnement.
5. Test global.
