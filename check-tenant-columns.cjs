const { Pool } = require('pg');
require('dotenv').config({ path: 'backend/.env.development' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

async function checkColumns() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type, character_maximum_length, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'tenants'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Colonnes de la table tenants:');
    console.log('=====================================');
    result.rows.forEach(row => {
      const length = row.character_maximum_length ? `(${row.character_maximum_length})` : '';
      console.log(`- ${row.column_name} (${row.data_type}${length})`);
    });
    
    // Vérifier spécifiquement les colonnes importantes
    const requiredColumns = ['phone', 'email', 'rccm', 'logo_url'];
    console.log('\n🔍 Vérification des colonnes requises:');
    requiredColumns.forEach(col => {
      const exists = result.rows.find(r => r.column_name === col);
      console.log(`  ${col}: ${exists ? '✅ EXISTE' : '❌ MANQUANTE'}`);
    });
    
    await pool.end();
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

checkColumns();
