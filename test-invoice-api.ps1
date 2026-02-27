# Script de test de l'API de facturation
Write-Host "=== TEST API FACTURATION ===" -ForegroundColor Cyan
Write-Host ""

# Données de test pour créer une facture
$testData = @{
    documentType = "invoice"
    invoiceType = "B2C"
    documentSubtype = "standard"
    customerData = @{
        name = "Client Test"
        phone = "0123456789"
        email = "test@example.com"
        address = "Abidjan, Côte d'Ivoire"
    }
    paymentMethod = "Espèces"
    items = @(
        @{
            productId = 1
            variantId = 1
            quantity = 1
            unitPriceHT = 10000
            discountPercent = 0
            tvaRate = 18
        }
    )
    globalDiscountPercent = 0
    additionalTaxes = @()
} | ConvertTo-Json -Depth 10

Write-Host "Envoi de la requête POST à http://localhost:5000/api/invoices..." -ForegroundColor Yellow
Write-Host ""

try {
    $response = Invoke-WebRequest `
        -Uri "http://localhost:5000/api/invoices" `
        -Method POST `
        -Headers @{
            "Content-Type" = "application/json"
            "x-tenant-id" = "1"
            "x-user-id" = "1"
        } `
        -Body $testData `
        -TimeoutSec 30 `
        -ErrorAction Stop
    
    Write-Host "✓ Succès! Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host ""
    Write-Host "Réponse:" -ForegroundColor Cyan
    $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
    
} catch {
    Write-Host "✗ Erreur!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "Message: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Détails de l'erreur:" -ForegroundColor Yellow
        Write-Host $responseBody -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "Appuyez sur une touche pour continuer..."
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
