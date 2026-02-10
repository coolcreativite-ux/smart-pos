// Script pour réinitialiser le mot de passe du SuperAdmin
// Usage: node scripts/reset-superadmin-password.cjs [nouveau_mot_de_passe]

const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.development' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function resetSuperAdminPassword() {
  try {
    console.log('🔐 Réinitialisation du mot de passe SuperAdmin...');
    
    // Récupérer le nouveau mot de passe depuis les arguments ou utiliser par défaut
    const newPassword = process.argv[2] || 'admin123';
    
    console.log(`📝 Nouveau mot de passe: ${newPassword}`);
    
    // Hash du nouveau mot de passe
    const passwordHash = await bcrypt.hash(newPassword, 10);
    
    // Vérifier si le superadmin existe
    const checkResult = await pool.query(
      'SELECT id, username FROM users WHERE role = $1 LIMIT 1', 
      ['superadmin']
    );
    
    if (checkResult.rows.length === 0) {
      console.log('❌ Aucun SuperAdmin trouvé dans la base de données.');
      console.log('💡 Utilisez le script create-superadmin.cjs pour en créer un.');
      return;
    }
    
    const superAdmin = checkResult.rows[0];
    console.log(`👤 SuperAdmin trouvé: ${superAdmin.username} (ID: ${superAdmin.id})`);
    
    // Mettre à jour le mot de passe
    const updateResult = await pool.query(`
      UPDATE users 
      SET password_hash = $1
      WHERE id = $2
      RETURNING username, email, first_name, last_name
    `, [passwordHash, superAdmin.id]);
    
    if (updateResult.rows.length > 0) {
      const user = updateResult.rows[0];
      console.log('✅ Mot de passe SuperAdmin réinitialisé avec succès!');
      console.log('📋 Détails:');
      console.log(`   Username: ${user.username}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Nom: ${user.first_name} ${user.last_name}`);
      console.log(`   Nouveau mot de passe: ${newPassword}`);
      console.log('');
      console.log('🚀 Vous pouvez maintenant vous connecter avec le nouveau mot de passe!');
    } else {
      console.log('❌ Erreur lors de la mise à jour du mot de passe.');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la réinitialisation:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Vérifiez que PostgreSQL est démarré et accessible.');
    } else if (error.code === '3D000') {
      console.log('💡 Vérifiez que la base de données existe.');
    } else if (error.code === '28P01') {
      console.log('💡 Vérifiez les identifiants de connexion PostgreSQL.');
    }
  } finally {
    await pool.end();
  }
}

// Afficher l'aide si demandé
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('🔐 Script de réinitialisation du mot de passe SuperAdmin');
  console.log('');
  console.log('Usage:');
  console.log('  node scripts/reset-superadmin-password.cjs [nouveau_mot_de_passe]');
  console.log('');
  console.log('Exemples:');
  console.log('  node scripts/reset-superadmin-password.cjs');
  console.log('  node scripts/reset-superadmin-password.cjs monNouveauMotDePasse123');
  console.log('  node scripts/reset-superadmin-password.cjs "Mot de passe complexe!"');
  console.log('');
  console.log('Si aucun mot de passe n\'est fourni, "admin123" sera utilisé par défaut.');
  process.exit(0);
}

resetSuperAdminPassword();