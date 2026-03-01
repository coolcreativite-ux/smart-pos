# Script PowerShell pour appliquer la migration des champs de contact tenant
# Ajoute les colonnes phone, email et rccm à la table tenants

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Migration: Ajout champs contact tenant" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Charger les variables d'environnement depuis .env.development
$envFile = ".env.development"
if (Test-Path $envFile) {
    Write-Host "Chargement de $envFile..." -ForegroundColor Yellow
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
} else {
    Write-Host "Fichier $envFile introuvable!" -ForegroundColor Red
    exit 1
}

$DATABASE_URL = $env:DATABASE_URL

if (-not $DATABASE_URL) {
    Write-Host "DATABASE_URL non trouvée dans $envFile" -ForegroundColor Red
    exit 1
}

Write-Host "DATABASE_URL trouvée" -ForegroundColor Green
Write-Host ""

# Chemin du fichier de migration
$migrationFile = "database/migrations/003_add_tenant_contact_fields.sql"

if (-not (Test-Path $migrationFile)) {
    Write-Host "Fichier de migration introuvable: $migrationFile" -ForegroundColor Red
    exit 1
}

Write-Host "Exécution de la migration: $migrationFile" -ForegroundColor Yellow
Write-Host ""

# Exécuter la migration avec psql
$env:PGPASSWORD = ""
if ($DATABASE_URL -match "postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)") {
    $user = $matches[1]
    $password = $matches[2]
    $host = $matches[3]
    $port = $matches[4]
    $database = $matches[5]
    
    $env:PGPASSWORD = $password
    
    Write-Host "Connexion à la base de données..." -ForegroundColor Yellow
    Write-Host "  Host: $host" -ForegroundColor Gray
    Write-Host "  Port: $port" -ForegroundColor Gray
    Write-Host "  Database: $database" -ForegroundColor Gray
    Write-Host "  User: $user" -ForegroundColor Gray
    Write-Host ""
    
    # Exécuter la migration
    psql -h $host -p $port -U $user -d $database -f $migrationFile
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Migration appliquée avec succès!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Les colonnes phone, email et rccm ont été ajoutées à la table tenants." -ForegroundColor Green
        Write-Host "Vous pouvez maintenant renseigner ces informations dans Préférences > Informations Entreprise." -ForegroundColor Cyan
    } else {
        Write-Host ""
        Write-Host "❌ Erreur lors de l'application de la migration" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Format DATABASE_URL invalide" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Migration terminée" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
