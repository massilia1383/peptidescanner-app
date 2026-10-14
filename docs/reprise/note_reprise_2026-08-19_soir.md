# PeptideScanner — Note de reprise

*Copie dans le dépôt, le 14/10/2026, de `claude/Note_Reprise_19aout2026_soir.md` (projet Claude). Contenu inchangé — certains chemins (`~/Desktop`, `/Users/mouradchenniki`) sont périmés : le dossier est désormais `~/development/peptidescanner-app`.*

**Mercredi 19 août 2026 (Bangkok, UTC+7)** — mise à jour en fin de journée.
Remplace la note du 19 août 04:15.

---

# 0. À FAIRE EN PREMIER À LA REPRISE

## Un commit non poussé

BUG-12 est corrigé en local mais **pas encore commité**. `lang.js` est modifié.

```
cd ~/Desktop/peptidescanner-app && git add lang.js && git commit -m "fix BUG-12: cle days_suffix manquante dans le bloc EN" && git push
```

## Le lot 1 est prêt et attend un GO

Préparé, **testé à blanc sur les 20 pages : 20/20 prêtes, aucun conflit**. Rien n'a été
écrit dans le repo. Un « go » de James suffit à l'appliquer.

**Ce que le script fait :**

1. Normalise le viewport des 20 pages — trois formes différentes coexistaient — vers
   `width=device-width, initial-scale=1.0, viewport-fit=cover`.
   Retire `maximum-scale=1.0`, présent sur 14 pages, qui bloque le zoom à deux doigts.
2. Insère un bloc d'icônes juste après le `</title>` — ancrage unique et propre sur les
   20 pages : favicon SVG et ICO, apple-touch-icon, **lien vers le manifeste**,
   theme-color, et les trois métas `apple-mobile-web-app-*`.
3. Dépose les 15 fichiers d'icônes à la racine et dans `icons/`.

**Écarts assumés par rapport à ce que proposait l'IA de design :**

- `theme-color` reste à `#F8F9FA`, la couleur actuelle. Le `#FBF7F1` du nouveau design
  ferait jurer la barre d'état tant que l'interface n'a pas migré.
- **Pas de `<meta name="color-scheme" content="light dark">`** tant qu'il n'y a pas de CSS
  sombre : Safari rendrait les champs de formulaire en sombre sur un fond clair.
- **`manifest.json` n'est pas touché.** Il était déjà correct — il ne lui manquait que les
  fichiers d'icônes.

**Résultat attendu** : app installable en PWA avec la bonne icône, favicon sur les
20 onglets, notifications avec icône au lieu d'une 404, zoom à deux doigts rétabli.
**Aucun pixel de l'interface ne bouge.**

**À trancher plus tard** : le manifeste référence `screenshots/dashboard.png` et
`screenshots/cure.png` qui n'existent pas. L'installation fonctionne, mais Android
n'affiche pas sa fenêtre d'installation enrichie.

## En attente d'une IA tierce

James a demandé 7 écrans manquants — Stock, Bibliothèque, Calculateur, Analyse, landing,
login, onboarding — plus 3 corrections. Il fournira la réponse.

---

# 1. Infrastructure

| Paramètre | Valeur |
|---|---|
| Production | https://www.peptidescanner.app |
| Repo | github.com/massilia1383/peptidescanner-app · branche `main` |
| Repo local | `/Users/mouradchenniki/Desktop/peptidescanner-app` (connecté à la session) |
| Hébergement | Vercel, auto-deploy sur push |
| Base | Supabase, projet `dkwztwlkjewdzfichkgk` |
| Admin | peptidescanner.app/ps-admin-x7k9m/admin.html |
| IA | Gemini Flash via Edge Function `ai-proxy` — `IA_ENABLED = false` |
| Pages | **20 fichiers HTML**, pas 12 |

## ⚠️ Git — deux comptes volontairement non liés

Le trousseau macOS contient les identifiants d'un **second compte GitHub**, `massilia83`,
utilisé pour d'autres projets. PeptideScanner appartient à `massilia1383`.

La séparation tient à deux réglages **locaux à ce dossier** :

```
remote.origin.url  = https://massilia1383@github.com/massilia1383/peptidescanner-app.git
credential.helper  = osxkeychain   (--local)
```

