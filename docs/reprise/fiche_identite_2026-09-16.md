# Fiche d'identité — PeptideScanner

## 1. Nom et objet
**PeptideScanner** (peptidescanner.app), studio **Labs1307**. PWA de suivi de protocole peptidique : journal de reconstitution, flacons, calculateur de dose, suivi de poids et de cure.
Pour des particuliers qui suivent une cure ; interface FR/EN, thème « Carnet de protocole ».
Développeur unique : James. Monétisation prévue : abonnement + boutiques affiliées.

## 2. État
**En construction, proche du lancement.** 11 pages connectées migrées vers le design « Carnet de protocole » ; 8 pages publiques restantes (index/landing, login, onboarding, demo, lemon-checkout, cgu, mentions-légales, privacy) — 153 couleurs de l'ancienne palette à remapper.
**Prochaine grande étape : le lot D** — migration des pages publiques, bloqué par deux décisions (tarifs réels dans Lemon Squeezy vs 0 €/5 €/19 € affichés ; lien `login.html#signup` vs `?signup=1`).

## 3. Technique
- HTML/CSS/JS purs, **aucun framework**
- Supabase (ref `dkwztwlkjewdzfichkgk`) — client **UMD via CDN jsdelivr**, jamais ESM (sauf `login.html`, déjà en `type="module"`)
- Tables : profiles, cures, injections, weight_logs, inventory, alerts, peptides — RLS partout
- Hébergement : Vercel, auto-déploiement depuis GitHub. DNS : OVH. Paiements : Lemon Squeezy
- Dépôt : `massilia1383/peptidescanner-app` (branche `main`)
- Dossier local : `/Users/mouradchenniki/Desktop/peptidescanner-app`

## 4. Environnements
Un seul environnement réel : **la prod Vercel**, alimentée par `main`. Pas de bêta séparée connue. Une **même base Supabase et une même clé anon** (embarquée en clair dans chaque page) servent tout.
Conséquence : un test n'est « réel » qu'une fois poussé sur `main` et rendu par Vercel, connecté avec un vrai compte — et toute écriture de test crée de vraies lignes dans la base de prod.
Pages annexes : `/demo` (démonstration) et l'admin `/ps-admin-x7k9m/admin.html`, protégée par `profiles.is_admin` (compte m.chenniki@orange.fr).

## 5. Commandes qui marchent
- Installer : *inconnu* (pas de build, pas de `package.json` connu)
- Lancer en local : *inconnu* (ouverture directe des fichiers ; aucun serveur documenté)
- Construire : *aucun build* — les fichiers sont servis tels quels
- Vérifier le JS : `cd ~/Desktop/peptidescanner-app && node --check fichier.js`
- Rendu de contrôle : Playwright en 390 / 768 / 1440 px, clair et sombre, FR et EN (script *inconnu*)
- Déployer : `cd ~/Desktop/peptidescanner-app && git add chemin/du/fichier.html && git commit -m "message" && git push`

## 6. Rail de déploiement
1. Claude propose la liste complète des changements → **James donne le go**
2. Claude livre le ou les **fichiers complets**
3. James télécharge puis `cp ~/Downloads/fichier.html` dans le dépôt local
4. `git add` par chemin, `git commit`, `git push` → **Vercel déploie tout seul**
5. James vérifie en ligne et confirme. Si git ne voit aucun changement : édition directe via l'interface GitHub (crayon) puis `git pull` en local.
Décideur à chaque étape : **James**. Claude ne pousse ni ne déploie.

## 7. Interdits
- **Ne jamais toucher Supabase directement** (MCP ou Chrome) : le navigateur est souvent connecté à un autre compte. Lecture par James uniquement.
- Ne jamais exécuter de SQL, ni redéployer d'Edge Function, ni manipuler les clés : **James seul**.
- Jamais `git add -A` : les fichiers par leur chemin.
- Ne jamais supprimer — archiver ou mettre en pause.
- Ne pas publier, ni modifier les tarifs Lemon Squeezy.

## 8. Pièges connus
1. **`lang.js` : clés dans le mauvais bloc de langue** (valeurs EN dans le bloc FR) — bug récurrent ; 99 doublons FR subsistent, JS garde la dernière définition, donc corriger la première copie ne fait rien. Vérifier la parité FR/EN après chaque édition.
2. **Balise `<script>` Supabase UMD contenant du JS en ligne** : le code est silencieusement ignoré — toujours un bloc `<script>` séparé.
3. **Dates** : `toISOString()` et `new Date(start_date)` décalent d'un jour (fuseau UTC+7). Toujours passer par les composantes locales. BUG-11 encore ouvert ailleurs que sur accueil et cure.
4. **`t` utilisé comme variable de boucle** — masque la fonction de traduction ; `times.forEach((t,i))` a cassé une page.
5. **`${t('clé')}` écrit dans du HTML statique** s'affiche tel quel, et une page peut porter des `data-i18n` sans charger `lang.js` (cas `calculateur.html`, 28 attributs morts).
6. Aussi : `overflow:hidden` qui rognait les flèches du carrousel ; `ilike` peu fiable pour les noms de peptides (filtrer en JS) ; précision flottante contournée en stockant la fréquence en texte dans `lot_number`.

## 9. Fichiers clés
- `lang.js` — traductions FR/EN centralisées ; à charger dans `<head>` avant tout le reste. Le fichier le plus fragile.
- `index.html` — landing publique, non migrée, porte les tarifs à trancher
- `login.html` — seule page en `type="module"`
- `cure.html` — cœur du suivi : calendrier, paliers de titration, BUG-09 ouvert
- `poids.html`, `alertes.html`, `stock.html` (inventaire, flacon SVG), `calculateur.html`
- `peptide-database.html` — 41 peptides, barre de phase de recherche
- `ia.html` — conseiller Gemini Flash, drapeau `IA_ENABLED = false`
- `ps-admin-x7k9m/admin.html` — administration
- `design/peptidescanner.css` + `design/Design_System_Carnet_de_protocole.md` (dans le projet Claude)

## 10. Notes de reprise
Rangées dans le projet Claude, dossier `claude/`, nommées `Note_Reprise_<date>.md`.
Ordre de lecture : **la plus récente d'abord** (`Note_Reprise_29aout2026.md`), puis la précédente (`Note_Reprise_19aout2026_soir.md`) si besoin de contexte. `design/Phase2_Plan_de_migration.md` donne le plan des lots. Deux PDF plus anciens (`PeptideScanner_Handoff.pdf`) sont de l'historique.

## 11. Règles de travail propres à ce projet
- Chaque modification de fichier passe par un **script Python qui compte ses ancres et n'écrit rien si une seule ne correspond pas exactement**.
- Ensuite `node --check` sur tous les blocs de script, puis rendu Playwright 390/768/1440 px, clair et sombre, FR et EN.
- Le contrôle automatique vérifie : 5 entrées de navigation, aucun débordement horizontal, aucun titre tronqué, aucune clé de traduction affichée brute.
- `PS_applyI18n()` exactement une fois par cycle de rendu ; fonctions définies avant d'être appelées.
- Toute dose en **mg**, jamais en mcg. `padding-bottom: 120px` sur chaque page.
- Colonnes manquantes contournées par des étiquettes dans `notes` (`temp:X|days:X|snote:X`, `inv:UUID`) — ne pas « nettoyer » ces champs.
- Travailler toujours depuis la dernière version produite dans la session, sans redemander les fichiers à James.

**Confiance : moyenne** — la structure, les pièges et le rail de déploiement viennent de la mémoire du projet et de la note du 29 août ; les commandes d'installation et de lancement local ne sont pas documentées.
