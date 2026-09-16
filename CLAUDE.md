# PeptideScanner — consignes du projet

Ce fichier complète `~/.claude/CLAUDE.md` (la méthode de James), qui prime en cas de contradiction. Écrit le 16/09/2026 à partir de la fiche d'identité du projet (confiance moyenne : commandes de lancement non documentées).

## À lire avant tout : ce qui fait le plus mal si on l'oublie
- **Un seul environnement réel : la prod Vercel** (`peptidescanner.app`), alimentée par `main`. **Une même base Supabase et une même clé anon, embarquée en clair dans chaque page.** Toute écriture de test crée de vraies lignes dans la base de prod. Un test n'est réel qu'une fois poussé sur `main`, rendu par Vercel, et fait avec un vrai compte.
- **`lang.js` est le fichier le plus fragile** : clés dans le mauvais bloc de langue, 99 doublons FR (JavaScript garde la dernière définition, donc corriger la première copie ne fait rien). **Vérifier la parité FR/EN après chaque édition.**
- **Dix fichiers non suivis par git traînent à la racine** (`.bak_lotB/`, `_to_delete/`, `SETUP-SUPABASE.md`, `ia.txt`, `ia_usage.sql`, `supabase-schema.sql`, `supabase/.temp/`, des `.DS_Store`) — vérifié le 16/09 : aucun fichier modifié en attente, le dépôt est propre. Ne pas les ajouter sans décision de James ; `supabase-schema.sql` mérite peut-être d'être versionné, à lui de dire.

## Ce qu'est PeptideScanner
PWA de suivi de protocole peptidique (studio Labs1307) : journal de reconstitution, flacons, calculateur de dose, suivi de poids et de cure. Particuliers qui suivent une cure ; FR/EN ; thème « Carnet de protocole ». Monétisation prévue : abonnement + boutiques affiliées (Lemon Squeezy).
État au 16/09 : en construction, proche du lancement. 11 pages connectées migrées vers le design « Carnet de protocole » ; 8 pages publiques restantes (index, login, onboarding, demo, lemon-checkout, cgu, mentions-légales, privacy) — 153 couleurs de l'ancienne palette à remapper. **Prochaine grande étape : le lot D** (migration des pages publiques), bloqué par deux décisions de James : tarifs réels dans Lemon Squeezy (vs 0 €/5 €/19 € affichés) et lien `login.html#signup` vs `?signup=1`.

## Technique
HTML/CSS/JS purs, **aucun framework, aucun build, pas de `package.json`** : les fichiers sont servis tels quels. Supabase (ref `dkwztwlkjewdzfichkgk`) via client **UMD depuis le CDN jsdelivr**, jamais ESM (sauf `login.html`, déjà en `type="module"`). Tables : profiles, cures, injections, weight_logs, inventory, alerts, peptides — RLS partout. Hébergement Vercel (auto-déploiement depuis GitHub), DNS OVH, paiements Lemon Squeezy.
Dépôt : `massilia1383/peptidescanner-app`, branche `main`. Dossier : `~/development/peptidescanner-app` (plus jamais `~/Desktop` ni `/Users/mouradchenniki`, ancien Mac).
Pages annexes : `/demo` et l'admin `/ps-admin-x7k9m/admin.html` (protégée par `profiles.is_admin`).

## Commandes qui marchent
- Vérifier le JavaScript : `node --check fichier.js`, et tous les blocs de script des pages.
- Rendu de contrôle : Playwright en 390 / 768 / 1440 px, clair et sombre, FR et EN (script : inconnu).
- Servir en local : inconnu (ouverture directe des fichiers ; un `python3 -m http.server 8080` devrait convenir, à vérifier).
- Déployer (James) : `git add chemin/du/fichier.html && git commit -m "message" && git push` → Vercel déploie seul.

