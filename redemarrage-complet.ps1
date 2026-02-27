# Script PowerShell pour redémarrage complet avec nettoyage

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  REDEMARRAGE COMPLET DU FRONTEND" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Aller dans le dossier frontend
Set-Location frontend

# Arrêter les processus Node existants
Write-Host "1. Arret des processus Node..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "   OK - Processus arretes" -ForegroundColor Green
Write-Host ""

# Supprimer le cache Vite
Write-Host "2. Suppression du cache Vite..." -ForegroundColor Yellow
if (Test-Path "node_modules\.vite") {
    Remove-Item -Recurse -Force "node_modules\.vite" -ErrorAction SilentlyContinue
    Write-Host "   OK - Cache Vite supprime" -ForegroundColor Green
} else {
    Write-Host "   OK - Pas de cache a supprimer" -ForegroundColor Gray
}
Write-Host ""

# Supprimer le dossier dist
Write-Host "3. Suppression du dossier dist..." -ForegroundColor Yellow
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist" -ErrorAction SilentlyContinue
    Write-Host "   OK - Dossier dist supprime" -ForegroundColor Green
} else {
    Write-Host "   OK - Pas de dossier dist" -ForegroundColor Gray
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "  NETTOYAGE TERMINE !" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "4. Demarrage du serveur..." -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANT:" -ForegroundColor Yellow
Write-Host "  - Attendez que le serveur demarre completement" -ForegroundColor Yellow
Write-Host "  - Puis rafraichissez le navigateur avec Ctrl+Shift+R" -ForegroundColor Yellow
Write-Host ""

# Démarrer le serveur
npm run dev

# Retour au dossier racine
Set-Location ..
