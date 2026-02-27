# Script pour lancer l'application et tester le système de facturation
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  LANCEMENT ET TEST - SYSTÈME FACTURES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Vérifier la base de données
Write-Host "1. Vérification de la base de données..." -ForegroundColor Yellow
node check-db-tables.cjs
Write-Host ""

# 2. Demander si on doit démarrer l'application
Write-Host "2. Démarrage de l'application" -ForegroundColor Yellow
$response = Read-Host "Voulez-vous démarrer l'application maintenant? (O/N)"

if ($response -eq 'O' -or $response -eq 'o') {
    Write-Host ""
    Write-Host "Démarrage du backend..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; npm run dev"
    
    Write-Host "Attente de 5 secondes pour le démarrage du backend..." -ForegroundColor Gray
    Start-Sleep -Seconds 5
    
    Write-Host "Démarrage du frontend..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm run dev"
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  APPLICATION DÉMARRÉE!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Backend:  http://localhost:5000" -ForegroundColor Cyan
    Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Attente de 10 secondes pour que tout démarre..." -ForegroundColor Gray
    Start-Sleep -Seconds 10
    
    # 3. Tester l'API
    Write-Host ""
    Write-Host "3. Test de l'API de facturation..." -ForegroundColor Yellow
    node test-invoice-creation.cjs
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  PRÊT À UTILISER!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Ouvrez votre navigateur:" -ForegroundColor Cyan
    Write-Host "  http://localhost:3000" -ForegroundColor White
    Write-Host ""
    Write-Host "Puis:" -ForegroundColor Cyan
    Write-Host "  1. Connectez-vous avec un compte Owner" -ForegroundColor White
    Write-Host "  2. Cliquez sur l'onglet 'Factures'" -ForegroundColor White
    Write-Host "  3. Créez votre première facture!" -ForegroundColor White
    Write-Host ""
    
} else {
    Write-Host ""
    Write-Host "Pour démarrer manuellement:" -ForegroundColor Yellow
    Write-Host "  .\start-app.ps1" -ForegroundColor White
    Write-Host ""
}

Write-Host "Documentation disponible:" -ForegroundColor Cyan
Write-Host "  - DEMARRAGE-RAPIDE.md" -ForegroundColor White
Write-Host "  - GUIDE-DEMARRAGE-FACTURES.md" -ForegroundColor White
Write-Host "  - README-FACTURES.md" -ForegroundColor White
Write-Host ""
Write-Host "Appuyez sur une touche pour fermer..."
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
