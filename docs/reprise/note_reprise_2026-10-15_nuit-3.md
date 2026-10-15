# Note de reprise — 15/10/2026, nuit (3) — tests, concurrence, tunnel

## Où on en est
- Branche `beta` : commit `c945b17` poussé (refonte Clarté reprise du kit sur toutes les pages, onboarding,
  premium). L'iPhone a la nouvelle version (James a supprimé puis réinstallé l'appli).
- Rien n'a été codé depuis. Aucun fichier de l'appli modifié dans cette séance.

## Méthode de test (définitive, dans les instructions du projet)
- Procédure TECHNIQUE de James : clone GitHub, `npm ci --ignore-scripts`, `npx vite --host 127.0.0.1 --port 5173`,
  Playwright + /opt/pw-browsers/chromium, iPhone 16 Pro Max 440 px ×3, réseau bloqué, Supabase simulé avec des
  données gardées dans la mémoire du navigateur, UNE capture d'abord puis accord.
- Claude ne prend jamais la main sur le Mac ni l'iPhone pour tester (pas de computer use).
- Copie : `claude/Procedure_Test_TECHNIQUE.md`. À ajouter au CLAUDE.md du dépôt avec le prochain lot.
- Résultat du test complet du 15/10 (beta c945b17) : 3 parcours (compte neuf → accueil 2 étapes → cure → mode
  sombre ; actions du quotidien ; 14 pages FR/EN clair/sombre) : 0 erreur, 0 appel réseau sortant.

## Retours de James à coder (prochain lot)
1. « Seringue » → « Seringue à insuline » (accueil étape 1 et ailleurs).
2. Bouton « Dupliquer » dans les réglages de CHAQUE cure (en cours ou terminée) : nouvelle cure préremplie
   (dose, fréquence, jours, horaires, durée, administration, matériel), nom « … (copie) », début = aujourd'hui,
   flacon lié non recopié.
3. Alerte quand une injection dépasse le stock du flacon (vu au test : TB-500 0,8 mg → 0 sans avertissement).
4. Calculateur GARDÉ, renommé « Conversion des valeurs saisies » / « Equivalence calculated from your entries ».
5. Badges liés au carnet (« Votre carnet est à jour cette semaine » ; repos et pauses comptent ; aucun point par
   injection).
6. Page Premium : retirer « Export de vos données » (l'export reste gratuit).
7. CGU : ajouter « vérifiez chaque résultat du calculateur », « en cas d'urgence appelez le 15 / 112 »,
   « aucune vente de données ni entraînement d'IA » ; confidentialité : fuite signalée sous 72 h.
8. Plus tard : cure sans date de fin, pause / reprise, masquer le poids, cacher le réglage « fuseau ».

## Décisions prises ce soir
- Marché prioritaire : ANGLAIS, États-Unis d'abord, puis Royaume-Uni et Australie ; ensuite Europe (français, puis
  allemand et espagnol). Conséquences : anglais par défaut, poids en lb, prix en dollars, pages légales US.
- Calculateur conservé (précédents vérifiés : PepLog et PeptideTrack, publiés par des personnes seules).
- IA qui propose doses / protocoles : non. Assistant documentaire : peut-être plus tard.
- Courbes de niveaux estimés : plus tard, seulement pour médicaments aux données publiées.
- Règle Apple 5.1.1(ix) (santé = société) : James n'en tient pas compte (les concurrents sont des personnes).
- Statut « trader » DSA validé par Apple le 15/10 : coordonnées publiques sur l'App Store européen.
- Petit site légal : 5 pages en anglais d'abord (Terms of Use, Privacy Policy, Medical Disclaimer, Account Deletion,
  Support) ; on garde le contrat standard d'Apple (EULA) et on ajoute nos Terms.

## Documents créés ce soir (projet Claude, dossier claude/)
- `Analyse_Brainstorming_Concurrence.md` : rapport ChatGPT recoupé, tableaux, décisions, marché US.
- `Veille_Pages_Legales_Concurrents.md` : pages légales de Protocol (IMA), Peptide Tracker, PepLog,
  Protocol: Peptides, PeptideTrack (5 pages).
- `Analyse_Tunnel_PeptideTrack.md` : leur tunnel en 18 écrans (40 captures de James), bons points, défauts,
  notre tunnel proposé, prix comparés.
- `Procedure_Test_TECHNIQUE.md`.

## À faire par James
- ANNULER l'essai PeptideTrack au plus tard le 17/10 (sinon 44,99 €/an le 18/10) :
  Réglages → nom → Abonnements → PeptideTrack.
- Tester Protocol (IMA, 14 jours sans carte annoncés) et PepLog (3 jours, annuel 34,99 €, annuler le jour même),
  captures nommées `Protocol_14`, `PepLog_14`… selon la liste de ChatGPT.
- Envoyer à ChatGPT le message « tunnel idéal » préparé par Claude ce soir, puis rapporter sa réponse.
- Remplir les mentions [À compléter] (CGU 5, confidentialité 2, mentions légales 7).
- Vérifier quelles coordonnées sont publiques sur App Store Connect (statut trader DSA).

## Prochaine séance (ordre proposé)
1. Lire la réponse ChatGPT sur le tunnel, la recouper, écrire le tunnel final (anglais d'abord).
2. Présenter la liste complète du lot (retours 1 à 7 + tunnel + anglais par défaut + lb), fichier par fichier,
   attendre le go.
3. Coder, tester avec la procédure TECHNIQUE, une commande de commit sur beta.
4. Ensuite : prix en dollars et RevenueCat, petit site légal anglais, Dynamic Island.
