# Script de test pour la migration user phone (environnement de developpement)
# Date: 2026-03-01

Write-Host "Test de la migration user phone (developpement)..." -ForegroundColor Cyan

# Charger les variables d'environnement depuis .env.development
if (Test-Path "backend/.env.development") {
    Get-Content "backend/.env.development" | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
    Write-Host "Variables d'environnement chargees depuis backend/.env.development" -ForegroundColor Green
} else {
    Write-Host "Fichier backend/.env.development non trouve" -ForegroundColor Red
    exit 1
}

$DATABASE_URL = $env:DATABASE_URL

if (-not $DATABASE_URL) {
    Write-Host "DATABASE_URL non definie dans backend/.env.development" -ForegroundColor Red
    exit 1
}

Write-Host "Connexion a la base de donnees de developpement..." -ForegroundColor Yellow

# Verifier si la colonne phone existe deja
Write-Host "Verification de l'existence de la colonne phone..." -ForegroundColor Cyan
$checkQuery = "SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'phone';"
$result = psql $DATABASE_URL -t -c $checkQuery

if ($result -match "phone") {
    Write-Host "La colonne phone existe deja dans la table users" -ForegroundColor Yellow
} else {
    Write-Host "La colonne phone n'existe pas, application de la migration..." -ForegroundColor Cyan
    
    # Appliquer la migration
    $migrationFile = "database/migrations/004_add_user_phone.sql"
    
    if (Test-Path $migrationFile) {
        psql $DATABASE_URL -f $migrationFile
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Migration appliquee avec succes!" -ForegroundColor Green
        } else {
            Write-Host "Erreur lors de l'application de la migration" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "Fichier de migration non trouve: $migrationFile" -ForegroundColor Red
        exit 1
    }
}

# Verifier la structure de la table users
Write-Host ""
Write-Host "Structure de la table users:" -ForegroundColor Cyan
$structureQuery = "SELECT column_name, data_type, character_maximum_length, is_nullable FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position;"
psql $DATABASE_URL -c $structureQuery

Write-Host ""
Write-Host "Test termine!" -ForegroundColor Green
Write-Host ""
Write-Host "Prochaines etapes:" -ForegroundColor Cyan
Write-Host "1. Redemarrer le serveur backend: cd backend puis npm run dev" -ForegroundColor White
Write-Host "2. Tester la mise a jour des informations personnelles dans l interface" -ForegroundColor White
