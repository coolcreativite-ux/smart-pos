const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.development') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function testActionLogWithUser() {
  try {
    console.log('🧪 Test d\'insertion d\'action log avec utilisateur réel...\n');

    // Récupérer un utilisateur existant
    const userResult = await pool.query('SELECT id, tenant_id, username FROM users WHERE id = 5');
    
    if (userResult.rows.length === 0) {
      console.log('❌ Utilisateur avec ID 5 non trouvé');
      return;
    }

    const user = userResult.rows[0];
    console.log('👤 Utilisateur:', user);
    console.log('');

    // Simuler une mise à jour d'utilisateur
    console.log('📝 Simulation: Mise à jour du mot de passe...');
    const insertResult = await pool.query(
      'INSERT INTO action_logs (tenant_id, user_id, action, details) VALUES ($1, $2, $3, $4) RETURNING *',
      [user.tenant_id, user.id, 'Password Change', 'Password updated successfully']
    );

    console.log('✅ Action log créé avec succès!');
    console.log('📊 Résultat:', insertResult.rows[0]);
    console.log('');

    // Vérifier avec user_id = 0 (devrait échouer)
    console.log('🧪 Test avec user_id = 0 (devrait échouer)...');
    try {
      await pool.query(
        'INSERT INTO action_logs (tenant_id, user_id, action, details) VALUES ($1, $2, $3, $4)',
        [1, 0, 'Test Action', 'This should fail']
      );
      console.log('❌ ERREUR: L\'insertion avec user_id=0 a réussi (ne devrait pas!)');
    } catch (error) {
      console.log('✅ Échec attendu:', error.message);
      console.log('   Code:', error.code);
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('   Code:', error.code);
    if (error.detail) console.error('   Détail:', error.detail);
  } finally {
    await pool.end();
  }
}

testActionLogWithUser();
