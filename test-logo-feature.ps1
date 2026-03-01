# Script de Test - Fonctionnalité Logo d'Entreprise
# Date: 2026-02-28

Write-Host "🧪 Test de la Fonctionnalité Logo d'Entreprise" -ForegroundColor Cyan
Write-Host "=" * 60

# 1. Vérifier que la colonne logo_url existe dans la table tenants
Write-Host "`n1️⃣ Vérification de la structure de la base de données..." -ForegroundColor Yellow
$checkColumn = @"
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tenants' AND column_name = 'logo_url';
"@

Write-Host "   Requête SQL à exécuter manuellement:" -ForegroundColor Gray
Write-Host "   $checkColumn" -ForegroundColor Gray

# 2. Vérifier que le dossier uploads/logos existe
Write-Host "`n2️⃣ Vérification du dossier d'upload..." -ForegroundColor Yellow
$logoDir = "backend/uploads/logos"
if (Test-Path $logoDir) {
    Write-Host "   ✅ Dossier $logoDir existe" -ForegroundColor Green
    $files = Get-ChildItem $logoDir -File
    Write-Host "   📁 Nombre de logos: $($files.Count)" -ForegroundColor Cyan
} else {
    Write-Host "   ❌ Dossier $logoDir n'existe pas" -ForegroundColor Red
    Write-Host "   Création du dossier..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $logoDir -Force | Out-Null
    Write-Host "   ✅ Dossier créé" -ForegroundColor Green
}

# 3. Vérifier que les fichiers modifiés existent
Write-Host "`n3️⃣ Vérification des fichiers modifiés..." -ForegroundColor Yellow
$files = @(
    "backend/server.ts",
    "frontend/types.ts",
    "backend/controllers/invoices.controller.ts",
    "frontend/components/SettingsModal.tsx"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "   ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $file manquant" -ForegroundColor Red
    }
}

# 4. Vérifier que les routes existent dans server.ts
Write-Host "`n4️⃣ Vérification des routes API..." -ForegroundColor Yellow
$serverContent = Get-Content backend/server.ts -Raw

$routes = @(
    "POST /api/tenants/:id/upload-logo",
    "DELETE /api/tenants/:id/logo",
    "PATCH /api/tenants/:id"
)

foreach ($route in $routes) {
    if ($serverContent -match [regex]::Escape($route)) {
        Write-Host "   ✅ Route: $route" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Route manquante: $route" -ForegroundColor Red
    }
}

# 5. Vérifier que le type User inclut tenant
Write-Host "`n5️⃣ Vérification du type User..." -ForegroundColor Yellow
$typesContent = Get-Content frontend/types.ts -Raw

if ($typesContent -match "tenant\?:\s*\{") {
    Write-Host "   ✅ Type User inclut le champ tenant" -ForegroundColor Green
} else {
    Write-Host "   ❌ Type User ne contient pas le champ tenant" -ForegroundColor Red
}

# 6. Vérifier que SettingsModal a les fonctions d'upload
Write-Host "`n6️⃣ Vérification du composant SettingsModal..." -ForegroundColor Yellow
$settingsContent = Get-Content frontend/components/SettingsModal.tsx -Raw

$functions = @(
    "handleLogoChange",
    "handleUploadLogo",
    "handleRemoveLogo"
)

foreach ($func in $functions) {
    if ($settingsContent -match "const $func") {
        Write-Host "   ✅ Fonction: $func" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Fonction manquante: $func" -ForegroundColor Red
    }
}

# 7. Vérifier que la route de login récupère le tenant
Write-Host "`n7️⃣ Vérification de la route de login..." -ForegroundColor Yellow
if ($serverContent -match "SELECT.*logo_url.*FROM tenants") {
    Write-Host "   ✅ La route de login récupère les données du tenant" -ForegroundColor Green
} else {
    Write-Host "   ❌ La route de login ne récupère pas le tenant" -ForegroundColor Red
}

# 8. Vérifier que le contrôleur factures récupère le logo
Write-Host "`n8️⃣ Vérification du contrôleur factures..." -ForegroundColor Yellow
$invoiceContent = Get-Content backend/controllers/invoices.controller.ts -Raw

if ($invoiceContent -match "logo_url") {
    Write-Host "   ✅ Le contrôleur récupère le logo_url" -ForegroundColor Green
} else {
    Write-Host "   ❌ Le contrôleur ne récupère pas le logo_url" -ForegroundColor Red
}

# Résumé
Write-Host "`n" + "=" * 60
Write-Host "📊 RÉSUMÉ DES TESTS" -ForegroundColor Cyan
Write-Host "=" * 60

Write-Host "`n✅ Tests automatiques terminés" -ForegroundColor Green
Write-Host "`n⚠️  Tests manuels requis:" -ForegroundColor Yellow
Write-Host "   1. Démarrer le serveur backend (npm run dev)" -ForegroundColor Gray
Write-Host "   2. Démarrer le frontend (npm run dev)" -ForegroundColor Gray
Write-Host "   3. Se connecter en tant que Owner ou Admin" -ForegroundColor Gray
Write-Host "   4. Ouvrir Préférences > Informations Entreprise" -ForegroundColor Gray
Write-Host "   5. Uploader un logo" -ForegroundColor Gray
Write-Host "   6. Recharger la page et vérifier que le logo persiste" -ForegroundColor Gray
Write-Host "   7. Générer une facture et vérifier que le logo apparaît" -ForegroundColor Gray

Write-Host "`n📚 Documentation:" -ForegroundColor Cyan
Write-Host "   - FEATURE-LOGO-ENTREPRISE-2026-02-28.md (technique)" -ForegroundColor Gray
Write-Host "   - GUIDE-LOGO-ENTREPRISE.md (utilisateur)" -ForegroundColor Gray

Write-Host "`n✨ Test terminé!" -ForegroundColor Green
