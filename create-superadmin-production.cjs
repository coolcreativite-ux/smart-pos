const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// Configuration de la base de données de PRODUCTION
const pool = new Pool({
  connectionString: 'postgresql://postgres.qihnlmqjqhbafxqiauqo:Eyemon@2019@aws-0-eu-central-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function createSuperAdmin() {
  try {
    console.log('🔄 Connexion à la base de données de PRODUCTION...');
    
    // Désactiver temporairement RLS
    await pool.query('SET session_replication_role = replica;');
    
    // Chercher l'utilisateur admin
    const existingResult = await pool.query(
      "SELECT id, username, role FROM users WHERE username = 'admin'"
    );
    
    if (existingResult.rows.length > 0) {
      console.log('✅ Superadmin existant trouvé:', existingResult.rows[0].username);
      console.log('Réinitialisation du mot de passe...');
      
      const newPassword = 'Admin@2026';
      const passwordHash = await bcrypt.hash(newPassword, 10);
      
      await pool.query(
        'UPDATE users SET password_hash = $1 WHERE id = $2',
        [passwordHash, existingResult.rows[0].id]
      );
      
      console.log('✅ Mot de passe réinitialisé!');
      console.log('');
      console.log('=== INFORMATIONS DE CONNEXION ===');
      console.log(`Username: ${existingResult.rows[0].username}`);
      console.log(`Password: ${newPassword}`);
      console.log('=================================');
      return;
    }
    
    // Créer un tenant pour le superadmin s'il n'existe pas
    console.log('🔍 Vérification du tenant superadmin...');
    let tenantResult = await pool.query(
      "SELECT id FROM tenants WHERE name = 'SuperAdmin' LIMIT 1"
    );
    
    let tenantId;
    if (tenantResult.rows.length === 0) {
      console.log('📝 Création du tenant SuperAdmin...');
      const newTenant = await pool.query(
        "INSERT INTO tenants (name, contact_email, phone) VALUES ($1, $2, $3) RETURNING id",
        ['SuperAdmin', 'admin@smartpos.com', '0000000000']
      );
      tenantId = newTenant.rows[0].id;
      console.log(`✅ Tenant créé avec ID: ${tenantId}`);
    } else {
      tenantId = tenantResult.rows[0].id;
      console.log(`✅ Tenant existant trouvé avec ID: ${tenantId}`);
    }
    
    // Créer le superadmin
    console.log('👤 Création du superadmin...');
    const username = 'admin';
    const password = 'Admin@2026';
    const passwordHash = await bcrypt.hash(password, 10);
    
    const userResult = await pool.query(
      `INSERT INTO users (tenant_id, username, password_hash, role, full_name, email) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, username`,
      [tenantId, username, passwordHash, 'superadmin', 'Super Admin', 'admin@smartpos.com']
    );
    
    console.log('✅ Superadmin créé avec succès!');
    console.log('');
    console.log('=== INFORMATIONS DE CONNEXION ===');
    console.log(`Username: ${username}`);
    console.log(`Password: ${password}`);
    console.log(`User ID: ${userResult.rows[0].id}`);
    console.log(`Tenant ID: ${tenantId}`);
    console.log('=================================');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

createSuperAdmin();
