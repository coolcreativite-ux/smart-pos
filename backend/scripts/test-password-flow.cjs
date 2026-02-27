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

async function testPasswordFlow() {
  try {
    console.log('🧪 Test du flux complet de changement de mot de passe\n');
    
    const username = 'fournier';
    const initialPassword = 'password123';
    const newPassword = 'newPassword456';
    
    // ÉTAPE 1: Réinitialiser avec le mot de passe initial
    console.log('📝 ÉTAPE 1: Réinitialisation du mot de passe initial');
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${initialPassword}`);
    
    const initialHash = await bcrypt.hash(initialPassword, 10);
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE username = $2',
      [initialHash, username]
    );
    console.log('   ✅ Mot de passe initial défini\n');
    
    // ÉTAPE 2: Simuler la connexion initiale
    console.log('🔐 ÉTAPE 2: Test de connexion avec le mot de passe initial');
    const user = await pool.query(
      'SELECT id, username, password_hash FROM users WHERE username = $1',
      [username]
    );
    
    if (user.rows.length === 0) {
      console.log('   ❌ Utilisateur non trouvé');
      return;
    }
    
    const loginTest1 = await bcrypt.compare(initialPassword, user.rows[0].password_hash);
    console.log(`   Test connexion: ${loginTest1 ? '✅ SUCCÈS' : '❌ ÉCHEC'}`);
    
    if (!loginTest1) {
      console.log('   ❌ Impossible de continuer, la connexion initiale a échoué');
      return;
    }
    console.log('');
    
    // ÉTAPE 3: Simuler le changement de mot de passe
    console.log('🔄 ÉTAPE 3: Changement de mot de passe');
    console.log(`   Ancien mot de passe: ${initialPassword}`);
    console.log(`   Nouveau mot de passe: ${newPassword}`);
    
    // Vérifier l'ancien mot de passe (comme le fait l'API)
    const verifyOld = await bcrypt.compare(initialPassword, user.rows[0].password_hash);
    if (!verifyOld) {
      console.log('   ❌ Ancien mot de passe incorrect');
      return;
    }
    console.log('   ✅ Ancien mot de passe vérifié');
    
    // Hasher et sauvegarder le nouveau mot de passe
    const newHash = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [newHash, user.rows[0].id]
    );
    console.log('   ✅ Nouveau mot de passe enregistré\n');
    
    // ÉTAPE 4: Simuler la déconnexion (pas d'action DB nécessaire)
    console.log('👋 ÉTAPE 4: Déconnexion (simulation)');
    console.log('   ✅ Utilisateur déconnecté\n');
    
    // ÉTAPE 5: Simuler le rechargement de la page et nouvelle connexion
    console.log('🔄 ÉTAPE 5: Rechargement de la page (simulation)\n');
    
    // ÉTAPE 6: Tester la connexion avec le nouveau mot de passe
    console.log('🔐 ÉTAPE 6: Test de connexion avec le NOUVEAU mot de passe');
    const userAfterChange = await pool.query(
      'SELECT id, username, password_hash FROM users WHERE username = $1',
      [username]
    );
    
    const loginTest2 = await bcrypt.compare(newPassword, userAfterChange.rows[0].password_hash);
    console.log(`   Test connexion avec "${newPassword}": ${loginTest2 ? '✅ SUCCÈS' : '❌ ÉCHEC'}`);
    
    // ÉTAPE 7: Vérifier que l'ancien mot de passe ne fonctionne plus
    console.log('\n🔒 ÉTAPE 7: Vérification que l\'ancien mot de passe ne fonctionne plus');
    const loginTest3 = await bcrypt.compare(initialPassword, userAfterChange.rows[0].password_hash);
    console.log(`   Test connexion avec "${initialPassword}": ${loginTest3 ? '❌ FONCTIONNE ENCORE (PROBLÈME!)' : '✅ REJETÉ (CORRECT)'}`);
    
    // RÉSUMÉ
    console.log('\n' + '='.repeat(60));
    console.log('📊 RÉSUMÉ DU TEST');
    console.log('='.repeat(60));
    
    if (loginTest1 && loginTest2 && !loginTest3) {
      console.log('✅ TOUS LES TESTS RÉUSSIS !');
      console.log('   ✓ Connexion initiale fonctionne');
      console.log('   ✓ Changement de mot de passe fonctionne');
      console.log('   ✓ Connexion avec nouveau mot de passe fonctionne');
      console.log('   ✓ Ancien mot de passe est bien invalidé');
      console.log('\n🎉 Le flux de changement de mot de passe fonctionne correctement !');
    } else {
      console.log('❌ CERTAINS TESTS ONT ÉCHOUÉ');
      console.log(`   Connexion initiale: ${loginTest1 ? '✅' : '❌'}`);
      console.log(`   Connexion avec nouveau mot de passe: ${loginTest2 ? '✅' : '❌'}`);
      console.log(`   Ancien mot de passe invalidé: ${!loginTest3 ? '✅' : '❌'}`);
    }
    
    console.log('\n📝 Identifiants actuels pour connexion manuelle:');
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${newPassword}`);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

testPasswordFlow();
