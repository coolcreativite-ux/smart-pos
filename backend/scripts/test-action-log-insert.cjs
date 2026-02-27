const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.development') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function testInsert() {
  try {
    console.log('🧪 Test d\'insertion dans action_logs...\n');

    // Récupérer un utilisateur existant
    const userResult = await pool.query('SELECT id, tenant_id, username FROM users LIMIT 1');
    
    if (userResult.rows.length === 0) {
      console.log('❌ Aucun utilisateur trouvé dans la base');
      return;
    }

    const user = userResult.rows[0];
    console.log('👤 Utilisateur trouvé:', user);
    console.log('');

    // Tenter l'insertion
    console.log('📝 Tentative d\'insertion...');
    const insertResult = await pool.query(
      'INSERT INTO action_logs (tenant_id, user_id, action, details) VALUES ($1, $2, $3, $4) RETURNING *',
      [user.tenant_id, user.id, 'TEST_ACTION', 'Test depuis script']
    );

    console.log('✅ Insertion réussie!');
    console.log('📊 Résultat:', insertResult.rows[0]);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('   Code:', error.code);
    if (error.detail) console.error('   Détail:', error.detail);
    if (error.constraint) console.error('   Contrainte:', error.constraint);
  } finally {
    await pool.end();
  }
}

testInsert();
