/**
 * Script de correction du tenant_id du superadmin
 * 
 * Le superadmin doit avoir tenant_id = 0 pour être préservé lors du nettoyage
 * 
 * Utilisation :
 *   cd backend/scripts
 *   node fix-superadmin-tenant.cjs
 */

const { Pool } = require('pg');
require('dotenv').config({ path: '../.env.production' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function fixSuperadminTenant() {
  console.log('🔧 CORRECTION DU TENANT_ID DU SUPERADMIN');
  console.log('=========================================\n');

  try {
    // Vérifier l'état actuel
    console.log('🔍 Vérification de l\'état actuel...');
    const currentState = await pool.query(`
      SELECT id, username, role, tenant_id 
      FROM users 
      WHERE role = 'superadmin'
    `);

    if (currentState.rows.length === 0) {
      console.log('❌ Aucun superadmin trouvé !');
      process.exit(1);
    }

    console.log(`Superadmin trouvé :`);
    currentState.rows.forEach(user => {
      console.log(`  - ID: ${user.id}, Username: ${user.username}, Tenant ID: ${user.tenant_id}`);
    });
    console.log('');

    // Vérifier si le tenant_id = 0 existe
    console.log('🔍 Vérification du tenant_id = 0...');
    const tenant0 = await pool.query('SELECT * FROM tenants WHERE id = 0');
    
    if (tenant0.rows.length === 0) {
      console.log('⚠️  Tenant ID 0 n\'existe pas, création...');
      await pool.query(`
        INSERT INTO tenants (id, name, is_active) 
        VALUES (0, 'System', true)
        ON CONFLICT (id) DO NOTHING
      `);
      console.log('✅ Tenant ID 0 créé\n');
    } else {
      console.log('✅ Tenant ID 0 existe déjà\n');
    }

    // Mettre à jour le superadmin
    console.log('🔄 Mise à jour du tenant_id du superadmin...');
    const updateResult = await pool.query(`
      UPDATE users 
      SET tenant_id = 0 
      WHERE role = 'superadmin'
      RETURNING id, username, tenant_id
    `);

    if (updateResult.rowCount > 0) {
      console.log('✅ Superadmin mis à jour :');
      updateResult.rows.forEach(user => {
        console.log(`  - ID: ${user.id}, Username: ${user.username}, Tenant ID: ${user.tenant_id}`);
      });
      console.log('');
    }

    // Vérifier le résultat
    console.log('🔍 Vérification finale...');
    const finalState = await pool.query(`
      SELECT id, username, role, tenant_id 
      FROM users 
      WHERE role = 'superadmin'
    `);

    const allCorrect = finalState.rows.every(user => user.tenant_id === 0);
    
    if (allCorrect) {
      console.log('✅ Tous les superadmins ont maintenant tenant_id = 0');
      console.log('✅ Le nettoyage de production peut maintenant être exécuté en toute sécurité\n');
    } else {
      console.log('⚠️  Certains superadmins n\'ont pas tenant_id = 0');
      finalState.rows.forEach(user => {
        if (user.tenant_id !== 0) {
          console.log(`  ⚠️  ${user.username} a tenant_id = ${user.tenant_id}`);
        }
      });
    }

    console.log('✅ Correction terminée avec succès !\n');

  } catch (error) {
    console.error('❌ Erreur lors de la correction :', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Exécuter la correction
fixSuperadminTenant();
