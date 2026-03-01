# Script pour appliquer la migration user phone en PRODUCTION
# Date: 2026-03-01
# ATTENTION: Ce script modifie la base de donnees de PRODUCTION

Write-Host "Application de la migration user phone (PRODUCTION)..." -ForegroundColor Cyan
Write-Host "ATTENTION: Vous etes sur le point de modifier la base de donnees de PRODUCTION" -ForegroundColor Yellow
Write-Host ""

$confirmation = Read-Host "Tapez 'OUI' pour continuer"
if ($confirmation -ne 'OUI') {
    Write-Host "Operation annulee" -ForegroundColor Red
    exit 0
}

# Charger les variables d'environnement depuis .env.production
if (Test-Path "backend/.env.production") {
    Get-Content "backend/.env.production" | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
    Write-Host "Variables d'environnement chargees depuis backend/.env.production" -ForegroundColor Green
} else {
    Write-Host "Fichier backend/.env.production non trouve" -ForegroundColor Red
    exit 1
}

$DATABASE_URL = $env:DATABASE_URL

if (-not $DATABASE_URL) {
    Write-Host "DATABASE_URL non definie dans backend/.env.production" -ForegroundColor Red
    exit 1
}

Write-Host "Connexion a la base de donnees de PRODUCTION..." -ForegroundColor Yellow

# Utiliser Node.js pour appliquer la migration
Write-Host "Execution du script de migration..." -ForegroundColor Cyan
$env:NODE_ENV = "production"
node backend/scripts/apply-user-phone-migration.cjs

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Migration appliquee avec succes en PRODUCTION!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Prochaines etapes:" -ForegroundColor Cyan
    Write-Host "1. Redemarrer le serveur backend en production" -ForegroundColor White
    Write-Host "2. Tester avec un utilisateur caissier" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "Erreur lors de l'application de la migration" -ForegroundColor Red
    exit 1
}
