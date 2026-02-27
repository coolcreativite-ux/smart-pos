# Script PowerShell pour lancer l'application complète

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  LANCEMENT DE L'APPLICATION" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Fonction pour démarrer un processus en arrière-plan
function Start-BackgroundProcess {
    param(
        [string]$Name,
        [string]$Path,
        [string]$Command
    )
    
    Write-Host "Demarrage de $Name..." -ForegroundColor Yellow
    
    $process = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Path'; $Command" -PassThru
    
    Write-Host "  OK - $Name demarre (PID: $($process.Id))" -ForegroundColor Green
    Write-Host ""
    
    return $process
}

# Démarrer le backend
$backendProcess = Start-BackgroundProcess -Name "Backend" -Path "$PSScriptRoot\backend" -Command "npm run dev"

# Attendre 3 secondes pour que le backend démarre
Write-Host "Attente du demarrage du backend..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
Write-Host ""

# Démarrer le frontend
$frontendProcess = Start-BackgroundProcess -Name "Frontend" -Path "$PSScriptRoot\frontend" -Command "npm run dev"

Write-Host "========================================" -ForegroundColor Green
Write-Host "  APPLICATION DEMARREE !" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backend:  http://localhost:5000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Pour arreter l'application:" -ForegroundColor Yellow
Write-Host "  - Fermez les fenetres PowerShell ouvertes" -ForegroundColor Yellow
Write-Host "  - Ou appuyez sur Ctrl+C dans chaque fenetre" -ForegroundColor Yellow
Write-Host ""
Write-Host "Appuyez sur une touche pour fermer cette fenetre..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
