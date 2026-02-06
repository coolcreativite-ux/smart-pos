# Script de vérification de la structure du projet

Write-Host "🔍 Vérification de la structure du projet Smart POS" -ForegroundColor Cyan
Write-Host ""

$errors = 0

# Vérifier les dossiers principaux
$folders = @("frontend", "backend", "shared", "database")
foreach ($folder in $folders) {
    if (Test-Path $folder) {
        Write-Host "✅ Dossier $folder existe" -ForegroundColor Green
    } else {
        Write-Host "❌ Dossier $folder manquant" -ForegroundColor Red
        $errors++
    }
}

Write-Host ""

# Vérifier les fichiers essentiels du frontend
Write-Host "📦 Frontend:" -ForegroundColor Yellow
$frontendFiles = @(
    "frontend/package.json",
    "frontend/Dockerfile",
    "frontend/nginx.conf",
    "frontend/vite.config.ts",
    "frontend/.env.example"
)
foreach ($file in $frontendFiles) {
    if (Test-Path $file) {
        Write-Host "  ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $file manquant" -ForegroundColor Red
        $errors++
    }
}

Write-Host ""

# Vérifier les fichiers essentiels du backend
Write-Host "🔧 Backend:" -ForegroundColor Yellow
$backendFiles = @(
    "backend/package.json",
    "backend/Dockerfile",
    "backend/server.ts",
    "backend/.env.example"
)
foreach ($file in $backendFiles) {
    if (Test-Path $file) {
        Write-Host "  ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $file manquant" -ForegroundColor Red
        $errors++
    }
}

Write-Host ""

# Résumé
if ($errors -eq 0) {
    Write-Host "🎉 Structure du projet validée avec succès!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Prochaines étapes:" -ForegroundColor Cyan
    Write-Host "1. cd frontend; npm install"
    Write-Host "2. cd backend; npm install"
    Write-Host "3. Configurer les fichiers .env"
    Write-Host "4. Pousser sur GitHub"
} else {
    Write-Host "Erreurs detectees: $errors" -ForegroundColor Red
}
