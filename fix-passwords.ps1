# Script PowerShell pour réparer les mots de passe
# Usage: .\fix-passwords.ps1

Write-Host "🔧 Réparation des mots de passe utilisateurs..." -ForegroundColor Cyan
Write-Host ""

# Aller dans le dossier backend
Set-Location backend

# Exécuter le script Node.js
node scripts/fix-user-passwords.cjs

# Retourner au dossier racine
Set-Location ..

Write-Host ""
Write-Host "✅ Script terminé!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Conseil: Rafraîchissez la page de connexion (F5)" -ForegroundColor Yellow
Write-Host ""
