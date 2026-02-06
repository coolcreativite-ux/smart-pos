const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'gemini_pos_dev',
  password: process.env.DB_PASSWORD || 'admin',
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function createDemoLicense() {
  try {
    console.log('🔑 Création d\'une licence pour Demo Tenant...');
    
    // Créer une licence valide pour Demo Tenant
    const licenseKey = 'GEMINI-POS-DEMO-LICENSE-KEY';
    const tenantId = 1;
    const assignedTo = 'Demo Tenant';
    const plan = 'BUSINESS_PRO';
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1); // Expire dans 1 an
    
    const result = await pool.query(
      `INSERT INTO licenses (key, tenant_id, assigned_to, expiry_date, is_active, plan) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       ON CONFLICT (key) DO UPDATE SET 
         tenant_id = EXCLUDED.tenant_id,
         assigned_to = EXCLUDED.assigned_to,
         expiry_date = EXCLUDED.expiry_date,
         is_active = EXCLUDED.is_active,
         plan = EXCLUDED.plan
       RETURNING *`,
      [licenseKey, tenantId, assignedTo, expiryDate, true, plan]
    );
    
    const license = result.rows[0];
    console.log('✅ Licence créée avec succès:');
    console.log(`   - Clé: ${license.key}`);
    console.log(`   - ID: ${license.id}`);
    console.log(`   - Tenant: ${license.tenant_id} (${license.assigned_to})`);
    console.log(`   - Plan: ${license.plan}`);
    console.log(`   - Expire le: ${license.expiry_date}`);
    console.log(`   - Actif: ${license.is_active}`);
    
    console.log('\n🎉 Demo Tenant peut maintenant se connecter avec:');
    console.log('   - Utilisateur: admin');
    console.log('   - Mot de passe: SuperAdmin2024!');
    console.log(`   - Clé de licence: ${licenseKey}`);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await pool.end();
  }
}

createDemoLicense();