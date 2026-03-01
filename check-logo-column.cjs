const { Pool } = require('pg');
require('dotenv').config({ path: 'backend/.env.development' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkColumn() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'tenants' AND column_name = 'logo_url'
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Colonne logo_url existe déjà dans la table tenants');
      console.log('   Type:', result.rows[0].data_type);
    } else {
      console.log('❌ Colonne logo_url manquante dans la table tenants');
      console.log('\n📝 Migration nécessaire:');
      console.log('ALTER TABLE tenants ADD COLUMN logo_url TEXT;');
    }
    
    await pool.end();
  } catch (error) {
    console.error('Erreur:', error.message);
    process.exit(1);
  }
}

checkColumn();
