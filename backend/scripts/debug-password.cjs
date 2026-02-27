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

async function debugPassword() {
  try {
    console.log('🔍 Debug du mot de passe pour fournier\n');
    
    // Récupérer l'utilisateur
    const result = await pool.query(
      'SELECT id, username, password_hash FROM users WHERE username = $1',
      ['fournier']
    );
    
    if (result.rows.length === 0) {
      console.log('❌ Utilisateur "fournier" non trouvé');
      return;
    }
    
    const user = result.rows[0];
    console.log('👤 Utilisateur trouvé:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Hash actuel: ${user.password_hash}`);
    console.log(`   Longueur du hash: ${user.password_hash ? user.password_hash.length : 0}`);
    
    // Tester avec différents mots de passe
    const testPasswords = ['password123', 'Password123', 'admin', 'fournier'];
    
    console.log('\n🧪 Test de comparaison bcrypt:');
    for (const pwd of testPasswords) {
      const isMatch = await bcrypt.compare(pwd, user.password_hash);
      console.log(`   "${pwd}": ${isMatch ? '✅ MATCH' : '❌ NO MATCH'}`);
    }
    
    // Générer un nouveau hash pour "password123"
    console.log('\n🔄 Génération d\'un nouveau hash pour "password123":');
    const newHash = await bcrypt.hash('password123', 10);
    console.log(`   Nouveau hash: ${newHash}`);
    
    // Tester le nouveau hash
    const testNew = await bcrypt.compare('password123', newHash);
    console.log(`   Test du nouveau hash: ${testNew ? '✅ MATCH' : '❌ NO MATCH'}`);
    
    // Proposer de mettre à jour
    console.log('\n💾 Mise à jour du mot de passe avec le nouveau hash...');
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [newHash, user.id]
    );
    console.log('✅ Mot de passe mis à jour!');
    
    // Vérifier la mise à jour
    const verify = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [user.id]
    );
    const finalTest = await bcrypt.compare('password123', verify.rows[0].password_hash);
    console.log(`\n🔍 Vérification finale: ${finalTest ? '✅ MATCH' : '❌ NO MATCH'}`);
    console.log('\n📝 Vous pouvez maintenant vous connecter avec:');
    console.log('   Username: fournier');
    console.log('   Password: password123');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

debugPassword();
