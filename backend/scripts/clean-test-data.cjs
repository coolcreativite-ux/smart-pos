const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.development') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

async function cleanTestData() {
  console.log('🧹 Nettoyage des données de test...\n');

  try {
    // 1. Supprimer tous les utilisateurs sauf le superadmin
    console.log('👤 Suppression des utilisateurs de test...');
    const usersResult = await pool.query(
      "DELETE FROM users WHERE role != 'superadmin' RETURNING username"
    );
    console.log(`   ✅ ${usersResult.rowCount} utilisateurs supprimés`);
    usersResult.rows.forEach(u => console.log(`      - ${u.username}`));

    // 2. Supprimer toutes les licences
    console.log('\n🔑 Suppression des licences de test...');
    const licensesResult = await pool.query('DELETE FROM licenses RETURNING key');
    console.log(`   ✅ ${licensesResult.rowCount} licences supprimées`);

    // 3. Supprimer tous les settings sauf celui du tenant 1
    console.log('\n⚙️  Suppression des settings de test...');
    const settingsResult = await pool.query('DELETE FROM settings WHERE tenant_id != 1');
    console.log(`   ✅ ${settingsResult.rowCount} settings supprimés`);

    // 4. Supprimer tous les tenants sauf le tenant 1 (superadmin)
    console.log('\n🏢 Suppression des tenants de test...');
    const tenantsResult = await pool.query(
      'DELETE FROM tenants WHERE id != 1 RETURNING name'
    );
    console.log(`   ✅ ${tenantsResult.rowCount} tenants supprimés`);
    tenantsResult.rows.forEach(t => console.log(`      - ${t.name}`));

    // 5. Supprimer tous les produits
    console.log('\n📦 Suppression des produits de test...');
    const productsResult = await pool.query('DELETE FROM products RETURNING name');
    console.log(`   ✅ ${productsResult.rowCount} produits supprimés`);

    // 5. Supprimer toutes les variantes de produits
    console.log('\n🎨 Suppression des variantes de produits...');
    const variantsResult = await pool.query('DELETE FROM product_variants');
    console.log(`   ✅ ${variantsResult.rowCount} variantes supprimées`);

    // 6. Supprimer tout l'inventaire
    console.log('\n📊 Suppression de l\'inventaire...');
    const inventoryResult = await pool.query('DELETE FROM inventory');
    console.log(`   ✅ ${inventoryResult.rowCount} entrées d\'inventaire supprimées`);

    // 7. Supprimer toutes les catégories
    console.log('\n🏷️  Suppression des catégories...');
    const categoriesResult = await pool.query('DELETE FROM categories RETURNING name');
    console.log(`   ✅ ${categoriesResult.rowCount} catégories supprimées`);

    // 8. Supprimer tous les clients
    console.log('\n👥 Suppression des clients...');
    const customersResult = await pool.query('DELETE FROM customers RETURNING first_name, last_name');
    console.log(`   ✅ ${customersResult.rowCount} clients supprimés`);

    // 9. Supprimer tous les magasins sauf le magasin par défaut
    console.log('\n🏪 Suppression des magasins de test...');
    const storesResult = await pool.query(
      'DELETE FROM stores WHERE id != 1 RETURNING name'
    );
    console.log(`   ✅ ${storesResult.rowCount} magasins supprimés`);

    // 10. Supprimer tous les logs d'actions
    console.log('\n📝 Suppression des logs d\'actions...');
    const logsResult = await pool.query('DELETE FROM action_logs');
    console.log(`   ✅ ${logsResult.rowCount} logs supprimés`);

    console.log('\n✅ Nettoyage terminé avec succès!\n');
    console.log('📊 Résumé:');
    console.log(`   - Utilisateurs: ${usersResult.rowCount} supprimés`);
    console.log(`   - Licences: ${licensesResult.rowCount} supprimées`);
    console.log(`   - Tenants: ${tenantsResult.rowCount} supprimés`);
    console.log(`   - Produits: ${productsResult.rowCount} supprimés`);
    console.log(`   - Variantes: ${variantsResult.rowCount} supprimées`);
    console.log(`   - Inventaire: ${inventoryResult.rowCount} entrées supprimées`);
    console.log(`   - Catégories: ${categoriesResult.rowCount} supprimées`);
    console.log(`   - Clients: ${customersResult.rowCount} supprimés`);
    console.log(`   - Magasins: ${storesResult.rowCount} supprimés`);
    console.log(`   - Logs: ${logsResult.rowCount} supprimés`);

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

cleanTestData()
  .then(() => {
    console.log('\n🎉 Base de données nettoyée!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Échec du nettoyage:', error);
    process.exit(1);
  });
