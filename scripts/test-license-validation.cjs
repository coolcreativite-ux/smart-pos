const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'gemini_pos_dev',
  password: process.env.DB_PASSWORD || 'admin',
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function testLicenseValidation() {
  try {
    console.log('🧪 Test de validation de licence...');
    
    // Test 1: Vérifier que la licence existe
    const licenseResult = await pool.query(
      'SELECT * FROM licenses WHERE key = $1 AND tenant_id = $2',
      ['GEMINI-POS-DEMO-LICENSE-KEY', 1]
    );
    
    if (licenseResult.rows.length === 0) {
      console.log('❌ Licence non trouvée');
      return;
    }
    
    const license = licenseResult.rows[0];
    console.log('✅ Licence trouvée:');
    console.log(`   - Clé: ${license.key}`);
    console.log(`   - Tenant: ${license.tenant_id}`);
    console.log(`   - Actif: ${license.is_active}`);
    console.log(`   - Expire le: ${license.expiry_date}`);
    
    // Test 2: Vérifier la validité de la licence
    const now = new Date();
    const expiryDate = new Date(license.expiry_date);
    const isValid = license.is_active && now < expiryDate;
    
    console.log(`\n🔍 Validation de la licence:`);
    console.log(`   - Date actuelle: ${now.toISOString()}`);
    console.log(`   - Date d'expiration: ${expiryDate.toISOString()}`);
    console.log(`   - Licence active: ${license.is_active}`);
    console.log(`   - Non expirée: ${now < expiryDate}`);
    console.log(`   - Résultat final: ${isValid ? '✅ VALIDE' : '❌ INVALIDE'}`);
    
    // Test 3: Tester l'authentification
    console.log(`\n🔐 Test d'authentification...`);
    const userResult = await pool.query(
      'SELECT username, role, tenant_id FROM users WHERE username = $1 AND tenant_id = $2',
      ['admin', 1]
    );
    
    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      console.log('✅ Utilisateur trouvé:');
      console.log(`   - Username: ${user.username}`);
      console.log(`   - Role: ${user.role}`);
      console.log(`   - Tenant: ${user.tenant_id}`);
      
      // Vérifier si le tenant a une licence valide
      const tenantLicenseResult = await pool.query(
        'SELECT COUNT(*) as count FROM licenses WHERE tenant_id = $1 AND is_active = true AND expiry_date > NOW()',
        [user.tenant_id]
      );
      
      const hasValidLicense = parseInt(tenantLicenseResult.rows[0].count) > 0;
      console.log(`   - Licence valide pour le tenant: ${hasValidLicense ? '✅ OUI' : '❌ NON'}`);
      
      if (hasValidLicense) {
        console.log('\n🎉 SUCCÈS: L\'utilisateur peut se connecter avec une licence valide!');
      } else {
        console.log('\n⚠️  ATTENTION: L\'utilisateur peut se connecter mais devra activer une licence.');
      }
    } else {
      console.log('❌ Utilisateur non trouvé');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await pool.end();
  }
}

testLicenseValidation();