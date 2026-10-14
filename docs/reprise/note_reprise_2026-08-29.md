# Note de reprise — 29 août 2026

*Copie dans le dépôt, le 14/10/2026, de `claude/Note_Reprise_29aout2026.md` (projet Claude). Contenu inchangé.*

## Où on en est

**L'application connectée est entièrement migrée vers « Carnet de protocole ».**
Onze pages, zéro couleur de l'ancienne palette. Il reste les huit pages publiques.

| Migré (11) | Reste (8) |
|---|---|
| accueil, cure, poids, stock, alertes | index (landing), login, onboarding |
| profil, analyse, calculateur, boutiques | demo, lemon-checkout |
| bibliothèque, conseiller IA | cgu, mentions-légales, privacy |

Les huit pages restantes totalisent **153 couleurs de l'ancienne palette**. Le plan de
migration prévoit qu'elles passent en dernier, et la landing pose des questions qui ne
sont pas techniques (voir « À trancher »).

## Ce qui a été fait ce jour

### Cohérence des chiffres
- « Injections faites » ne compte plus que les créneaux prévus réellement couverts.
  Une injection hors planning non rattachée a sa propre ligne **Hors planning**.
  Avant : 3 faites + 2 manquées pour 4 attendues.
- « Injections restantes » compte les créneaux à venir, plus la soustraction des faites.
- L'accueil refaisait ces calculs dans son coin et affichait **3 / 4 et 75 %** là où la
  page Cure affichait 2 / 4 et 50 %. Les deux partagent maintenant le même code.
- « Jours restants » : trois affichages, deux formules. L'accueil calculait
  `durée − numéro du jour` (1 j) quand la page Cure et l'alerte comptaient les jours
  jusqu'à la date de fin (2 j). Aligné sur la seconde.

### Mise en page
- Trois paliers de largeur partout : mobile pleine largeur, 720 px tablette,
  1100 px bureau. Les pages étaient bloquées à `max-width: 480px`.
- Deux colonnes sur bureau : Cure (calendrier dominant à gauche), Poids (graphe à
  gauche, saisie et IMC à droite), Accueil, Alertes.
- Les feuilles modales restaient collées en bas sur grand écran, bouton de validation
  hors écran. Centrées dès 768 px, défilement interne, fermeture par Échap.
- Le bouton flottant recouvrait la dernière carte : il sort de la colonne au-delà de
  1280 px.

### Palette et langue
- **200 couleurs** de l'ancienne palette remappées sur les jetons, y compris celles
  écrites en dur dans le JavaScript (flacon de la page Stock, pastilles, légende du
  calendrier, seringue du calculateur).
- `calculateur.html` portait 28 attributs `data-i18n` **sans jamais charger `lang.js`** :
  aucune de ses étiquettes n'était traduite.
- **35 clés manquaient au bloc anglais** — la page Analyse retombait silencieusement
  en français. Parité rétablie : 1000 clés de chaque côté.
- Des expressions `${t('clé')}` étaient écrites dans du HTML statique et s'affichaient
  telles quelles (`${t('disclaimer_title')}` en haut du calculateur).
- Deux libellés affichaient leur clé brute : `analytics_period`, `calc_subtitle`.
- La détection automatique de la langue **fonctionne déjà** (testée sur quatre
  navigateurs) : anglais → anglais, allemand ou espagnol → anglais, français → français.

### Décisions de design appliquées
- **Titres courts** dans la topbar, repris des libellés de la navigation basse :
  Cure, Poids, Stock, Profil, Boutiques, Bibliothèque. Le sélecteur FR/EN reste
  textuel dans la topbar, conformément à la charte.
- Le rouge est réservé aux vrais problèmes. L'IMC « Obésité » passe en terre cuite,
  une perte de poids s'affiche en vert (l'accueil faisait l'inverse de la page Poids).
- « Plus » est marqué actif sur les pages qui vivent dans le tiroir.

## Défauts trouvés et non corrigés

**`profil.html` — le champ « Âge » affichait le niveau d'expérience.** La table
`profiles` n'a pas de colonne `age`, elle a `experience`. Le libellé a été corrigé en
« Expérience » plutôt que d'inventer une donnée. Si tu veux un vrai âge, il faut une
colonne, donc du SQL.

**`lang.js` contient des clés en double.** 99 dans le bloc FR, dont une section
ANALYTICS entière recopiée trois fois avec des valeurs anglaises au milieu. JavaScript
garde la dernière définition, donc le fichier fonctionne — mais corriger une traduction
dans la première copie n'a aucun effet. Piège à nettoyer un jour, avec vérification.

**Le flacon de la page Stock reste un objet en volume** — dégradés, reflet, ombre portée —
dans un système qui dit « trait plutôt que masse ». Il est aux bonnes couleurs mais
pourrait être redessiné à plat.

**Le code promo `PEPTTRACK15`** sur la page Boutiques porte encore l'ancien nom de marque.
C'est de la donnée, à changer dans l'interface.

**BUG-09** — `saveNote()` dans cure.html écrit dans localStorage, les notes de journée
ne sont pas synchronisées. Demande une colonne, donc du SQL.

**BUG-11** — il reste des `new Date(start_date)` qui parsent en UTC et décalent d'un
jour selon le fuseau. Corrigés sur accueil et cure, à vérifier ailleurs.

## À trancher avant le lot D

La landing `index.html` affiche des tarifs **0 € / 5 € / 19 € « Professionnel »** qui
viennent des maquettes et n'ont jamais été confrontés à ce qui est réellement configuré
dans Lemon Squeezy. Il faut cette information avant de la migrer.

Deuxième point : `login.html#signup` dans les maquettes contre `?signup=1` dans ce qui a
été construit. Un des deux liens ne mène nulle part.

## Méthode de travail

Chaque modification passe par un script Python qui **compte ses ancres et n'écrit rien
si une seule ne correspond pas exactement**. Ensuite `node --check` sur tous les blocs
de script, puis rendu Playwright en 390 / 768 / 1440 px, clair et sombre, FR et EN.
Le contrôle automatique vérifie : cinq entrées de navigation, aucun débordement
horizontal, aucun titre tronqué, aucune clé de traduction affichée brute.
