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

async function testChangePasswordAPI() {
  try {
    console.log('🧪 Test de l\'API de changement de mot de passe\n');
    
    const username = 'fournier';
    const userId = 5;
    const currentPassword = 'password123';
    const newPassword = 'testPassword789';
    
    // ÉTAPE 1: Réinitialiser avec le mot de passe initial
    console.log('📝 ÉTAPE 1: Réinitialisation du mot de passe à "password123"');
    const initialHash = await bcrypt.hash(currentPassword, 10);
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [initialHash, userId]
    );
    console.log('   ✅ Mot de passe initial défini\n');
    
    // ÉTAPE 2: Simuler l'appel API de changement de mot de passe
    console.log('🔐 ÉTAPE 2: Simulation de l\'appel API PATCH /api/users/5/password');
    console.log(`   Ancien mot de passe: ${currentPassword}`);
    console.log(`   Nouveau mot de passe: ${newPassword}`);
    
    // Récupérer l'utilisateur
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    
    if (userResult.rows.length === 0) {
      console.log('   ❌ Utilisateur non trouvé');
      return;
    }

    const user = userResult.rows[0];
    console.log(`   👤 Utilisateur trouvé: ${user.username}`);

    // Vérifier l'ancien mot de passe
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    console.log(`   🔍 Vérification ancien mot de passe: ${isValidPassword ? '✅ VALIDE' : '❌ INVALIDE'}`);
    
    if (!isValidPassword) {
      console.log('   ❌ Ancien mot de passe incorrect - ARRÊT');
      return;
    }

    // Hasher le nouveau mot de passe
    const new_password_hash = await bcrypt.hash(newPassword, 10);
    console.log(`   🔐 Nouveau hash généré: ${new_password_hash.substring(0, 20)}...`);

    // Mettre à jour le mot de passe
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [new_password_hash, userId]
    );

    console.log('   ✅ Mot de passe mis à jour dans la DB\n');
    
    // ÉTAPE 3: Vérifier que le nouveau mot de passe fonctionne
    console.log('🔍 ÉTAPE 3: Vérification du nouveau mot de passe');
    const verifyResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    const testNewPassword = await bcrypt.compare(newPassword, verifyResult.rows[0].password_hash);
    console.log(`   Test connexion avec "${newPassword}": ${testNewPassword ? '✅ SUCCÈS' : '❌ ÉCHEC'}`);
    
    // ÉTAPE 4: Vérifier que l'ancien mot de passe ne fonctionne plus
    console.log('\n🔒 ÉTAPE 4: Vérification que l\'ancien mot de passe ne fonctionne plus');
    const testOldPassword = await bcrypt.compare(currentPassword, verifyResult.rows[0].password_hash);
    console.log(`   Test connexion avec "${currentPassword}": ${testOldPassword ? '❌ FONCTIONNE ENCORE' : '✅ REJETÉ'}`);
    
    // RÉSUMÉ
    console.log('\n' + '='.repeat(60));
    console.log('📊 RÉSUMÉ');
    console.log('='.repeat(60));
    
    if (testNewPassword && !testOldPassword) {
      console.log('✅ CHANGEMENT DE MOT DE PASSE RÉUSSI !');
      console.log('\n📝 Vous pouvez maintenant vous connecter avec:');
      console.log(`   Username: ${username}`);
      console.log(`   Password: ${newPassword}`);
    } else {
      console.log('❌ PROBLÈME DÉTECTÉ');
      console.log(`   Nouveau mot de passe fonctionne: ${testNewPassword ? '✅' : '❌'}`);
      console.log(`   Ancien mot de passe rejeté: ${!testOldPassword ? '✅' : '❌'}`);
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

testChangePasswordAPI();
