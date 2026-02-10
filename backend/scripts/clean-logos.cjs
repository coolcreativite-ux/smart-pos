const { Pool } = require('pg');
require('dotenv').config({ path: '.env.development' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

async function cleanLogos() {
  try {
    console.log('🗑️  Suppression des anciens logos base64...\n');
    
    const result = await pool.query(
      "DELETE FROM app_settings WHERE key IN ('saas_logo_url', 'saas_favicon_url') RETURNING key"
    );
    
    console.log(`✅ ${result.rowCount} logos supprimés:`);
    result.rows.forEach(row => console.log(`   - ${row.key}`));
    
    console.log('\n✨ Base de données nettoyée ! Vous pouvez maintenant uploader de nouveaux logos.\n');
    
    await pool.end();
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

cleanLogos();
