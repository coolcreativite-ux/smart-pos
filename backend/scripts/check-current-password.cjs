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

async function checkPassword() {
  try {
    console.log('🔍 Vérification du mot de passe actuel pour fournier\n');
    
    // Récupérer l'utilisateur
    const result = await pool.query(
      'SELECT id, username, password_hash, email, first_name, last_name, role FROM users WHERE username = $1',
      ['fournier']
    );
    
    if (result.rows.length === 0) {
      console.log('❌ Utilisateur "fournier" non trouvé');
      return;
    }
    
    const user = result.rows[0];
    console.log('👤 Informations utilisateur:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   First Name: ${user.first_name}`);
    console.log(`   Last Name: ${user.last_name}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Hash: ${user.password_hash}`);
    console.log(`   Hash length: ${user.password_hash ? user.password_hash.length : 0}`);
    
    // Tester avec différents mots de passe
    const testPasswords = [
      'password123',
      'newPassword456',
      'admin123',
      'fournier',
      'Password123',
      'admin'
    ];
    
    console.log('\n🧪 Test de différents mots de passe:');
    let foundMatch = false;
    for (const pwd of testPasswords) {
      const isMatch = await bcrypt.compare(pwd, user.password_hash);
      if (isMatch) {
        console.log(`   "${pwd}": ✅ MATCH ← C'EST CELUI-CI !`);
        foundMatch = true;
      } else {
        console.log(`   "${pwd}": ❌ NO MATCH`);
      }
    }
    
    if (!foundMatch) {
      console.log('\n⚠️  Aucun des mots de passe testés ne correspond !');
      console.log('   Le hash dans la DB ne correspond à aucun mot de passe connu.');
      console.log('\n💡 Solution: Réinitialiser le mot de passe avec le script debug-password.cjs');
    } else {
      console.log('\n✅ Mot de passe trouvé ! Utilisez-le pour vous connecter.');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

checkPassword();
