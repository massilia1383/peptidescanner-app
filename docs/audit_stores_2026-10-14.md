> **Décisions prises le 14/10/2026 après cet audit** : appli **uniquement** sur l'App Store et Google Play (plus de web ni de bureau) ; abonnement via **RevenueCat**, Lemon Squeezy abandonné ; page **Boutiques retirée** de l'appli (l'option « garder sur le web » tombe avec la fin du web) ; conseiller IA retiré. Voir `docs/reprise/note_reprise_2026-10-14.md`.

# Audit stores — PeptideScanner
*14 octobre 2026 — audit fait sur le code synchronisé dans le projet et sur les règles officielles en vigueur (Apple : version du 6 février 2026).*

## Verdict

**En l'état : refus probable sur les deux stores.**
**Après corrections : faisable.** Des applis comparables sont déjà en ligne. Exemple : *Dosed — Peptide Tracker* sur l'App Store, avec bibliothèque (BPC-157, TB-500, GLP-1), calculateur de reconstitution, abonnement payé via Apple et classement 18+.
La différence entre « refusé » et « accepté » tient surtout à **trois choses** : la page Boutiques, le paiement, et la suppression de compte.

---

## 🔴 Bloquants — refus quasi certain

### 1. La page Boutiques
Ce qu'on y trouve aujourd'hui : des liens affiliés et des codes promo vers des vendeurs de BPC-157, TB-500, IGF-1 LR3, CJC-1295… Et aussi vers « GLP1 Direct » et « PepLab France », qui vendent **semaglutide et tirzepatide**, des médicaments sur ordonnance.
- **Google Play** : *« Google Play n'autorise pas les applis qui font la promotion ou la vente de substances non approuvées, quelles que soient les affirmations de légalité. »* Et : *« pas d'applis qui facilitent l'achat de médicaments sur ordonnance sans ordonnance. »*
- **Apple, règle 1.4.3** : interdit de faciliter la vente de substances contrôlées. En pratique, un relecteur santé qui voit des codes promo pour des peptides « de recherche » et des GLP-1 sans ordonnance refusera.
- À noter : l'appli Dosed, acceptée, écrit noir sur blanc qu'elle *« ne vend, ne distribue ni ne recommande aucune substance »*.

**Correction :** retirer la page Boutiques de la version store (elle peut rester sur le site web). Retirer aussi toute mention des boutiques sur les fiches peptides, la landing et la démo.

### 2. Le paiement par Lemon Squeezy
- **Apple, règle 3.1.1** : un abonnement qui débloque des fonctions **doit** passer par l'achat intégré Apple. Seule exception : la boutique **américaine**, où un lien vers un paiement externe est désormais autorisé. En France, en Thaïlande et ailleurs, un bouton « S'abonner — 59 €/an » qui ouvre Lemon Squeezy = refus.
- **Google Play** : même principe avec Google Play Billing. Il existe des régimes de facturation alternative (UE, US), mais avec démarches et commission.
- Dans l'UE, Apple prend 15 % via lien externe (10 % pour un abonnement après la 1re année), contre 26 % via achat intégré.

**Correction :** dans les applis store, passer l'abonnement par Apple / Google (via un service comme RevenueCat), ou retirer tout bouton d'achat dans l'appli (modèle « on paye sur le site, on se connecte dans l'appli »).

### 3. La suppression de compte
- **Apple, règle 5.1.1(v)** : *« si votre appli permet de créer un compte, elle doit aussi permettre de le supprimer dans l'appli. »* Google exige la même chose, avec en plus un lien web de suppression.
- Aujourd'hui, le Profil propose **« Supprimer toutes mes données »**. Ce bouton efface les données, pas le compte. Côté admin, `deleteUser` supprime la ligne `profiles`, mais pas le compte de connexion Supabase. Or la page Confidentialité promet « Profil → Zone de danger → Supprimer » le compte.

**Correction :** un vrai bouton « Supprimer mon compte », qui appelle une Edge Function supprimant l'utilisateur côté authentification (déploiement par toi, pas par moi).

---

## 🟠 Risques sérieux — refus possible selon le relecteur

### 4. Une appli qui n'est « qu'un site web » (Apple 4.2)
PeptideScanner est une PWA. Mise telle quelle dans un emballage (Capacitor ou équivalent), Apple peut répondre : *« rien de plus qu'un site web reconditionné »*.
**Correction :** ajouter du natif visible, par exemple notifications locales pour les rappels d'injection (les notifications web actuelles marchent mal sur iPhone), Face ID, et lien Santé (Apple Health) pour le poids. Google est plus souple (Trusted Web Activity).

