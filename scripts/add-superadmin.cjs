// Script pour ajouter le SuperAdmin à la base de données
// Usage: node scripts/add-superadmin.cjs

const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'gemini_pos_dev',
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function addSuperAdmin() {
  try {
    console.log('🔐 Ajout du SuperAdmin...');
    
    // 1. Créer ou vérifier le tenant système (ID = 0)
    const systemTenant = await pool.query('SELECT id FROM tenants WHERE id = $1', [0]);
    
    if (systemTenant.rows.length === 0) {
      console.log('🏢 Création du tenant système...');
      await pool.query(
        'INSERT INTO tenants (id, name, is_active) VALUES ($1, $2, $3)',
        [0, 'System', true]
      );
      // Réinitialiser la séquence pour éviter les conflits
      await pool.query('SELECT setval(\'tenants_id_seq\', (SELECT MAX(id) FROM tenants))');
    }
    
    // 2. Hash du mot de passe "admin123"
    const passwordHash = await bcrypt.hash('admin123', 10);
    
    // 3. Vérifier si le SuperAdmin existe déjà
    const existing = await pool.query('SELECT id FROM users WHERE username = $1', ['superadmin']);
    
    if (existing.rows.length > 0) {
      console.log('⚠️  SuperAdmin existe déjà, mise à jour du mot de passe...');
      
      // Mettre à jour le mot de passe
      await pool.query(
        'UPDATE users SET password_hash = $1 WHERE username = $2',
        [passwordHash, 'superadmin']
      );
      
      console.log('✅ Mot de passe SuperAdmin mis à jour!');
    } else {
      // Créer le SuperAdmin
      const result = await pool.query(`
        INSERT INTO users (
          tenant_id, username, email, first_name, last_name, 
          password_hash, role
        ) VALUES ($1, $2, $3, $4, $5, $6, $7) 
        RETURNING id, username, role
      `, [0, 'superadmin', 'super@smartpos.com', 'System', 'Administrator', passwordHash, 'superadmin']);
      
      console.log('✅ SuperAdmin créé avec succès!');
      console.log('📋 Détails:');
      console.log(`   ID: ${result.rows[0].id}`);
      console.log(`   Username: ${result.rows[0].username}`);
      console.log(`   Role: ${result.rows[0].role}`);
    }
    
    console.log('');
    console.log('🔑 Identifiants SuperAdmin:');
    console.log('   Username: superadmin');
    console.log('   Password: admin123');
    console.log('');
    console.log('🚀 Le SuperAdmin peut maintenant se connecter!');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout du SuperAdmin:', error.message);
  } finally {
    await pool.end();
  }
}

addSuperAdmin();