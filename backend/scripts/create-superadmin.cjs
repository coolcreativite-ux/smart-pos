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
    console.log('🔐 Création/Mise à jour du SuperAdmin...');
    
    // Hash du mot de passe "admin123"
    const passwordHash = await bcrypt.hash('admin123', 10);
    
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await pool.query('SELECT id FROM users WHERE username = $1', ['admin']);
    
    if (existingUser.rows.length > 0) {
      // Mettre à jour l'utilisateur existant
      await pool.query(`
        UPDATE users 
        SET password_hash = $1, role = $2, email = $3, first_name = $4, last_name = $5
        WHERE username = $6
        RETURNING id, username, role
      `, [passwordHash, 'superadmin', 'admin@smartpos.com', 'Super', 'Admin', 'admin']);
      
      console.log('✅ SuperAdmin mis à jour avec succès!');
    } else {
      // Créer le nouvel utilisateur SuperAdmin
      await pool.query(`
        INSERT INTO users (
          tenant_id, username, email, first_name, last_name, 
          password_hash, role
        ) VALUES ($1, $2, $3, $4, $5, $6, $7) 
        RETURNING id, username, role
      `, [1, 'admin', 'admin@smartpos.com', 'Super', 'Admin', passwordHash, 'superadmin']);
      
      console.log('✅ SuperAdmin créé avec succès!');
    }
    
    console.log('📋 Détails:');
    console.log(`   Username: admin`);
    console.log(`   Password: admin123`);
    console.log(`   Role: superadmin`);
    console.log('');
    console.log('🚀 Vous pouvez maintenant vous connecter à l\'application!');
    
  } catch (error) {
    console.error('❌ Erreur lors de la création du SuperAdmin:', error.message);
  } finally {
    await pool.end();
  }
}

createSuperAdmin();