### 5. Le calculateur de dose (Apple 1.4.2)
*« Les calculateurs de dose de médicament doivent venir du fabricant, d'un hôpital, d'une université, d'une pharmacie… ou être approuvés par la FDA. »*
Des concurrents passent avec un **calculateur de reconstitution** (volume, concentration, unités de seringue : de l'arithmétique sur les chiffres de l'utilisateur). Ce qui ferait tomber : que l'appli **propose** elle-même une dose.
**Correction :** présenter l'outil comme un convertisseur (« vous entrez votre dose, il donne le volume »), sans dose suggérée.

### 6. Les recommandations de dosage (Apple 1.4.1, Google « contenu santé nuisible »)
- La bibliothèque donne des posologies et des protocoles pour des produits non approuvés, et parfois les vante. Exemples relevés : Retatrutide *« probablement la prochaine révolution »*, AOD-9604 *« profil de sécurité excellent »*, un stack BPC-157 + TB-500 *« de référence pour toute blessure sportive »*.
- La landing et la démo montrent l'IA répondant *« Protocole BPC-157 pour douleur au genou : 250 mcg 2× par jour… »*. C'est de la prescription.
- Badge landing : *« Révolution thérapeutique »*.

**Correction :** ton neutre et documentaire (phase de recherche, statut réglementaire, études citées). Pas de « protocole recommandé » pour les produits non approuvés. Conseiller IA désactivé dans la version store (déjà `IA_ENABLED = false`, à garder ainsi), et exemples retirés des écrans de démo.

### 7. La politique de confidentialité ne dit pas la vérité technique
- Elle dit que l'IA est traitée par **Anthropic (USA)**. D'après le projet, c'est **Gemini (Google)**.
- Elle dit que les données sont en **localStorage** sur l'appareil. Elles sont dans Supabase depuis la migration.
- Les fiches « confidentialité » des stores (Apple App Privacy, Google Data Safety) devront correspondre exactement. Une incohérence est un motif de refus, et un problème RGPD vu qu'il s'agit de **données de santé**.

---

## 🟢 Obligations administratives — sans risque, mais à faire

- **Classement d'âge 18+** sur les deux stores (comme Dosed). Les CGU le disent déjà.
- **Google** : formulaire « Health apps declaration » dans la Console. Mention obligatoire *« n'est pas un dispositif médical et ne diagnostique, ne traite, ne guérit ni ne prévient aucune maladie »*, plus un rappel de consulter un professionnel. Le texte actuel s'en approche, à aligner mot pour mot.
- **Google**, compte développeur personnel récent : un test fermé avec un groupe de testeurs pendant 14 jours avant la publication (règle connue depuis 2023, à revérifier au moment de l'inscription).
- **Comptes développeur** : Apple 99 $/an, Google 25 $ une fois.
- **Tarifs** : trois versions différentes dans le code (landing 0/5/19 €, démo et profil 59 €/an, CGU 59 €/an ou 9,90 €/mois). À unifier avant toute fiche store.
- **Captures d'écran**, icône 1024 px, descriptions FR/EN, URL de confidentialité : tout est faisable avec ce qui existe.

---

## La décision qui t'appartient

Retirer les Boutiques des applis store, c'est retirer la **source de revenus affiliés** prévue. Trois options :

| Option | Stores | Revenu affilié |
|---|---|---|
| A. Boutiques retirées de l'appli, gardées sur le site web | ✅ passe | conservé côté web uniquement, sans lien depuis l'appli |
| B. Boutiques limitées au matériel (seringues, eau BAC, labos d'analyse) | probable, à confirmer | réduit |
| C. Garder les boutiques | ❌ refus | — |

**Ma recommandation : A.** Les stores servent à l'acquisition et à l'abonnement, le site garde le modèle affilié. Combinée avec B pour le matériel si tu veux un peu d'affiliation dans l'appli.

## Ordre de travail proposé
1. Décider A / B / C, puis les tarifs réels.
2. Corrections de contenu : bibliothèque, démo, landing, confidentialité. *Peut se faire dans le lot D.*
3. Vrai bouton « Supprimer mon compte » + Edge Function.
4. Choix du paiement en appli (RevenueCat ou « paiement sur le site uniquement »).
5. Emballage Capacitor + notifications natives : c'est le seul vrai chantier technique nouveau.
6. Fiches store, captures, test fermé Google, soumission.

---
**Sources :** [Règles Apple App Review, fév. 2026](https://developer.apple.com/support/downloads/terms/app-review-guidelines/App-Review-Guidelines-English-UK.pdf) · [Google Play — santé, substances non approuvées](https://support.google.com/googleplay/android-developer/answer/9878878) · [Google — liste non exhaustive des produits interdits](https://support.google.com/adspolicy/answer/2423645?hl=en) · [Dosed — Peptide Tracker (App Store)](https://apps.apple.com/us/app/-/id6753125648) · [Règles de paiement par région 2026](https://braindetox.kr/en/posts/app_store_policy_regional_divergence.html)
