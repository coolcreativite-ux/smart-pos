const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'gemini_pos_dev',
  password: process.env.DB_PASSWORD || 'admin',
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function checkLicenses() {
  try {
    console.log('🔍 Vérification des licences pour Demo Tenant (tenant_id = 1)...');
    
    // Vérifier les licences existantes
    const licensesResult = await pool.query('SELECT * FROM licenses WHERE tenant_id = 1');
    console.log('\n📋 Licences trouvées:');
    if (licensesResult.rows.length === 0) {
      console.log('❌ Aucune licence trouvée pour Demo Tenant');
    } else {
      licensesResult.rows.forEach(license => {
        console.log(`✅ Licence: ${license.key}`);
        console.log(`   - ID: ${license.id}`);
        console.log(`   - Assigné à: ${license.assigned_to}`);
        console.log(`   - Plan: ${license.plan}`);
        console.log(`   - Actif: ${license.is_active}`);
        console.log(`   - Expire le: ${license.expiry_date}`);
        console.log('');
      });
    }
    
    // Vérifier les tenants
    const tenantsResult = await pool.query('SELECT * FROM tenants WHERE id = 1');
    console.log('🏢 Tenant Demo:');
    if (tenantsResult.rows.length > 0) {
      const tenant = tenantsResult.rows[0];
      console.log(`   - Nom: ${tenant.name}`);
      console.log(`   - Actif: ${tenant.is_active}`);
      console.log(`   - Créé le: ${tenant.created_at}`);
    } else {
      console.log('❌ Demo Tenant non trouvé');
    }
    
    // Vérifier les utilisateurs
    const usersResult = await pool.query('SELECT username, role, is_active FROM users WHERE tenant_id = 1');
    console.log('\n👥 Utilisateurs Demo Tenant:');
    usersResult.rows.forEach(user => {
      console.log(`   - ${user.username} (${user.role}) - Actif: ${user.is_active}`);
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await pool.end();
  }
}

checkLicenses();