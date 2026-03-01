const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config({ path: 'backend/.env.development' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

async function testSalesAPI() {
  try {
    const result = await pool.query(`
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
        ) as items,
        json_build_object(
          'id', u.id,
          'username', u.username,
          'role', u.role
        ) as user
      FROM sales s
      LEFT JOIN sale_items si ON s.id = si.sale_id
      LEFT JOIN products p ON si.product_id = p.id
      LEFT JOIN product_variants pv ON si.variant_id = pv.id
      LEFT JOIN users u ON s.user_id = u.id
      GROUP BY s.id, u.id, u.username, u.role
      ORDER BY s.created_at DESC
      LIMIT 1
    `);
    
    if (result.rows.length > 0) {
      console.log('📦 Première vente:');
      console.log(JSON.stringify(result.rows[0], null, 2));
      console.log('\n📊 Items:');
      console.log(JSON.stringify(result.rows[0].items, null, 2));
    } else {
      console.log('Aucune vente trouvée');
    }
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await pool.end();
  }
}

testSalesAPI();