## Rail de déploiement (James décide à chaque étape)
1. Claude propose la liste complète des changements → go de James.
2. Claude livre les fichiers complets directement dans le dossier (plus jamais « télécharge puis copie »).
3. James : `git add` par chemin, commit une ligne, push. Vercel déploie.
4. James vérifie en ligne et confirme.

## Interdits propres à ce projet
- Ne pas publier ni modifier les tarifs Lemon Squeezy : James seul.
- Jamais de JavaScript en ligne dans la balise `<script>` qui charge Supabase UMD : le code y est silencieusement ignoré. Toujours un bloc `<script>` séparé.
- Ne pas « nettoyer » les champs `notes` qui portent des étiquettes (`temp:X|days:X|snote:X`, `inv:UUID`) : ils contournent des colonnes manquantes.

## Pièges connus
1. **`lang.js` : valeurs EN dans le bloc FR**, bug récurrent ; doublons FR ; vérifier la parité après chaque édition.
2. **Dates : `toISOString()` et `new Date(start_date)` décalent d'un jour** (fuseau UTC+7). Toujours passer par les composantes locales. BUG-11 encore ouvert ailleurs que sur accueil et cure.
3. **`t` utilisé comme variable de boucle** masque la fonction de traduction — `times.forEach((t,i))` a cassé une page.
4. **`${t('clé')}` écrit dans du HTML statique** s'affiche tel quel ; une page peut porter des `data-i18n` sans charger `lang.js` (`calculateur.html`, 28 attributs morts).
5. `overflow:hidden` qui rognait les flèches du carrousel ; `ilike` peu fiable pour les noms de peptides (filtrer en JS) ; précision flottante contournée en stockant la fréquence en texte dans `lot_number`.
6. **`PS_applyI18n()` exactement une fois par cycle de rendu** ; fonctions définies avant d'être appelées.

## Fichiers clés
`lang.js` (traductions FR/EN, à charger dans `<head>` avant tout le reste) · `index.html` (landing, non migrée, porte les tarifs à trancher) · `login.html` (seule page en `type="module"`) · `cure.html` (cœur du suivi, BUG-09 ouvert) · `poids.html`, `alertes.html`, `inventaire.html`, `calculateur.html` · `peptide-database.html` (41 peptides) · `ia.html` (conseiller Gemini Flash, `IA_ENABLED = false`) · `ps-admin-x7k9m/admin.html` · `peptidescanner.css`, `peptidescanner-extra.css` · `supabase.js`, `supabase-schema.sql` · `sw.js`.

## Notes de reprise et documents — `docs/reprise/`
**Source de vérité : `docs/reprise/` dans ce dépôt** (créé le 16/09). Au démarrage, lire la note la plus récente sans qu'on le demande ; en fin de session, écrire la nouvelle là, nommée `note_reprise_AAAA-MM-JJ[_soir|_nuit].md`, sans écraser, puis livrer la commande de commit. Tout document durable va dans `docs/`.
Les notes antérieures (`Note_Reprise_29aout2026.md`, `Note_Reprise_19aout2026_soir.md`, `design/Phase2_Plan_de_migration.md`, `Design_System_Carnet_de_protocole.md`) sont dans le projet Claude de l'app ; la plus récente doit être copiée dans `docs/reprise/` par le chat PeptideScanner de l'app. Tant que ce n'est pas fait, `docs/reprise/fiche_identite_2026-09-16.md` tient lieu de point de départ.

## Règles propres à ce projet
- Chaque modification de fichier passe par un script qui compte ses ancres et n'écrit rien si une seule ne correspond pas exactement ; puis `node --check` ; puis rendu Playwright 390/768/1440, clair et sombre, FR et EN.
- Le contrôle automatique vérifie : 5 entrées de navigation, aucun débordement horizontal, aucun titre tronqué, aucune clé de traduction affichée brute.
- Toute dose en **mg**, jamais en mcg. `padding-bottom: 120px` sur chaque page.
- Travailler toujours depuis la dernière version produite dans la session, sans redemander les fichiers à James.
