# Fix: Sales History Quantity Display Issue

## Problem Summary
Quantities in the sales history interface were showing as `undefined` or multiplied incorrectly. The root cause was a SQL query bug in the backend that caused items to not be returned properly.

## Root Cause
The backend SQL query in `GET /api/sales` endpoint was using `json_each_text()` instead of `jsonb_each_text()` for the `selected_options` column (which is `jsonb` type). This caused the query to fail silently, returning `items: undefined` to the frontend.

## What Was Fixed

### Backend (backend/server.ts)
✅ Changed `json_each_text(pv.selected_options)` to `jsonb_each_text(pv.selected_options)` in the GET /api/sales endpoint (line ~2063)

### Frontend
✅ Added debug logging to track quantity values through the data pipeline
✅ Verified that no quantity transformation logic exists in the frontend

## How to Apply the Fix

### Step 1: Restart Backend Server
```bash
# Stop the current backend server (Ctrl+C)
cd backend
npm run dev
```

### Step 2: Clear Browser Cache
Open `clear-sales-cache.html` in your browser and follow the instructions:
1. Click "Nettoyer globalSalesHistory" to clear stale sales data
2. Click "Recharger l'application" to reload the app

**OR** manually in browser console:
```javascript
localStorage.removeItem('globalSalesHistory');
location.reload();
```

### Step 3: Test the Fix
1. Navigate to the Sales History page
2. Check that quantities display correctly
3. Create a new sale with quantity 1, 2, 3, etc.
4. Verify the quantities appear correctly in the history

## Testing Tools Created

### test-sales-endpoint.cjs
Tests the backend API directly to verify items are returned correctly:
```bash
node test-sales-endpoint.cjs
```

### clear-sales-cache.html
User-friendly interface to clear localStorage cache and reload the app.

## Verification Checklist
- [ ] Backend server restarted
- [ ] Browser localStorage cleared
- [ ] Sales history displays correct quantities
- [ ] New sales show correct quantities
- [ ] No console errors about undefined items

## Technical Details

### Database Query (Fixed)
```sql
SELECT 
  s.*,
  COALESCE(
    json_agg(
      json_build_object(
        'id', CONCAT(si.product_id, '-', si.variant_id),
        'productId', si.product_id,
        'productName', p.name,
        'variantName', COALESCE(
          (SELECT STRING_AGG(CONCAT(key, ': ', value), ', ')
           FROM jsonb_each_text(pv.selected_options)),  -- ✅ Fixed: was json_each_text
          'Standard'
        ),
        'quantity', si.quantity,
        'returnedQuantity', COALESCE(si.returned_quantity, 0)
      ) ORDER BY si.id
    ) FILTER (WHERE si.id IS NOT NULL),
    '[]'::json
  ) as items
FROM sales s
LEFT JOIN sale_items si ON s.id = si.sale_id
LEFT JOIN products p ON si.product_id = p.id
LEFT JOIN product_variants pv ON si.variant_id = pv.id
GROUP BY s.id
ORDER BY s.created_at DESC
```

### Data Flow
1. Backend query returns items array with correct quantities
2. SalesHistoryContext loads data and maps to Sale objects
3. SalesHistory component displays quantities without transformation
4. No multiplication or conversion happens in the frontend

## Notes
- The quantity is stored correctly in the database (verified with check-sale-quantities.cjs)
- The frontend code does not multiply quantities by 10
- The issue was purely in the SQL query returning undefined items
- After clearing cache, the app will reload fresh data from the API

## Date Fixed
2026-02-27
