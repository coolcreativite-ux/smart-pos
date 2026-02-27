# Script de diagnostic du système de facturation
Write-Host "=== DIAGNOSTIC SYSTÈME DE FACTURATION ===" -ForegroundColor Cyan
Write-Host ""

# 1. Vérifier si le backend est en cours d'exécution
Write-Host "1. Vérification du backend..." -ForegroundColor Yellow
$backendProcess = Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*backend*" }
if ($backendProcess) {
    Write-Host "   ✓ Backend en cours d'exécution (PID: $($backendProcess.Id))" -ForegroundColor Green
} else {
    Write-Host "   ✗ Backend non détecté" -ForegroundColor Red
}
Write-Host ""

# 2. Tester la connexion à l'API
Write-Host "2. Test de connexion à l'API..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   ✓ API accessible (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "   ✗ API non accessible: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 3. Vérifier les variables d'environnement
Write-Host "3. Vérification des variables d'environnement..." -ForegroundColor Yellow
if (Test-Path "backend/.env.development") {
    Write-Host "   ✓ Fichier backend/.env.development trouvé" -ForegroundColor Green
    $envContent = Get-Content "backend/.env.development" | Where-Object { $_ -match "DATABASE_URL" }
    if ($envContent) {
        Write-Host "   ✓ DATABASE_URL configuré" -ForegroundColor Green
    } else {
        Write-Host "   ✗ DATABASE_URL non trouvé" -ForegroundColor Red
    }
} else {
    Write-Host "   ✗ Fichier backend/.env.development non trouvé" -ForegroundColor Red
}
Write-Host ""

# 4. Vérifier si la migration existe
Write-Host "4. Vérification de la migration..." -ForegroundColor Yellow
if (Test-Path "database/migrations/001_add_invoice_system.sql") {
    Write-Host "   ✓ Fichier de migration trouvé" -ForegroundColor Green
    $migrationSize = (Get-Item "database/migrations/001_add_invoice_system.sql").Length
    Write-Host "   ✓ Taille: $migrationSize octets" -ForegroundColor Green
} else {
    Write-Host "   ✗ Fichier de migration non trouvé" -ForegroundColor Red
}
Write-Host ""

# 5. Vérifier les logs du backend
Write-Host "5. Recherche d'erreurs récentes dans les logs..." -ForegroundColor Yellow
Write-Host "   (Vérifiez le terminal du backend pour les erreurs détaillées)" -ForegroundColor Gray
Write-Host ""

Write-Host "=== ACTIONS RECOMMANDÉES ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Si vous voyez une erreur 500:" -ForegroundColor Yellow
Write-Host "1. Vérifiez les logs du terminal backend pour l'erreur exacte" -ForegroundColor White
Write-Host "2. Vérifiez que PostgreSQL est démarré" -ForegroundColor White
Write-Host "3. Vérifiez que la migration a été exécutée:" -ForegroundColor White
Write-Host "   - Ouvrez pgAdmin ou un client PostgreSQL" -ForegroundColor Gray
Write-Host "   - Connectez-vous à la base 'smart_pos'" -ForegroundColor Gray
Write-Host "   - Vérifiez que les tables existent: invoices, invoice_items, invoice_taxes" -ForegroundColor Gray
Write-Host "4. Si les tables n'existent pas, exécutez la migration:" -ForegroundColor White
Write-Host "   - Utilisez pgAdmin pour exécuter database/migrations/001_add_invoice_system.sql" -ForegroundColor Gray
Write-Host ""
Write-Host "Appuyez sur une touche pour continuer..."
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