Jeton *fine-grained* `peptidescanner-macbook` mémorisé sous `massilia1383`, portée limitée
à ce dépôt, permission Contents en lecture/écriture.

**Ne jamais modifier la configuration git globale** — cela casserait les autres projets.

**Piège** : lancer `git` depuis l'environnement distant laisse un verrou `.git/index.lock`
que le sandbox ne peut pas supprimer, ce qui bloque ensuite les `git add` de James. En
lecture, préférer `cat .git/logs/HEAD` et `git config --get`, qui ne verrouillent pas
l'index.

# 2. Commits de la journée

```
fa009e9  fix BUG-04 : rappels injection cures hebdomadaires + BUG-05
fb975d1  fix BUG-01 : toggle FR/EN repositionné à droite
a32eacb  ui  : logo topbar agrandi à 1rem, harmonisé sur 10 pages
e9b1c6e  feat: bouton Se connecter sur la landing + CTA vers inscription
bee4971  ui  : sélecteur de cure plus visible
(+2)     feat: injection décalée, report manuel, confirmation, stats alignées
(à venir) fix BUG-12
```

# 3. Bugs corrigés

| Réf | Fichier | Description |
|---|---|---|
| BUG-01 | poids.html | Toggle FR/EN à gauche — ordre du markup dans la topbar |
| BUG-03 | cure.html | Noms de cure en minuscules — `capFirst()` à l'affichage |
| BUG-04 | alertes.html | `frequency >= 1` excluait les cures hebdomadaires des rappels |
| BUG-05 | alertes.html | `scheduleAllReminders()` lisait la mauvaise clé localStorage — les toggles OFF étaient ignorés |
| BUG-10 | cure.html, dashboard.html | `toISOString()` écrivait de l'UTC alors que les lecteurs supposent du local |
| BUG-12 | lang.js | `days_suffix` absente du bloc EN — **corrigé, non commité** |
| UX-03 | cure.html | Onglets scrollables remplacés par un select |
| UX-04 | index.html | « Se connecter » distinct de « Essai gratuit » |

## BUG-10 — la convention à retenir

`injected_at` est de type `timestamptz`. Quatre points d'écriture existaient dans **deux
formats** : trois en UTC via `.toISOString()`, un en local naïf. Tous les lecteurs
comparent par chaîne — `.startsWith(ds)`, `.slice(11,16)` — et supposent donc du **local**.

Convention retenue : **heure locale naïve partout**, `YYYY-MM-DDTHH:MM:SS`.
Helpers `localStamp()`, `localStampNow()`, `localDay()` dupliqués dans `cure.html` et
`dashboard.html` — à centraliser.

**Les lignes déjà en base ne sont pas réparées.** James corrige les heures une à une via
le champ prévu, qui réécrit au bon format. Il en a validé une, ça tient.

# 4. Fonctionnalités ajoutées

**Injection décalée** — un jour de repos passé accepte l'enregistrement d'une injection.

**Report manuel et réversible** — sur un jour manqué, l'utilisateur choisit lui-même
l'injection qui le rattrape. Stocké dans le champ `notes` sous la forme
`slot:0|report:2026-08-10`, donc **en base, donc synchronisé**.

> Une première version déduisait le lien automatiquement. **Rejetée par James** : rien ne
> dit qu'une injection hors calendrier en remplace une autre, elle peut être
> supplémentaire. La déduction automatique est un mauvais réflexe sur ce produit.

**Confirmation avant saisie** — cocher ou décocher ouvre une feuille. Décocher affiche un
bouton rouge : c'est une suppression en base.

**Statistiques alignées sur le calendrier** — « attendues » compte les jours d'injection
réellement écoulés, « manquées » compte les cases rouges.

**Feuilles de confirmation recentrées** verticalement, dans `cure.html` et `dashboard.html`.

# 5. Bugs ouverts

