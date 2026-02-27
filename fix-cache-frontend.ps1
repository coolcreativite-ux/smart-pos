# Script PowerShell pour nettoyer le cache frontend et redémarrer

Write-Host "🔧 Nettoyage du cache frontend..." -ForegroundColor Cyan

# Aller dans le dossier frontend
Set-Location frontend

# Arrêter les processus Node existants (optionnel)
Write-Host "⏹️  Arrêt des processus Node existants..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Supprimer le cache Vite
Write-Host "🗑️  Suppression du cache Vite..." -ForegroundColor Yellow
if (Test-Path "node_modules/.vite") {
    Remove-Item -Recurse -Force "node_modules/.vite"
    Write-Host "✅ Cache Vite supprimé" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Pas de cache Vite à supprimer" -ForegroundColor Gray
}

# Supprimer le dossier dist
Write-Host "🗑️  Suppression du dossier dist..." -ForegroundColor Yellow
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
    Write-Host "✅ Dossier dist supprimé" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Pas de dossier dist à supprimer" -ForegroundColor Gray
}

Write-Host ""
Write-Host "✅ Nettoyage terminé!" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Démarrage du serveur de développement..." -ForegroundColor Cyan
Write-Host ""

# Démarrer le serveur
npm run dev

# Retour au dossier racine
Set-Location ..
