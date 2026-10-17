# PeptideTrack — analyse de l'intérieur de l'appli (18/10/2026)

64 captures de James (18/10, 01:49-02:10), PeptideTrack 1.1.8 (137), essai Pro. Index : `interieur/00_INDEX.md`.
Le tunnel est traité dans `../../claude/Analyse_Tunnel_PeptideTrack.md` (projet Claude) et ses captures dans `./`.
Avis de James : appli difficile à utiliser, police trop petite, « je n'aime pas du tout ». Le relevé ci-dessous
sert à savoir ce qu'ils FONT, pas à les copier.

## 1. Comment PeptideTrack est construit
- **4 onglets + bouton « + »** : Home, Schedule, Health, Chat. Et un **menu latéral** (hamburger) de 15 entrées
  en 4 groupes : Suivi, Santé, Analyse, Outils. C'est beaucoup : la même fonction est accessible par 2 ou 3
  chemins, et le menu cache la moitié de l'appli.
- **Tout en noir et blanc** (« couleur d'accent : Mono » par défaut), textes gris très petits, beaucoup
  d'anglais dans les écrans français (« Needs attention », « Check-in saved », listes de réactions en anglais).
- **Le « compound » est au centre** (pas le flacon comme PepLog, pas la cure comme nous) : on programme des
  doses (Schedule dose) pour un composé, et on les enregistre depuis la carte du corps ou l'accueil.
- **Données sur le téléphone**, pas de synchronisation (FAQ : « Pourquoi mes données ne se synchronisent-elles
  pas entre appareils ? »). Compte Apple seulement pour la communauté. Chat IA via Anthropic (données envoyées
  à chaque message).

## 2. Inventaire écran par écran

### Accueil
- Bandeau noir « Testostérone overdue · 14m late » (en retard de 14 minutes : pression inutile).
- Tuiles « Prochaine dose » (compte à rebours) et « Niveau de peptide actif » (estimation par demi-vie).
- **Grille de la semaine par peptide** : une ligne par composé, 7 cases (Terminé / Prévu / Aucun). Bonne idée,
  plus lisible qu'une liste quand on suit plusieurs produits.
- Accès rapide : Calculateur, Zones d'injection.
- Visite guidée en 9 cartes (« Your day at a glance »), passable.
- Réglage « Disposition de l'accueil » : on choisit les 5 cartes affichées.

### Santé (onglet)
- **Poids** : actuel, variation, hebdomadaire, objectif, courbe 1W → Tout, « Log weight ».
- **Bilans quotidiens** : 5 humeurs (Faible → Au top), « Gérer ce que vous suivez » (on choisit les mesures),
  notes. Un bilan par jour, historique. Alimente le « score de protocole ».
- **Effets secondaires** : liste de ~45 réactions (nausée, maux de tête, réaction au site, bouffées de chaleur,
  perte de cheveux, hypoglycémie…) + réaction personnalisée ; peptide associé, date, heure, gravité Léger / Modéré /
  Sévère, notes ; vue « Récents » et « Par peptide ».
- **Compléments** : ~40 compléments classés (oméga, acides aminés, adaptogènes, autres) + nom libre, unité
  (mg, g, ml, capsule), fréquence Quotidien / Jours précis / Au besoin.
- **Zones d'injection** : **silhouette face / dos** avec points colorés (Récent 0-2 j, Au repos 3-7 j, Libre),
  **« Prochaine zone suggérée »**, mode « zone personnalisée » (toucher le corps), journal des injections.
  Feuille « Enregistrer une injection » : zone, peptide, quantité MCG / MG / IU, date, heure, **réaction**.
- **Mesures corporelles** : taille, poids, masse grasse, masse maigre, FC au repos, HRV, tension, glycémie, tour
  de taille, sommeil, hydratation, protéines ; **6 calculateurs** (IMC, TDEE, déficit calorique, protéines,
  hydratation, reconstitution) ; bandeau Apple Health.
- **Analyses de sang** : import d'un PDF ou saisie manuelle, « alertes hors plage », biomarqueurs.
- **Niveaux de peptides** : courbe de concentration estimée (demi-vie) après enregistrement d'une dose.

### Analyse
- **Analyses par IA** : **« Protocol score 25 / 100 · Needs attention »**, 3 sous-notes (Adherence, Biomarqueurs,
  Énergie), observance sur 7 jours, « What changed this week », « Detected patterns », « Key findings » (« 100 %
  missed »), « Insight readiness », « Smart next actions », méthodologie.
- **Chat** (voir § 3).
- **Niveaux de peptides** (ci-dessus).

### Chat IA — ce que James a obtenu (captures 33 à 42)
- Modèle : **Claude (Anthropic)**, déclaré par l'IA elle-même et dans « À propos du chat ». Les données du carnet
  sont envoyées à Anthropic à chaque message (interrupteur « Partager mes données avec le chat » dans les réglages).
- Suggestions d'accueil : « How do I reconstitute my 5 mg Testostérone vial? », « What is Testostérone studied
  for? » : l'IA propose spontanément de parler de la testostérone.
- À la question « Retatrutide », la réponse contient **« doses ranging 1 to 12 mg weekly subcutaneous »** : une
  fourchette de doses, tirée d'un essai clinique, mais affichée dans une appli grand public. Leur propre
  avertissement l'admet (« dosing ranges… for reference only »). C'est exactement ce qu'on refuse.
- Erreur de contexte : après la réponse sur le rétatrutide, le bouton propose « View **Semaglutide** in Library ».
- L'IA dit ne pas pouvoir faire de recherche Internet et que « sa connaissance s'arrête à avril 2024 » : elle
  cite donc des études de mémoire, sans vérification.
- Questions de James sur la confidentialité et sur l'App Store : réponses prudentes, renvoi à l'éditeur.
- Ce qui est bien fait : les limites sont explicites (pas de dose « 250 ou 500 mcg », pas de diagnostic, pas de
  combinaisons, urgences refusées), page « À propos du chat » claire, interrupteur de partage des données.

### Réglages (très complets)
- Compte : Abonnement (« Trial · 1 days left »), Restaurer les achats, **Utiliser un code** (promo / offre),
  Se connecter avec Apple (communauté seulement).
- Apparence : Thème, **Couleur d'accent**, **Taille du texte**, **Disposition de l'accueil** (5 cartes au choix),
  Grouper la liste des peptides.
- Langue et région : Langue, **Format horaire 12 h / 24 h**, Fuseau, **Unités Impérial / Métrique**, **Début de la
  semaine**, **Devise**.
- Notifications et chat : Gérer les notifications (3/3), Partager mes données avec le chat, Effacer la
  conversation, À propos du chat.
- Données et confidentialité : Apple Health, **Exporter le rapport** (PDF ou CSV, période, 6 cases à cocher dont
  « Infos patient »), **Télécharger toutes les données (CSV)**, **Importer des données (CSV)**, **Verrouillage
  biométrique**, Utilisateurs bloqués.
- Aide : Demandes de fonctionnalités (« Tout est livré »), Proposer une fonctionnalité, **Questions fréquentes**
  (13 questions dans l'appli).
- À propos : version et build, texte, Assistance (e-mail), site, réseaux sociaux.
- **Suppression** : « Supprimer toutes les données » et « Supprimer mon compte », encadré rouge, rappel que
  l'abonnement Apple est distinct, **taper DELETE**, lien « Exporter d'abord », « effective sous 30 jours ».

### Légal
- « Conditions d'utilisation » dans l'appli = **contrat standard d'Apple** (comme PepLog).
- Avertissement médical = page web, 7 parties ; admet des « dosing ranges » dans l'appli ; a une partie
  « Community content ».
- Site avec Changelog, FAQ, Calculators, DMCA, Community Guidelines.

### Communauté
Fil de posts (Tendances, Récents, Enregistré, Expérience, **Combinaisons**), pseudo, 18+, connexion Apple,
utilisateurs bloqués. Un onglet « Combinaisons » dans une communauté sur des produits non approuvés : c'est le
genre de contenu qu'Apple et Google surveillent (règle 1.4, « conseils de dose à autrui » interdits par leurs
propres règles communautaires).

## 3. Ce qu'on retient (à adapter, jamais copier)
| Idée | Verdict pour nous |
|---|---|
| Silhouette face / dos avec points colorés et « prochaine zone suggérée » | **Oui**, c'est la meilleure chose de l'appli ; chez nous : SVG maison, 10 sites, suggestion = rotation, journal par site |
| Grille de la semaine par cure (7 cases) | **Oui** sur l'accueil quand il y a plusieurs cures, à la place d'une liste |
| Effets ressentis liés à une injection (gravité, notes) | **Oui**, version sobre : « ressenti » attaché à une injection ou à un jour, liste courte + libre, jamais « par peptide » comme un classement |
| Bilan quotidien (humeur en 5 niveaux + notes) | **Oui**, c'est notre « journal des ressentis » prévu (décision 15/10), 1 appui par jour |
| Compléments (liste + fréquence) | **Plus tard** : notre lot « vitamines et compléments » le couvre mieux (cure = produit, unité, boîte) |
| Rapport PDF avec cases à cocher et période | **Oui**, c'est notre « PDF pour consultation » ; sans case « infos patient » par défaut |
| Export CSV complet + **import CSV** | **Oui** : export CSV en plus du JSON ; import = reprise depuis un autre carnet, utile pour les gens qui viennent de chez eux |
| Verrouillage biométrique (Face ID) | **Oui**, simple avec Capacitor ; option éteinte par défaut |
| Taille du texte, début de semaine, 12 h / 24 h, unités | **Oui** : taille = on suit le réglage du téléphone (déjà), les autres en réglages |
| Couleur d'accent au choix | **Non** : une seule identité (cobalt) |
| Devise | **Oui** si on garde « Dépenses » : € / $ / £ selon la langue, modifiable |
| Suppression : taper DELETE, « exporter d'abord », abonnement distinct | **Oui** pour les deux suppressions |
| Questions fréquentes dans l'appli | **Oui**, 10 questions, hors ligne |
| Utiliser un code promo | **Plus tard** (RevenueCat le permet) |
| Mesures corporelles (12 mesures, HRV, tension…) + Apple Health | **Partiel** : poids + tour de taille + 2-3 mesures au choix ; Apple Health plus tard ; pas de calculateur IMC / TDEE / déficit (jugement sur le corps, hors sujet) |
| Analyses de sang (import PDF) | **Plus tard**, version simple (valeur, unité, date, labo), sans « alertes hors plage » (interprétation médicale) |
| Niveaux de peptides estimés | **Non** pour les produits de recherche (décision 15/10) ; peut-être plus tard pour les GLP-1 autorisés |
| Score de protocole / 100, « Needs attention », « 100 % missed » | **Non** : note qui juge ; chez nous un bilan hebdomadaire neutre |
| Bandeau « overdue 14m late » | **Non** : pas de culpabilisation ; notre créneau passe à « non renseigné », sans minutes de retard |
| Chat IA | **Non** (décision 15/10) ; peut-être un assistant documentaire plus tard, sans accès aux données |
| Communauté, « Combinaisons » | **Non** |
| Testostérone au catalogue | **Non** |
| Menu latéral à 15 entrées | **Non** : 5 onglets + profil suffisent ; on range les nouveautés dans « Suivi » |

## 4. Les défauts à ne pas reproduire
- Mélange français / anglais sur presque chaque écran (listes de réactions, toasts, titres).
- Police très petite, gris sur beige, tout en noir et blanc : fatigant.
- Deux ou trois chemins vers la même fonction (menu latéral + onglets + accès rapides).
- Le chat donne des fourchettes de doses et propose spontanément des sujets « testostérone ».
- Compte à rebours et « en retard de 14 minutes » : stress inutile pour un carnet.
- Score / 100 et « Needs attention » dès le premier jour avec 0 donnée.
