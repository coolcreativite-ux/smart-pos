const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.development') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkUsers() {
  try {
    console.log('👥 Liste des utilisateurs:\n');

    const result = await pool.query('SELECT id, username, tenant_id, role FROM users ORDER BY id');
    
    console.log('ID | Username | Tenant ID | Role');
    console.log('---|----------|-----------|-----');
    result.rows.forEach(user => {
      console.log(`${user.id}  | ${user.username.padEnd(8)} | ${user.tenant_id}         | ${user.role}`);
    });

    console.log(`\n📊 Total: ${result.rows.length} utilisateurs`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await pool.end();
  }
}

checkUsers();
