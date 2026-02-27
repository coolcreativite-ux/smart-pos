const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.development') });

async function checkProductVariantsTable() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('📊 Structure de la table product_variants:\n');
    
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'product_variants' 
      ORDER BY ordinal_position
    `);
    
    result.rows.forEach(col => {
      console.log(`  ${col.column_name.padEnd(25)} ${col.data_type.padEnd(20)} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    console.log('\n📝 Exemple de données:');
    const data = await pool.query('SELECT * FROM product_variants LIMIT 1');
    if (data.rows.length > 0) {
      console.log(JSON.stringify(data.rows[0], null, 2));
    } else {
      console.log('  Aucune donnée');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await pool.end();
  }
}

checkProductVariantsTable();
