# Script PowerShell pour créer un SuperAdmin
# Usage: .\create-superadmin.ps1

Write-Host "🔐 Création du SuperAdmin..." -ForegroundColor Cyan
Write-Host ""

# Aller dans le dossier backend
Set-Location backend

# Exécuter le script Node.js
node scripts/add-superadmin.cjs

# Retourner au dossier racine
Set-Location ..

Write-Host ""
Write-Host "✅ Script terminé!" -ForegroundColor Green
Write-Host ""
Write-Host "🔑 Vous pouvez maintenant vous connecter avec:" -ForegroundColor Yellow
Write-Host "   Username: superadmin" -ForegroundColor White
Write-Host "   Password: admin123" -ForegroundColor White
Write-Host ""
