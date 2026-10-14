#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# PeptideScanner — prépare le dossier www/ que Capacitor met dans l'appli.
# Créé le 14/10/2026 (lot 2). Lancé par : npm run www  (ou cap:ios / cap:android)
#
# Copie UNIQUEMENT les fichiers de l'appli. Ne copie jamais : l'admin
# (ps-admin-x7k9m), _archive/, _to_delete/, docs/, supabase/, node_modules/, sw.js.
# www/ est un dossier fabriqué (ignoré par Git) : il est vidé puis refait à chaque fois.
# S'arrête à la première erreur (set -e) : un fichier manquant = pas d'appli bancale.
# ═══════════════════════════════════════════════════════════════
set -euo pipefail
cd "$(dirname "$0")/.."

PAGES="index.html login.html reset-password.html avertissement.html dashboard.html cure.html poids.html inventaire.html
alertes.html analytics.html calculateur.html peptide-database.html profil.html
cgu.html privacy.html mentions-legales.html"
FILES="manifest.json lang.js ps-app.js peptidescanner.css peptidescanner-extra.css legal.css favicon.svg favicon.ico apple-touch-icon.png"
DIRS="fonts vendor brand icons"

rm -rf www
mkdir -p www
for f in $PAGES $FILES; do
  [ -f "$f" ] || { echo "MANQUANT : $f" >&2; exit 1; }
  cp "$f" www/
done
for d in $DIRS; do
  [ -d "$d" ] || { echo "DOSSIER MANQUANT : $d" >&2; exit 1; }
  cp -R "$d" www/
done
echo "www/ prêt : $(find www -type f | wc -l | tr -d ' ') fichiers"
