# Verification script for sales quantity fix
# Run this after restarting the backend server

Write-Host "🔍 Verifying Sales Quantity Fix..." -ForegroundColor Cyan
Write-Host ""

# Check if backend is running
Write-Host "1️⃣ Checking if backend is running on port 5000..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/sales" -Method GET -TimeoutSec 5
    Write-Host "   ✅ Backend is running" -ForegroundColor Green
    
    # Parse response
    $sales = $response.Content | ConvertFrom-Json
    Write-Host "   ✅ Received $($sales.Count) sales" -ForegroundColor Green
    
    if ($sales.Count -gt 0) {
        $firstSale = $sales[0]
        Write-Host ""
        Write-Host "2️⃣ Checking first sale data..." -ForegroundColor Yellow
        Write-Host "   Sale ID: $($firstSale.id.Substring(0, 12))..." -ForegroundColor White
        Write-Host "   Items: $($firstSale.items)" -ForegroundColor White
        Write-Host "   Items type: $($firstSale.items.GetType().Name)" -ForegroundColor White
        Write-Host "   Items count: $($firstSale.items.Count)" -ForegroundColor White
        
        if ($firstSale.items -and $firstSale.items.Count -gt 0) {
            Write-Host "   ✅ Items are present" -ForegroundColor Green
            
            $firstItem = $firstSale.items[0]
            Write-Host ""
            Write-Host "3️⃣ Checking first item..." -ForegroundColor Yellow
            Write-Host "   Product: $($firstItem.productName)" -ForegroundColor White
            Write-Host "   Variant: $($firstItem.variantName)" -ForegroundColor White
            Write-Host "   Quantity: $($firstItem.quantity)" -ForegroundColor White
            Write-Host "   ✅ Quantity is: $($firstItem.quantity)" -ForegroundColor Green
            
            if ($firstItem.quantity -ne $null) {
                Write-Host ""
                Write-Host "✅ SUCCESS! Sales API is returning items with quantities correctly!" -ForegroundColor Green
            } else {
                Write-Host ""
                Write-Host "⚠️ WARNING: Quantity is null/undefined" -ForegroundColor Red
            }
        } else {
            Write-Host "   ❌ No items in first sale!" -ForegroundColor Red
            Write-Host ""
            Write-Host "⚠️ Items are undefined or empty. This means:" -ForegroundColor Yellow
            Write-Host "   - The SQL query might still have an issue" -ForegroundColor Yellow
            Write-Host "   - Or there are no sale_items in the database" -ForegroundColor Yellow
        }
    } else {
        Write-Host ""
        Write-Host "⚠️ No sales found in database" -ForegroundColor Yellow
        Write-Host "   Create a test sale to verify the fix" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "   ❌ Backend is not running or not responding" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please start the backend server:" -ForegroundColor Yellow
    Write-Host "   cd backend" -ForegroundColor White
    Write-Host "   npm run dev" -ForegroundColor White
}

Write-Host ""
Write-Host "4️⃣ Next steps:" -ForegroundColor Yellow
Write-Host "   1. If backend is not running, start it with 'npm run dev'" -ForegroundColor White
Write-Host "   2. Open clear-sales-cache.html in your browser" -ForegroundColor White
Write-Host "   3. Click 'Nettoyer globalSalesHistory'" -ForegroundColor White
Write-Host "   4. Click 'Recharger l'application'" -ForegroundColor White
Write-Host "   5. Check sales history in the app" -ForegroundColor White
Write-Host ""
