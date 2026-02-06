# Script de configuration de la base de données PostgreSQL
# Exécuter avec: powershell -ExecutionPolicy Bypass -File scripts/setup-db.ps1

$PSQL_PATH = "C:\Program Files\PostgreSQL\17\bin\psql.exe"

Write-Host "🚀 Configuration de la base de données PostgreSQL pour Smart POS" -ForegroundColor Cyan
Write-Host ""

# Vérifier si psql existe
if (-not (Test-Path $PSQL_PATH)) {
    Write-Host "❌ PostgreSQL non trouvé à $PSQL_PATH" -ForegroundColor Red
    Write-Host "Veuillez vérifier l'installation de PostgreSQL" -ForegroundColor Yellow
    exit 1
}

Write-Host "📝 Veuillez entrer le mot de passe de l'utilisateur 'postgres':" -ForegroundColor Yellow
$securePassword = Read-Host -AsSecureString
$env:PGPASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword))

Write-Host ""
Write-Host "🗄️  Création de la base de données gemini_pos_dev..." -ForegroundColor Green

try {
    & $PSQL_PATH -U postgres -d postgres -c "DROP DATABASE IF EXISTS gemini_pos_dev; CREATE DATABASE gemini_pos_dev;" 2>$null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Base de données créée avec succès!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 Application du schéma..." -ForegroundColor Green
        
        & $PSQL_PATH -U postgres -d gemini_pos_dev -f "database/schema.sql" 2>$null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Schéma appliqué avec succès!" -ForegroundColor Green
            Write-Host ""
            Write-Host "🎉 Configuration terminée!" -ForegroundColor Cyan
            Write-Host "Vous pouvez maintenant démarrer l'application avec:" -ForegroundColor White
            Write-Host "  npm run dev" -ForegroundColor Yellow
        } else {
            Write-Host "❌ Erreur lors de l'application du schéma" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ Erreur lors de la création de la base de données" -ForegroundColor Red
        Write-Host "Vérifiez le mot de passe et que PostgreSQL est démarré" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    # Nettoyer la variable d'environnement
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "Appuyez sur une touche pour continuer..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")