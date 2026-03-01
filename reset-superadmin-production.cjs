const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// Configuration de la base de données de PRODUCTION
const pool = new Pool({
  connectionString: 'postgresql://postgres.qihnlmqjqhbafxqiauqo:Eyemon@2019@aws-0-eu-central-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function resetSuperAdminPassword() {
  try {
    console.log('🔄 Connexion à la base de données de PRODUCTION...');
    
    // Nouveau mot de passe
    const newPassword = 'Admin@2026';
    const passwordHash = await bcrypt.hash(newPassword, 10);
    
    // Chercher le superadmin
    const userResult = await pool.query(
      "SELECT id, username, role FROM users WHERE role = 'superadmin' ORDER BY id LIMIT 1"
    );
    
    if (userResult.rows.length === 0) {
      console.log('❌ Aucun superadmin trouvé');
      return;
    }
    
    const superadmin = userResult.rows[0];
    console.log(`✅ Superadmin trouvé: ${superadmin.username} (ID: ${superadmin.id})`);
    
    // Réinitialiser le mot de passe
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [passwordHash, superadmin.id]
    );
    
    console.log('✅ Mot de passe réinitialisé avec succès!');
    console.log('');
    console.log('=== INFORMATIONS DE CONNEXION ===');
    console.log(`Username: ${superadmin.username}`);
    console.log(`Password: ${newPassword}`);
    console.log('=================================');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await pool.end();
  }
}

resetSuperAdminPassword();
