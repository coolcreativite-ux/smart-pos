const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.development') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function resetPassword() {
  try {
    // Demander quel utilisateur
    console.log('🔐 Réinitialisation de mot de passe\n');
    
    // Lister les utilisateurs
    const users = await pool.query('SELECT id, username, email FROM users ORDER BY id');
    console.log('Utilisateurs disponibles:');
    users.rows.forEach(u => {
      console.log(`  ${u.id}. ${u.username} (${u.email || 'pas d\'email'})`);
    });
    
    // Pour cet exemple, réinitialisons l'utilisateur "fournier" (ID 5) avec le mot de passe "password123"
    const userId = 5;
    const newPassword = 'password123';
    
    console.log(`\n🔄 Réinitialisation du mot de passe pour l'utilisateur ID ${userId}...`);
    console.log(`   Nouveau mot de passe: ${newPassword}`);
    
    // Hasher le nouveau mot de passe
    const passwordHash = await bcrypt.hash(newPassword, 10);
    console.log(`   Hash généré: ${passwordHash.substring(0, 20)}...`);
    
    // Mettre à jour dans la base de données
    const result = await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING username',
      [passwordHash, userId]
    );
    
    if (result.rows.length > 0) {
      console.log(`\n✅ Mot de passe réinitialisé pour: ${result.rows[0].username}`);
      console.log(`   Username: ${result.rows[0].username}`);
      console.log(`   Password: ${newPassword}`);
      console.log(`\n📝 Utilisez ces identifiants pour vous connecter.`);
    } else {
      console.log('❌ Utilisateur non trouvé');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await pool.end();
  }
}

resetPassword();
