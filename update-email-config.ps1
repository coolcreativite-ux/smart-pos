# Script PowerShell pour mettre à jour la configuration email
# Usage: .\update-email-config.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Configuration Email - SmartPOS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Nouvelle configuration
$NEW_FROM_EMAIL = "contact@cooldigital.africa"
$NEW_FROM_NAME = "Cool Digital Africa"

Write-Host "📧 Nouvelle configuration :" -ForegroundColor Yellow
Write-Host "  Email expéditeur: $NEW_FROM_EMAIL"
Write-Host "  Nom expéditeur: $NEW_FROM_NAME"
Write-Host ""

# Confirmation
$confirmation = Read-Host "Voulez-vous mettre à jour tous les fichiers .env ? (O/N)"
if ($confirmation -ne 'O' -and $confirmation -ne 'o') {
    Write-Host "❌ Opération annulée" -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "🔄 Mise à jour des fichiers..." -ForegroundColor Cyan
Write-Host ""

# Fonction pour mettre à jour un fichier
function Update-EnvFile {
    param (
        [string]$FilePath,
        [string]$FromEmail,
        [string]$FromName
    )
    
    if (Test-Path $FilePath) {
        Write-Host "  📝 Mise à jour de $FilePath..." -ForegroundColor Gray
        
        # Lire le contenu
        $content = Get-Content $FilePath -Raw
        
        # Remplacer VITE_FROM_EMAIL
        if ($content -match 'VITE_FROM_EMAIL=') {
            $content = $content -replace 'VITE_FROM_EMAIL=.*', "VITE_FROM_EMAIL=$FromEmail"
            Write-Host "    ✅ VITE_FROM_EMAIL mis à jour" -ForegroundColor Green
        } else {
            $content += "`nVITE_FROM_EMAIL=$FromEmail"
            Write-Host "    ➕ VITE_FROM_EMAIL ajouté" -ForegroundColor Green
        }
        
        # Remplacer VITE_FROM_NAME
        if ($content -match 'VITE_FROM_NAME=') {
            $content = $content -replace 'VITE_FROM_NAME=.*', "VITE_FROM_NAME=$FromName"
            Write-Host "    ✅ VITE_FROM_NAME mis à jour" -ForegroundColor Green
        } else {
            $content += "`nVITE_FROM_NAME=$FromName"
            Write-Host "    ➕ VITE_FROM_NAME ajouté" -ForegroundColor Green
        }
        
        # Remplacer FROM_EMAIL (backend)
        if ($content -match 'FROM_EMAIL=') {
            $content = $content -replace 'FROM_EMAIL=.*', "FROM_EMAIL=$FromEmail"
            Write-Host "    ✅ FROM_EMAIL mis à jour" -ForegroundColor Green
        }
        
        # Remplacer FROM_NAME (backend)
        if ($content -match 'FROM_NAME=') {
            $content = $content -replace 'FROM_NAME=.*', "FROM_NAME=$FromName"
            Write-Host "    ✅ FROM_NAME mis à jour" -ForegroundColor Green
        }
        
        # Écrire le contenu
        Set-Content -Path $FilePath -Value $content -NoNewline
        Write-Host "    💾 Fichier sauvegardé" -ForegroundColor Green
        Write-Host ""
    } else {
        Write-Host "  ⚠️  Fichier non trouvé: $FilePath" -ForegroundColor Yellow
        Write-Host ""
    }
}

# Mettre à jour tous les fichiers
Update-EnvFile -FilePath "frontend\.env.development" -FromEmail $NEW_FROM_EMAIL -FromName $NEW_FROM_NAME
Update-EnvFile -FilePath "frontend\.env.production" -FromEmail $NEW_FROM_EMAIL -FromName $NEW_FROM_NAME
Update-EnvFile -FilePath "backend\.env.development" -FromEmail $NEW_FROM_EMAIL -FromName $NEW_FROM_NAME
Update-EnvFile -FilePath "backend\.env.production" -FromEmail $NEW_FROM_EMAIL -FromName $NEW_FROM_NAME
Update-EnvFile -FilePath ".env.local" -FromEmail $NEW_FROM_EMAIL -FromName $NEW_FROM_NAME
Update-EnvFile -FilePath ".env.production" -FromEmail $NEW_FROM_EMAIL -FromName $NEW_FROM_NAME

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Mise à jour terminée !" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Prochaines étapes :" -ForegroundColor Yellow
Write-Host "  1. Vérifiez que le domaine cooldigital.africa est vérifié dans Resend"
Write-Host "  2. Redémarrez l'application (frontend et backend)"
Write-Host "  3. Testez l'envoi d'un email"
Write-Host ""
Write-Host "🔗 Ressources :" -ForegroundColor Cyan
Write-Host "  - Guide complet: CONFIGURATION-COOLDIGITAL-AFRICA.md"
Write-Host "  - Vérifier le domaine: https://resend.com/domains"
Write-Host "  - Tester: test-resend-config.html"
Write-Host ""
Write-Host "⚠️  Important :" -ForegroundColor Yellow
Write-Host "  Le domaine cooldigital.africa doit être vérifié dans Resend"
Write-Host "  avant de pouvoir envoyer des emails."
Write-Host ""
Write-Host "  Suivez le guide CONFIGURATION-COOLDIGITAL-AFRICA.md pour"
Write-Host "  configurer les DNS et vérifier le domaine."
Write-Host ""
