// Script pour créer un utilisateur SuperAdmin
// Usage: node scripts/create-superadmin.cjs

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

async function createSuperAdmin() {
  try {
    console.log('🔐 Création du SuperAdmin...');
    
    // Hash du mot de passe "admin123"
    const passwordHash = await bcrypt.hash('admin123', 10);
    
    // Supprimer l'ancien utilisateur s'il existe
    await pool.query('DELETE FROM users WHERE username = $1', ['admin']);
    
    // Créer le nouvel utilisateur SuperAdmin
    const result = await pool.query(`
      INSERT INTO users (
        tenant_id, username, email, first_name, last_name, 
        password_hash, role
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING id, username, role
    `, [1, 'admin', 'admin@smartpos.com', 'Super', 'Admin', passwordHash, 'superadmin']);
    
    console.log('✅ SuperAdmin créé avec succès!');
    console.log('📋 Détails:');
    console.log(`   ID: ${result.rows[0].id}`);
    console.log(`   Username: ${result.rows[0].username}`);
    console.log(`   Role: ${result.rows[0].role}`);
    console.log(`   Password: admin123`);
    console.log('');
    console.log('🚀 Vous pouvez maintenant vous connecter à l\'application!');
    
  } catch (error) {
    console.error('❌ Erreur lors de la création du SuperAdmin:', error.message);
  } finally {
    await pool.end();
  }
}

createSuperAdmin();