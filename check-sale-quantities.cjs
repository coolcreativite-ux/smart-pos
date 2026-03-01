const { Pool } = require('pg');
const dotenv = require('dotenv');

// Charger les variables d'environnement
dotenv.config({ path: 'backend/.env.development' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

async function checkSaleQuantities() {
  try {
    console.log('🔍 Vérification des quantités dans sale_items...\n');
    
    // Récupérer les dernières ventes avec leurs items
    const result = await pool.query(`
      SELECT 
        s.id as sale_id,
        s.created_at,
        si.id as item_id,
        si.product_id,
        si.variant_id,
        si.quantity,
        si.unit_price,
        si.total_price,
        p.name as product_name
      FROM sales s
      JOIN sale_items si ON s.id = si.sale_id
      JOIN products p ON si.product_id = p.id
      ORDER BY s.created_at DESC
      LIMIT 10
    `);
    
    console.log(`📊 ${result.rows.length} items trouvés dans les dernières ventes:\n`);
    
    result.rows.forEach(row => {
      console.log(`  Sale: ${row.sale_id.substring(0, 8)}...`);
      console.log(`  Produit: ${row.product_name}`);
      console.log(`  Quantité: ${row.quantity} (type: ${typeof row.quantity})`);
      console.log(`  Prix unitaire: ${row.unit_price}`);
      console.log(`  Prix total: ${row.total_price}`);
      console.log(`  Calcul: ${row.quantity} x ${row.unit_price} = ${row.quantity * row.unit_price}`);
      console.log(`  Match: ${row.quantity * row.unit_price === parseFloat(row.total_price) ? '✅' : '❌'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await pool.end();
  }
}

checkSaleQuantities();
