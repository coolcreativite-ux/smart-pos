const { Pool } = require('pg');
require('dotenv').config({ path: '.env.development' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

async function checkLogos() {
  try {
    const result = await pool.query(
      "SELECT key, LEFT(value, 100) as value_preview, LENGTH(value) as value_length FROM app_settings WHERE key LIKE 'saas_%_url'"
    );
    
    console.log('\n📋 Logos actuels dans la base de données:\n');
    result.rows.forEach(row => {
      console.log(`Key: ${row.key}`);
      console.log(`Preview: ${row.value_preview}`);
      console.log(`Length: ${row.value_length} caractères`);
      console.log('---');
    });
    
    await pool.end();
  } catch (error) {
    console.error('Erreur:', error);
    process.exit(1);
  }
}

checkLogos();
