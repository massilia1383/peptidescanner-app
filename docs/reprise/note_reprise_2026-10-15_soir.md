# Note de reprise — 15 octobre 2026, soir (Bangkok)

Suite de `note_reprise_2026-10-15_nuit-2.md` (appli installée sur l'iPhone de James, commit 1730514).

## Ce qui s'est décidé aujourd'hui (débrief de James)
1. **Refonte complète du design** : James trouvait l'appli « très moche ». Un prompt détaillé a été donné
   à ChatGPT (2 phases : esquisses puis kit). James a validé la direction **« Clarté enrichie »** (bleu
   cobalt, Inter, barre d'onglets, illustrations techniques) et a fourni le kit complet (zip + PDF, dans le
   projet Claude). Décision : **tout reprendre du kit** — couleurs, police, navigation, dessins.
2. **Flacons, seringues, stylos** : il faut de belles illustrations exactes. Seringues d'insuline U-100
   uniquement en 30 / 50 / 100 unités (le « 200 unités » n'existe pas en seringue : ce sont des stylos U-200).
3. **Stylos** (préremplis type GLP-1 et rechargeables à cartouche 3 ml) : à intégrer, dessins déjà dans le
   kit, mais la GESTION (inventaire, calculateur cartouche, cures au stylo) est un **lot à venir** —
   jamais de calcul « en clics » pour un stylo prérempli (Apple 1.4.2).
4. James s'est absenté et a donné le go pour tout faire d'un coup (caffeinate lancé sur le Mac).
   **Rien n'est commité : James vérifie à son retour, puis commit (commande en fin de note).**

## Lot « Clarté » — fait (dans le dossier, NON COMMITÉ)
**Fondations** : `peptidescanner.css` réécrit (jetons Clarté clair/sombre + alias des anciens noms de
variables → les styles par page suivent sans réécriture) ; Inter variable dans `fonts/` (Space archivées) ;
`assets/` nouveau (assets-bundle.js = PS_ASSETS/PS_ICONS/PS_LOGO embarqués ; equipment/ 12 SVG ; icons/ 40
Heroicons) ; `licences/` (OFL, MIT, copiées dans l'appli) ; icônes PWA + favicon + apple-touch régénérées
depuis la nouvelle icône 1024 ; `manifest.json` (thème cobalt) ; `ps-app.js` enrichi (PS_icon, PS_asset,
PS_statusIcon, PS_updateLevel, PS_vialLevel, PS_initShell) ; `sw.js` cache v2.0.

**Les 15 pages refaites** (fonctionnement Supabase/i18n/rappels inchangé) :
- Ossature commune : en-tête logo + nom + cloche + avatar ; menu avatar (Profil, Langue, Thème, Pages
  légales, Déconnexion) ; **5 onglets en bas** Accueil/Cure/Matériel/Suivi/Savoir ; tiroir « Plus » supprimé ;
  sous-onglets Stock|Calculateur et Poids|Analyse ; grand titre + sous-titre dans la page ; thème restauré
  dès le `<head>` (plus de flash).
- `dashboard.html` : « Aujourd'hui » (injections du jour) EN PREMIER, puis cure active ; `#userName` déplacé
  (l'ancien lisait un élément supprimé → garde-fou) ; cartes à plat, dégradés verts retirés.
- `cure.html` : états aux nouvelles couleurs (manqué = ardoise, partiel = violet, reporté = ambre),
  points du calendrier remplacés par des formes (✓ ◐ — ○), légende refaite, « Manquées » plus en rouge.
- `calculateur.html` : nouvelle carte **« Aperçu du matériel »** — choix seringue 30/50/100 U, flacon +
  seringue du kit, **niveau exact posé par le calcul** (PS_updateLevel), alerte si la dose dépasse la
  capacité avec suggestion de taille ; la seringue interactive existante (piston) est conservée ;
  « Durée estimée du flacon » SUPPRIMÉE (reposait sur une dose supposée de 500 mcg/j — interdit par notre
  règle « aucune dose proposée »).
- `inventaire.html` : flacons dessinés par le kit (poudre si scellé, niveau de liquide exact sinon).
- `poids.html` : hausse/baisse en neutre (plus de rouge = jugement), icônes dessinées.
- `peptide-database.html` : pastilles de phase sans émojis ; 4 formules encore promotionnelles neutralisées
  (« prochaine révolution », « exceptionnels »…) — repérées par l'audit stores.
- `login`, `reset-password`, `avertissement` : logo Clarté, palette auto.
- Pages légales : palette auto (legal.css était déjà en jetons), mentions → licences Inter/Heroicons.
- Émojis d'interface retirés (≈240 dans lang.js + pages) ; il en reste dans les contenus de guide.
- `lang.js` : **1046 clés FR / 1046 EN**, 0 doublon, 0 valeur vide (clés ajoutées : nav_materiel/suivi/savoir,
  intro_*_sub, calc_material_*, status_done_short…).
- iOS : `AppIcon` 1024 remplacée, `Splash` fond cobalt + symbole (3 fichiers identiques).
- `CLAUDE.md` réécrit (section Design Clarté, pièges 10 et 11 nouveaux).

## Vérifications faites
- `node --check` : 0 erreur sur tous les blocs script de toutes les pages + lang.js + sw.js + ps-app.js.
- Parité FR/EN 1046/1046, aucune clé orpheline, aucune valeur vide.
- Aucun reste : Space Grotesk/Mono, tiroir, nav_more, ancien logo, verts Carnet, liens archivés.
- Rendu Playwright (Supabase simulé, cure active + poids + flacons) : **168 combinaisons**
  (14 pages × 390/768/1440 × clair/sombre × FR/EN) → 0 erreur JS, 0 débordement horizontal, 0 clé brute.
  (Un débordement de 2 px sur l'accueil venait d'un décor ::before : corrigé.)
  + login / avertissement / reset testés déconnectés. Écrans clés contrôlés à l'œil, clair et sombre.
- `ps-admin-x7k9m/admin.html` : volontairement PAS migré (hors appli).

## À faire à la reprise
1. **James** : vérifier sur le Mac, puis UNE commande de commit + push beta (donnée dans la conversation).
   Ensuite `npm run www && npx cap sync ios` puis ▶ dans Xcode → voir le design sur l'iPhone.
2. Lire l'avertissement jaune d'Xcode (⚠ 1) — toujours pas fait.
3. **Lot stylos** : inventaire (type flacon/stylo), calculateur mode cartouche 3 ml (unités seulement si
   l'échelle 100 U/ml est confirmée), cures « au stylo », dessins déjà prêts dans assets/equipment/.
4. Finitions design : émojis restants dans les guides, admin, écrans vides à uniformiser (modèle kit),
   feuilles modales (sheet) de cure/inventaire à arrondir au style kit si James le souhaite.
5. Toujours en attente : prix → RevenueCat → tunnel d'arrivée (le kit contient déjà les écrans parcours +
   Premium en maquette) ; SQL ×2 ; fonction delete-account ; redirections Supabase ; « [À compléter] » légaux.
6. Gros brainstorming légal/stores prévu par James (plusieurs IA) — le kit redit que la règle Apple 1.4.2
   (calculateurs de dose) reste un point à valider avant soumission.
