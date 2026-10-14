# Note de reprise — 15 octobre 2026, fin de nuit (Bangkok, ~01:30)

Suite de `note_reprise_2026-10-15.md` (lot 3, poussé sur `beta`, commit a9bfa2e).

## Ce qui s'est passé

**L'appli tourne sur l'iPhone de James.** Première installation réelle, depuis Xcode.

Étapes faites par James sur son Mac, une commande à la fois :
1. `node -v` / `npm -v` → **Node 24.17.0, npm 11.13.0** (Capacitor 8 demande Node 22 minimum : OK).
2. `npm install` → 101 paquets ajoutés, sans erreur. 3 vulnérabilités « moderate » et un avertissement
   `uuid` déprécié, **dans les outils de fabrication seulement** (pas dans l'appli).
   **Ne jamais lancer `npm audit fix --force`** : il changerait les versions de Capacitor.
3. `npm run www` → `www/` prêt, **63 fichiers**.
4. `npx cap add ios` → projet Xcode créé dans `ios/`, **sans CocoaPods** (Capacitor 8 utilise Swift Package
   Manager). Extensions détectées : `@capacitor/local-notifications@8.3.1`, `@capacitor/status-bar@8.0.4`.
5. `npx cap open ios` → Xcode. Signature automatique, équipe « mourad chenniki » (compte développeur Apple
   individuel), profil créé sans erreur : **l'identifiant `app.peptidescanner` est libre et réservé**.
   Appareil « iPhone James ». Un avertissement jaune (⚠ 1) non bloquant, pas encore lu.
6. ▶ Run → appli installée et ouverte sur l'iPhone.

**Constaté par James** : ça fonctionne ; l'écran « Avant de commencer » (18 ans et plus, avertissement) s'affiche
bien à l'ouverture. **Il y a des « petits soucis » : débrief prévu demain** (James apportera ses remarques).

## État du dépôt
- Branche `beta` à jour jusqu'au lot 3 (a9bfa2e).
- **Pas encore enregistrés** : le dossier `ios/` (projet Xcode, 26 fichiers suivis ; `ios/.gitignore` exclut déjà
  `App/App/public`, la config copiée, `build`, `DerivedData`, `xcuserdata`) et `package-lock.json`
  (versions exactes installées). À enregistrer avec cette note.

## À faire à la reprise (demain)
1. **Débrief de James** : recueillir tous ses retours d'un coup, puis UN lot de corrections.
   Points à surveiller probablement : zones sûres (encoche, barre du bas), barre d'état, clavier sur les formulaires,
   liens externes, rappels (activer depuis la page Alertes → autorisation iOS), retour arrière sans bouton
   navigateur, temps de chargement entre pages.
2. Lire l'avertissement jaune d'Xcode (⚠ 1).
3. Cycle de mise à jour sur l'iPhone après chaque lot :
   `npm run www && npx cap sync ios` puis ▶ dans Xcode.
4. Toujours en attente : réponse ChatGPT sur les prix → RevenueCat → tunnel d'arrivée ; SQL x2, fonction
   `delete-account`, redirections Supabase, « [À compléter] » des pages légales (James) ; Android plus tard.