| Réf | Où | Description | Gravité |
|---|---|---|---|
| BUG-02 | données | Doublon de flacon « Retatritude » / « retatritude » — nettoyage via l'admin | mineur |
| BUG-06 | poids.html | « 0 mesures » alors que l'historique n'est pas vide — le compteur porte sur la période | mineur |
| BUG-07 | poids.html | « Ajoutez votre premier poids » alors qu'une mesure existe | mineur |
| BUG-08 | index.html | Carte « Conseiller IA » : le titre chevauche l'icône | mineur |
| BUG-09 | cure.html | `saveNote()` écrit dans `localStorage` — **notes non synchronisées**, perdues si le site est vidé. Demande une colonne ou une table Supabase | **majeur** |
| BUG-11 | dashboard, analytics, alertes | ~20 `new Date(start_date)`. Corrects en UTC+7, décalés d'un jour pour un fuseau négatif | latent |

# 6. Refonte design — direction validée à 100 %

Direction **« Carnet de protocole »**, produite par une IA tierce, **validée intégralement
par James**. La conversation source a été supprimée : tout est archivé dans le projet.

- `design/Design_System_Carnet_de_protocole.md` — décisions verrouillées
- `design/peptidescanner.css` — 760 lignes, audité compatible Safari
- `design/Phase2_Plan_de_migration.md` — plan en 7 étapes

**Ce que ça implique** : le CSS contient déjà topbar, nav à 5 entrées, tiroir Plus et les
trois paliers de largeur. **Il remplace le chantier B** — inutile d'écrire `ps-shell.js`.

Adopter le design signifie migrer les **20 pages** : fond `#F8F9FA` → `#FBF7F1`,
sarcelle `#0D9488` → `#166B5A`, rouge d'alerte → terre cuite.

⚠️ **Les trois HTML de la phase 2 sont des maquettes**, 90 à 180 lignes. Les vraies pages
en font 700 à 900 avec Supabase et l'i18n. **Ne jamais les copier dans le repo.**

**10 icônes PNG/ICO générées** depuis les SVG sources. Zone sûre maskable vérifiée :
symbole de 147 à 365 px sur 512, demi-diagonale 154 px pour un cercle sûr de 205 px.

# 7. Règles techniques impératives

- Supabase **toujours en UMD CDN**, jamais en ESM. Exception : `login.html` en
  `type="module"` — ne pas y toucher hors ajout minime dans le script existant
- `lang.js` chargé avant tous les autres scripts
- `PS_applyI18n()` appelé exactement une fois par cycle de rendu
- **Ne jamais utiliser `t` comme variable** — masque la fonction de traduction.
  Il en reste une dans `showToast()` ligne 219 de `alertes.html`, sans danger immédiat
- **Dates : composants locaux uniquement**, jamais `toISOString()`
- `overflow:hidden` interdit sur les cartes à enfants absolus débordants
- **Toute nouvelle clé de traduction va dans les DEUX blocs.** `t()` retombe sur le
  français si la clé manque en anglais, ce qui masque l'oubli — vérifier explicitement
- Patches Python `str_replace` plutôt que réécritures complètes

## La méthode de patch qui a fait ses preuves

Script Python qui **vérifie d'abord que chaque motif apparaît exactement une fois**, et
n'écrit **aucun fichier** si une seule règle échoue. A évité deux erreurs réelles :

- un motif CSS trop court qui touchait aussi `.promo-code` dans `boutiques.html`
- une parenthèse en trop, détectée avant toute écriture

Systématiquement suivi de `node --check` sur les blocs de script extraits, et d'une
simulation en Node de la logique métier modifiée avant livraison.

# 8. Règles de travail de James

- Français simple, une étape à la fois. **Présenter un plan et attendre un GO explicite
  avant de coder.** Un accord sur le constat n'est pas un GO
- **On ne supprime jamais rien** : on archive, on met en pause. Le CSS devenu inutilisé
  reste en place
- **C'est lui qui exécute le SQL, touche aux clés et déploie.** Jamais l'assistant
- Toute commande doit préciser **clairement** s'il faut l'exécuter ou seulement la lire.
  **Une commande à la fois**
- `node --check` sur tout fichier JS modifié. La moindre erreur, on n'envoie pas
- Un numéro de SQL livré est **gelé** : une correction prend le numéro suivant
- **Le SQL, c'est pour la structure.** Les données se changent dans l'interface
- « Fait » ne se dit qu'après avoir **lu** le résultat
