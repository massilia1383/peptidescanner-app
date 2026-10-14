# Guide Setup Supabase — PeptideScanner
## De zéro à la base de données en production

---

## ÉTAPE 1 — Créer le projet Supabase

1. Va sur **https://supabase.com** → Sign up (gratuit)
2. Clique **New project**
3. Remplis :
   - **Name** : `peptidescanner`
   - **Database password** : génère un mot de passe fort et **sauvegarde-le** quelque part
   - **Region** : `West EU (Ireland)` — le plus proche de tes utilisateurs EU/FR
4. Clique **Create new project** et attends ~2 minutes

---

## ÉTAPE 2 — Récupérer les clés API

Dans ton projet Supabase → **Settings** → **API** :

| Clé | Où la copier |
|-----|-------------|
| **Project URL** | `SUPABASE_URL` dans `supabase.js` |
| **anon / public key** | `SUPABASE_ANON_KEY` dans `supabase.js` |

> ⚠️ Ne jamais committer la **service_role key** — elle bypass les RLS.
> La **anon key** est safe côté client.

---

## ÉTAPE 3 — Exécuter le schéma SQL

1. Dans Supabase → **SQL Editor** → **New query**
2. Colle le contenu entier de `supabase-schema.sql`
3. Clique **Run** (▶)
4. Vérifie dans **Table Editor** que ces tables existent :
   - `profiles`, `cures`, `injections`, `weight_logs`, `inventory`, `alerts`, `peptides`

---

## ÉTAPE 4 — Configurer l'authentification

Dans Supabase → **Authentication** → **Settings** :

### Email
- ✅ Enable email confirmations : **ON** (recommandé en prod)
  - Pour tester vite, mets **OFF** temporairement
- Sender name : `PeptideScanner`
- Sender email : `noreply@peptidescanner.app`

### Site URL
- **Site URL** : `https://www.peptidescanner.app`
- **Redirect URLs** (ajouter) :
  ```
  https://www.peptidescanner.app/dashboard.html
  https://www.peptidescanner.app/reset-password.html
  http://localhost:3000/dashboard.html
  ```

### Désactiver les providers inutiles
→ Désactive **Phone** si tu n'en as pas besoin

---

## ÉTAPE 5 — Modifier supabase.js avec tes vraies clés

Ouvre `/supabase.js` et remplace les deux lignes en haut :

```javascript
const SUPABASE_URL     = 'https://TON_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'ta_vraie_anon_key_ici';
```

---

## ÉTAPE 6 — Ajouter supabase.js au repo

Copie `supabase.js` à la racine de ton repo :
```
peptidescanner-app/
├── supabase.js          ← nouveau
├── login.html           ← remplacé
├── dashboard.html
├── ...
```

---

## ÉTAPE 7 — Déployer et tester

```bash
git add supabase.js login.html
git commit -m "feat: Supabase auth + couche universelle"
git push
```

Vercel redéploie automatiquement. Teste sur `https://www.peptidescanner.app/login.html` :
1. Crée un compte → vérifie que le profil apparaît dans Supabase → Table Editor → profiles
2. Connecte-toi → vérifie la redirection vers dashboard.html
3. Mot de passe oublié → vérifie l'email Supabase

---

## ÉTAPE 8 — Variables d'environnement Vercel (optionnel mais propre)

Pour ne pas avoir les clés en dur dans le JS :

1. Vercel Dashboard → ton projet → **Settings** → **Environment Variables**
2. Ajoute :
   - `NEXT_PUBLIC_SUPABASE_URL` = ton URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = ta clé

Mais comme c'est du HTML/JS pur (pas Next.js), les clés dans `supabase.js` sont OK —
la anon key est publique par design, c'est les RLS qui sécurisent les données.

---

## ÉTAPE 9 — Activer les pages protégées

Pour chaque page qui nécessite d'être connecté, ajoute en haut du `<script type="module">` :

```javascript
import { requireAuth } from '/supabase.js';
const user = await requireAuth();  // redirige vers /login.html si non connecté
const userId = user.id;
```

**Pages à protéger (toutes sauf index, login, landing) :**
- dashboard.html, cure.html, poids.html, calculateur.html
- inventaire.html, alertes.html, profil.html, ia.html, analytics.html

---

## ÉTAPE 10 — Migration localStorage (automatique)

La migration se déclenche **automatiquement** à la 1ère connexion de chaque utilisateur.
Elle lit les clés localStorage suivantes :
- `cures` → table `cures`
- `injections` → table `injections`
- `weightLogs` ou `poids` → table `weight_logs`
- `inventory` ou `stock` → table `inventory`

Une fois migrée, un flag `ps_migrated_v1` est posé en localStorage pour ne pas re-migrer.

---

## Checklist finale

- [ ] Projet Supabase créé
- [ ] Schéma SQL exécuté (7 tables visibles)
- [ ] Auth configurée (Site URL + Redirect URLs)
- [ ] `supabase.js` à jour avec les vraies clés
- [ ] `login.html` déployé
- [ ] Test inscription → confirmation email
- [ ] Test connexion → redirection dashboard
- [ ] Test `requireAuth()` sur une page protégée

---

## Prochaine étape

Une fois le setup validé, on migre les pages une par une :
1. `dashboard.html` — Today View avec données Supabase
2. `cure.html` — CRUD cures
3. `poids.html` — logs poids
4. `inventaire.html` — stock

On peut traiter ça page par page ou en lot selon ta préférence.
