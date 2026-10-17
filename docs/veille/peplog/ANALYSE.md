# PepLog — analyse du tunnel d'accueil (18/10/2026)

Captures de James du 16/10/2026 (voir `00_INDEX.md`). Essai pris le 16/10 : 3 jours gratuits, puis 34,99 €/an
à partir du 19/10/2026. Pour ne pas être prélevé : annuler au moins 24 h avant, donc avant le 18/10 vers 23 h 20
(Réglages → nom → Abonnements → PepLog).

## 1. Le tunnel, dans l'ordre réel (15 écrans)
| # | Écran | Ce qu'il fait |
|---|---|---|
| 1 | Accueil (02) | Logo, promesse « Every investment tracked. », carte d'exemple « Up next » animée |
| 2 | About you (03) | Prénom + date de naissance, avec la raison affichée : vérification 18+, utilisée une seule fois |
| 3 | Choix des peptides (04-05) | Recherche + liste de 68 entrées, on coche, bouton « Continue · N selected » |
| 4 | « You built your stack! » (14) | Petite célébration avec les flacons choisis |
| 5 | Point de départ (16) | Poids actuel + objectif, bascule lb / kg |
| 6 | « Goal is set! » (17) | Courbe de poids marquée « Example » (descendante) |
| 7 | Hydratation (18-19) | Objectif d'eau par jour, oz / mL, « Skip for now » |
| 8 | Investment (20) | Dépense mensuelle estimée en $, « Skip for now » |
| 9 | Avertissement (23 puis 21) | « Outil de suivi, pas un dispositif médical, aucune recommandation de dose » ; case obligatoire, bouton grisé avec la phrase « Accept the terms to continue » |
| 10 | « Dashboard's ready James » (22, 24) | Aperçu de SON tableau de bord rempli avec ce qu'il vient de saisir |
| 11 | Essai gratuit (25) | « We want you to try PepLog Pro for free » + 8 tuiles « Everything included » |
| 12 | Paywall (26) | Frise 3 jours + mensuel / annuel + bouton + phrase de prix + liens |
| 13 | Fenêtre Apple (27) | 34,99 €/an après 3 jours d'essai |
| 14 | Compte (28) | APRÈS l'achat : Apple, Google ou code par e-mail ; « vos données restent sur cet appareil pour l'instant » |
| 15 | Accueil réel (29) | Semaine, « Up next », photos, poids, hydratation, barre 4 onglets + bouton « + » |

Pas de demande d'autorisation de notifications vue dans le tunnel.

## 2. Ce qui est bien fait (à reprendre)
- Barre de progression + flèche retour sur chaque écran ; « Skip for now » sur les étapes facultatives.
- La raison de chaque question est donnée (« utilisée une fois pour vérifier les 18 ans »).
- Avertissement court, clair, avec une VRAIE case à cocher, bouton grisé tant qu'elle n'est pas cochée, et une
  phrase qui explique pourquoi. C'est exactement notre écran : on est déjà au niveau.
- Aperçu du tableau de bord avec les données de la personne AVANT le paywall : elle voit ce qu'elle obtient.
- Unités au choix dès le tunnel (lb / kg, oz / mL) : utile pour le marché US.
- Paywall (vu le 16/10, confirmé) : prix en euros cohérents avec la fenêtre Apple, mensuel converti en prix
  annuel (119,88 €) à côté de l'annuel 34,99 € avec badge « SAVE 71 % », « 2,91 €/mo » en équivalent,
  phrase claire sous le bouton (« 3 jours gratuits, puis 34,99 € par an. Résiliable à tout moment dans
  Réglages »), liens Restore / Terms / Privacy, bouton visible sans défiler.
- Compte créé APRÈS le paiement, avec Apple / Google / code e-mail (pas de mot de passe) : moins de friction.

## 3. Défauts repérés (à éviter)
| Défaut | Pourquoi c'est un problème |
|---|---|
| Pastille « $0 FOR 3 DAYS » alors que tous les prix sont en euros | Incohérence de monnaie, à éviter chez nous (prix et monnaie tirés de l'offre du store) |
| Étape 2 de la frise avec une cloche (« Day 2 First progress photos ») | La cloche fait penser à un rappel qui n'existe pas ; confirme notre choix d'une autre icône |
| Pas de croix de fermeture sur le paywall (seulement la flèche retour) | Proche du « paywall dur », mal vu |
| Mensuel sans essai (« Billed today · no free trial ») | Pousse vers l'annuel ; acceptable mais à dire clairement si on le fait |
| Séries (« 0 day streak » avec flamme) et « Streaks & badges » | Ludification que nous avons écartée (pas de série, badges « carnet à jour » seulement) |
| Courbe d'exemple de poids qui descend + objectif de poids dès le tunnel | Pousse vers la perte de poids ; sujet sensible |
| Écran « Investment » (dépense en $) et slogan « Every investment tracked » | Présente les produits comme un placement ; ton promotionnel |
| Captures de la fiche App Store avec photos torse nu (avant / après) | Image « transformation physique », loin de notre ton documentaire |
| Hydratation affichée « 64,2 oz » à l'accueil alors que 1900 mL a été choisi | Petit bug d'arrondi d'unité |
| Calculateur « Measure calculator » rangé dans Pro | Chez nous le calculateur reste gratuit (décision à confirmer avec la grille Premium) |

## 4. Ce qu'on en tire pour notre tunnel (lot « tunnel », plus tard)
1. Garder notre avertissement avec case (déjà fait) et ajouter la phrase sous le bouton grisé.
2. Ajouter l'aperçu « votre tableau de bord est prêt » avec les données saisies, juste avant l'offre.
3. Unités dès le tunnel : lb / kg (et heure 12 h / 24 h selon le téléphone).
4. Paywall : reprendre la structure de PepLog (frise, deux offres, équivalences, phrase de prix, 3 liens),
   AVEC une croix visible, une seule monnaie partout, et l'icône d'étape 2 sans cloche.
5. Pas de séries, pas d'objectif de poids imposé, pas d'écran « dépense ».
6. Question ouverte : compte avant ou après le paiement. Chez nous les données sont en ligne (Supabase),
   donc le compte doit exister pour enregistrer quoi que ce soit ; à trancher avec la réponse de ChatGPT.
