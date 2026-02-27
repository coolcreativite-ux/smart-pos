# Script pour vérifier les migrations en production
# Compare les structures entre dev et prod

Write-Host "=== VERIFICATION DES MIGRATIONS PRODUCTION ===" -ForegroundColor Cyan

# Charger les variables d'environnement de production
$envProd = Get-Content backend/.env.production | ForEach-Object {
    if ($_ -match '^DATABASE_URL=(.+)$') {
        $matches[1]
    }
}

Write-Host "`nBase de données PRODUCTION:" -ForegroundColor Yellow
Write-Host $envProd

Write-Host "`n=== 1. Vérification table INVOICES ===" -ForegroundColor Cyan
$query1 = "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'invoices');"
Write-Host "Query: $query1"

Write-Host "`n=== 2. Vérification colonnes CUSTOMERS (ncc, address) ===" -ForegroundColor Cyan
$query2 = "SELECT column_name FROM information_schema.columns WHERE table_name = 'customers' AND column_name IN ('ncc', 'address');"
Write-Host "Query: $query2"

Write-Host "`n=== 3. Vérification colonnes TENANTS (ncc, address) ===" -ForegroundColor Cyan
$query3 = "SELECT column_name FROM information_schema.columns WHERE table_name = 'tenants' AND column_name IN ('ncc', 'address');"
Write-Host "Query: $query3"

Write-Host "`n=== 4. Vérification table RETURN_TRANSACTIONS ===" -ForegroundColor Cyan
$query4 = "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'return_transactions');"
Write-Host "Query: $query4"

Write-Host "`n=== 5. Vérification table INVOICE_ITEMS ===" -ForegroundColor Cyan
$query5 = "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'invoice_items');"
Write-Host "Query: $query5"

Write-Host "`n=== 6. Vérification table INVOICE_SEQUENCES ===" -ForegroundColor Cyan
$query6 = "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'invoice_sequences');"
Write-Host "Query: $query6"

Write-Host "`n=== 7. Vérification table INVOICE_TAXES ===" -ForegroundColor Cyan
$query7 = "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'invoice_taxes');"
Write-Host "Query: $query7"

Write-Host "`n" -ForegroundColor Green
Write-Host "INSTRUCTIONS:" -ForegroundColor Yellow
Write-Host "1. Connectez-vous à votre base de données de production"
Write-Host "2. Exécutez chaque query ci-dessus"
Write-Host "3. Si une table/colonne n'existe pas, exécutez la migration correspondante:"
Write-Host "   - Migration 001: database/migrations/001_add_invoice_system.sql"
Write-Host "   - Migration 002: database/migrations/002_add_tenant_invoice_fields.sql"
Write-Host "   - Migration 003: database/migrations/add_return_transactions.sql"
