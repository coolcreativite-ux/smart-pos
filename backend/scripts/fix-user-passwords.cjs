// Script pour réparer les mots de passe des utilisateurs
// Usage: node scripts/fix-user-passwords.cjs

const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.development' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

async function fixUserPasswords() {
  try {
    console.log('🔍 Vérification des utilisateurs...\n');
    
    // 1. Lister tous les utilisateurs
    const users = await pool.query('SELECT id, username, role, password_hash FROM users ORDER BY id');
    
    console.log(`📋 ${users.rows.length} utilisateurs trouvés:\n`);
    
    for (const user of users.rows) {
      console.log(`   ID: ${user.id}`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Password Hash: ${user.password_hash ? '✅ Existe' : '❌ MANQUANT'}`);
      console.log('');
    }
    
    // 2. Demander si on veut réparer
    console.log('🔧 Réparation des mots de passe...\n');
    
    // Mot de passe par défaut: "admin123"
    const defaultPassword = 'admin123';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);
    
    let fixed = 0;
    
    for (const user of users.rows) {
      // Vérifier si le password_hash est valide
      if (!user.password_hash || user.password_hash.length < 10) {
        console.log(`   ⚠️  Réparation de ${user.username}...`);
        
        await pool.query(
          'UPDATE users SET password_hash = $1 WHERE id = $2',
          [passwordHash, user.id]
        );
        
        console.log(`   ✅ Mot de passe réparé pour ${user.username}`);
        fixed++;
      }
    }
    
    console.log('');
    console.log(`✅ ${fixed} utilisateur(s) réparé(s)\n`);
    
    if (fixed > 0) {
      console.log('🔑 Tous les utilisateurs réparés ont maintenant le mot de passe:');
      console.log(`   Password: ${defaultPassword}\n`);
    }
    
    // 3. Afficher les identifiants de connexion
    console.log('📋 Identifiants de connexion disponibles:\n');
    
    const updatedUsers = await pool.query('SELECT username, role FROM users ORDER BY id');
    
    for (const user of updatedUsers.rows) {
      console.log(`   Username: ${user.username}`);
      console.log(`   Password: ${defaultPassword}`);
      console.log(`   Role: ${user.role}`);
      console.log('');
    }
    
    console.log('🚀 Vous pouvez maintenant vous connecter!\n');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await pool.end();
  }
}

fixUserPasswords();
