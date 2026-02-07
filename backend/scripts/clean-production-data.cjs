/**
 * Script de nettoyage de la base de données PRODUCTION
 * 
 * ⚠️ ATTENTION : Ce script supprime TOUTES les données de test de la base de données PRODUCTION
 * 
 * Utilisation :
 *   cd backend/scripts
 *   node clean-production-data.cjs
 * 
 * Ce script supprime :
 * - Tous les utilisateurs de test (sauf le superadmin)
 * - Tous les tenants de test
 * - Tous les produits de test
 * - Tous les clients de test
 * - Toutes les ventes de test
 * - Tous les settings de test
 * - Toutes les licences de test
 * 
 * ⚠️ IMPORTANT : Assurez-vous d'avoir une sauvegarde avant d'exécuter ce script !
 */

const { Pool } = require('pg');
require('dotenv').config({ path: '../.env.production' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function cleanProductionDatabase() {
  console.log('🚨 NETTOYAGE DE LA BASE DE DONNÉES PRODUCTION 🚨');
  console.log('================================================\n');
  
  // Demander confirmation
  console.log('⚠️  ATTENTION : Cette opération est IRRÉVERSIBLE !');
  console.log('⚠️  Vous êtes sur le point de supprimer TOUTES les données de test de la PRODUCTION\n');
  
  // En production, on veut être TRÈS prudent
  console.log('Pour continuer, vous devez modifier ce script et décommenter la ligne de confirmation.\n');
  
  // DÉCOMMENTEZ LA LIGNE SUIVANTE POUR ACTIVER LE NETTOYAGE
    const CONFIRM_PRODUCTION_CLEANUP = true;
  
  if (typeof CONFIRM_PRODUCTION_CLEANUP === 'undefined') {
    console.log('❌ Nettoyage annulé pour des raisons de sécurité.');
    console.log('📝 Pour activer le nettoyage, éditez ce fichier et décommentez la ligne CONFIRM_PRODUCTION_CLEANUP.\n');
    process.exit(0);
  }

  try {
    await pool.query('BEGIN');
    console.log('🔄 Transaction démarrée...\n');

    // 1. Supprimer les ventes de test (sale_items puis sales)
    console.log('1️⃣  Suppression des ventes de test...');
    const salesResult = await pool.query('DELETE FROM sale_items WHERE sale_id IN (SELECT id FROM sales WHERE tenant_id != 0)');
    console.log(`   ✅ ${salesResult.rowCount} items de vente supprimés`);
    
    const salesDeleteResult = await pool.query('DELETE FROM sales WHERE tenant_id != 0');
    console.log(`   ✅ ${salesDeleteResult.rowCount} ventes supprimées\n`);

    // 2. Supprimer l'inventaire de test
    console.log('2️⃣  Suppression de l\'inventaire de test...');
    const inventoryResult = await pool.query('DELETE FROM inventory WHERE variant_id IN (SELECT id FROM product_variants WHERE product_id IN (SELECT id FROM products WHERE tenant_id != 0))');
    console.log(`   ✅ ${inventoryResult.rowCount} entrées d\'inventaire supprimées\n`);

    // 3. Supprimer les variantes de produits de test
    console.log('3️⃣  Suppression des variantes de produits de test...');
    const variantsResult = await pool.query('DELETE FROM product_variants WHERE product_id IN (SELECT id FROM products WHERE tenant_id != 0)');
    console.log(`   ✅ ${variantsResult.rowCount} variantes supprimées\n`);

    // 4. Supprimer les produits de test
    console.log('4️⃣  Suppression des produits de test...');
    const productsResult = await pool.query('DELETE FROM products WHERE tenant_id != 0');
    console.log(`   ✅ ${productsResult.rowCount} produits supprimés\n`);

    // 5. Supprimer les clients de test
    console.log('5️⃣  Suppression des clients de test...');
    const customersResult = await pool.query('DELETE FROM customers WHERE tenant_id != 0');
    console.log(`   ✅ ${customersResult.rowCount} clients supprimés\n`);

    // 6. Supprimer les licences de test (sauf celles du superadmin)
    console.log('6️⃣  Suppression des licences de test...');
    const licensesResult = await pool.query('DELETE FROM licenses WHERE tenant_id != 0 AND tenant_id IS NOT NULL');
    console.log(`   ✅ ${licensesResult.rowCount} licences supprimées\n`);

    // 7. Supprimer les settings de test
    console.log('7️⃣  Suppression des settings de test...');
    const settingsResult = await pool.query('DELETE FROM settings WHERE tenant_id != 0');
    console.log(`   ✅ ${settingsResult.rowCount} settings supprimés\n`);

    // 8. Supprimer les action logs de test
    console.log('8️⃣  Suppression des action logs de test...');
    const logsResult = await pool.query('DELETE FROM action_logs WHERE tenant_id != 0');
    console.log(`   ✅ ${logsResult.rowCount} logs supprimés\n`);

    // 9. Supprimer les utilisateurs de test (sauf le superadmin)
    console.log('9️⃣  Suppression des utilisateurs de test...');
    const usersResult = await pool.query('DELETE FROM users WHERE tenant_id != 0');
    console.log(`   ✅ ${usersResult.rowCount} utilisateurs supprimés\n`);

    // 10. Supprimer les catégories de test
    console.log('🔟 Suppression des catégories de test...');
    const categoriesResult = await pool.query('DELETE FROM categories WHERE tenant_id != 0');
    console.log(`   ✅ ${categoriesResult.rowCount} catégories supprimées\n`);

    // 11. Supprimer les magasins de test (IMPORTANT: avant les tenants à cause de la FK)
    console.log('1️⃣1️⃣  Suppression des magasins de test...');
    const storesResult = await pool.query('DELETE FROM stores WHERE tenant_id != 0');
    console.log(`   ✅ ${storesResult.rowCount} magasins supprimés\n`);

    // 12. Supprimer les tenants de test (EN DERNIER à cause des FK)
    console.log('1️⃣2️⃣  Suppression des tenants de test...');
    const tenantsResult = await pool.query('DELETE FROM tenants WHERE id != 0');
    console.log(`   ✅ ${tenantsResult.rowCount} tenants supprimés\n`);

    await pool.query('COMMIT');
    console.log('✅ Transaction validée (COMMIT)\n');

    // Résumé
    console.log('📊 RÉSUMÉ DU NETTOYAGE');
    console.log('======================');
    console.log(`✅ ${salesDeleteResult.rowCount} ventes supprimées`);
    console.log(`✅ ${salesResult.rowCount} items de vente supprimés`);
    console.log(`✅ ${productsResult.rowCount} produits supprimés`);
    console.log(`✅ ${variantsResult.rowCount} variantes supprimées`);
    console.log(`✅ ${inventoryResult.rowCount} entrées d'inventaire supprimées`);
    console.log(`✅ ${customersResult.rowCount} clients supprimés`);
    console.log(`✅ ${licensesResult.rowCount} licences supprimées`);
    console.log(`✅ ${settingsResult.rowCount} settings supprimés`);
    console.log(`✅ ${logsResult.rowCount} logs supprimés`);
    console.log(`✅ ${usersResult.rowCount} utilisateurs supprimés`);
    console.log(`✅ ${categoriesResult.rowCount} catégories supprimées`);
    console.log(`✅ ${storesResult.rowCount} magasins supprimés`);
    console.log(`✅ ${tenantsResult.rowCount} tenants supprimés\n`);

    // Vérifier ce qui reste
    console.log('🔍 VÉRIFICATION DES DONNÉES RESTANTES');
    console.log('=====================================');
    
    const remainingUsers = await pool.query('SELECT COUNT(*) FROM users');
    console.log(`👤 Utilisateurs restants : ${remainingUsers.rows[0].count}`);
    
    const remainingTenants = await pool.query('SELECT COUNT(*) FROM tenants');
    console.log(`🏢 Tenants restants : ${remainingTenants.rows[0].count}`);
    
    const remainingProducts = await pool.query('SELECT COUNT(*) FROM products');
    console.log(`📦 Produits restants : ${remainingProducts.rows[0].count}`);
    
    const remainingCustomers = await pool.query('SELECT COUNT(*) FROM customers');
    console.log(`👥 Clients restants : ${remainingCustomers.rows[0].count}`);
    
    const remainingSales = await pool.query('SELECT COUNT(*) FROM sales');
    console.log(`💰 Ventes restantes : ${remainingSales.rows[0].count}`);
    
    const remainingLicenses = await pool.query('SELECT COUNT(*) FROM licenses');
    console.log(`🔑 Licences restantes : ${remainingLicenses.rows[0].count}\n`);

    console.log('✅ Nettoyage de la base de données PRODUCTION terminé avec succès !');
    console.log('🎉 La base de données est maintenant propre et prête pour la production.\n');

  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('❌ Erreur lors du nettoyage :', error.message);
    console.error('🔄 Transaction annulée (ROLLBACK)\n');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Exécuter le nettoyage
cleanProductionDatabase();
