require('dotenv').config({ path: './backend/.env.development' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function testQuery() {
  try {
    console.log('🔍 Testing SQL query directly...\n');
    
    // Test 1: Simple query to get one sale with items
    console.log('Test 1: Get one sale with sale_items joined');
    const test1 = await pool.query(`
      SELECT 
        s.id,
        s.created_at,
        si.id as item_id,
        si.quantity,
        p.name as product_name,
        pv.selected_options
      FROM sales s
      LEFT JOIN sale_items si ON s.id = si.sale_id
      LEFT JOIN products p ON si.product_id = p.id
      LEFT JOIN product_variants pv ON si.variant_id = pv.id
      LIMIT 5
    `);
    
    console.log(`✅ Found ${test1.rows.length} rows`);
    if (test1.rows.length > 0) {
      console.log('First row:', test1.rows[0]);
    }
    
    // Test 2: Test jsonb_each_text function
    console.log('\n\nTest 2: Test jsonb_each_text on selected_options');
    const test2 = await pool.query(`
      SELECT 
        pv.id,
        pv.selected_options,
        (SELECT STRING_AGG(CONCAT(key, ': ', value), ', ')
         FROM jsonb_each_text(pv.selected_options)) as variant_name
      FROM product_variants pv
      WHERE pv.selected_options IS NOT NULL
      LIMIT 5
    `);
    
    console.log(`✅ Found ${test2.rows.length} variants`);
    test2.rows.forEach(row => {
      console.log(`  Variant ${row.id}: ${row.variant_name}`);
    });
    
    // Test 3: Full aggregation query (simplified)
    console.log('\n\nTest 3: Test json_agg with items');
    const test3 = await pool.query(`
      SELECT 
        s.id,
        json_agg(
          json_build_object(
            'productId', si.product_id,
            'quantity', si.quantity,
            'productName', p.name
          )
        ) FILTER (WHERE si.id IS NOT NULL) as items
      FROM sales s
      LEFT JOIN sale_items si ON s.id = si.sale_id
      LEFT JOIN products p ON si.product_id = p.id
      GROUP BY s.id
      LIMIT 3
    `);
    
    console.log(`✅ Found ${test3.rows.length} sales`);
    test3.rows.forEach(sale => {
      console.log(`  Sale ${sale.id.substring(0, 8)}... has ${sale.items ? sale.items.length : 0} items`);
      if (sale.items && sale.items.length > 0) {
        console.log(`    First item:`, sale.items[0]);
      }
    });
    
    // Test 4: Full query from server.ts
    console.log('\n\nTest 4: Full query from server.ts');
    const test4 = await pool.query(`
      SELECT 
        s.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', CONCAT(si.product_id, '-', si.variant_id),
              'productId', si.product_id,
              'productName', p.name,
              'imageUrl', p.image_url,
              'variantName', COALESCE(
                (SELECT STRING_AGG(CONCAT(key, ': ', value), ', ')
                 FROM jsonb_each_text(pv.selected_options)),
                'Standard'
              ),
              'variant', json_build_object(
                'id', pv.id,
                'selectedOptions', pv.selected_options,
                'price', pv.price,
                'costPrice', pv.cost_price,
                'sku', pv.sku,
                'barcode', pv.barcode
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
      LIMIT 3
    `);
    
    console.log(`✅ Found ${test4.rows.length} sales`);
    test4.rows.forEach(sale => {
      console.log(`\n  Sale ${sale.id.substring(0, 8)}...`);
      console.log(`    Items:`, sale.items);
      console.log(`    Items type:`, typeof sale.items);
      console.log(`    Items is array:`, Array.isArray(sale.items));
      if (sale.items && sale.items.length > 0) {
        console.log(`    First item quantity:`, sale.items[0].quantity);
      }
    });
    
    await pool.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    await pool.end();
  }
}

testQuery();
