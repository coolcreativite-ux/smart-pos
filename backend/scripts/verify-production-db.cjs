/**
 * Script de vérification de la base de données PRODUCTION
 * 
 * Utilisation :
 *   cd backend/scripts
 *   node verify-production-db.cjs
 * 
 * Ce script affiche :
 * - Le nombre d'enregistrements dans chaque table
 * - Les utilisateurs existants
 * - Les tenants existants
 * - Les licences actives
 * - L'état général de la base de données
 */

const { Pool } = require('pg');
require('dotenv').config({ path: '../.env.production' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function verifyProductionDatabase() {
  console.log('🔍 VÉRIFICATION DE LA BASE DE DONNÉES PRODUCTION');
  console.log('================================================\n');

  try {
    // Test de connexion
    console.log('📡 Test de connexion...');
    await pool.query('SELECT 1');
    console.log('✅ Connexion réussie\n');

    // Compter les enregistrements
    console.log('📊 NOMBRE D\'ENREGISTREMENTS PAR TABLE');
    console.log('=====================================');

    const tables = [
      { name: 'users', label: '👤 Utilisateurs' },
      { name: 'tenants', label: '🏢 Tenants' },
      { name: 'products', label: '📦 Produits' },
      { name: 'product_variants', label: '🔀 Variantes' },
      { name: 'inventory', label: '📊 Inventaire' },
      { name: 'customers', label: '👥 Clients' },
      { name: 'sales', label: '💰 Ventes' },
      { name: 'sale_items', label: '🛒 Items de vente' },
      { name: 'licenses', label: '🔑 Licences' },
      { name: 'settings', label: '⚙️  Settings' },
      { name: 'action_logs', label: '📝 Logs' },
      { name: 'categories', label: '🏷️  Catégories' },
      { name: 'stores', label: '🏪 Magasins' }
    ];

    for (const table of tables) {
      try {
        const result = await pool.query(`SELECT COUNT(*) FROM ${table.name}`);
        const count = parseInt(result.rows[0].count);
        const icon = count === 0 ? '⚪' : count < 10 ? '🟡' : '🟢';
        console.log(`${icon} ${table.label.padEnd(20)} : ${count}`);
      } catch (error) {
        console.log(`❌ ${table.label.padEnd(20)} : Erreur (${error.message})`);
      }
    }

    console.log('\n');

    // Détails des utilisateurs
    console.log('👤 UTILISATEURS EXISTANTS');
    console.log('=========================');
    const usersResult = await pool.query(`
      SELECT id, username, email, role, tenant_id, first_name, last_name
      FROM users
      ORDER BY id
    `);

    if (usersResult.rows.length === 0) {
      console.log('⚠️  Aucun utilisateur trouvé\n');
    } else {
      usersResult.rows.forEach(user => {
        console.log(`ID: ${user.id}`);
        console.log(`  Username: ${user.username}`);
        console.log(`  Email: ${user.email || 'N/A'}`);
        console.log(`  Nom: ${user.first_name} ${user.last_name}`);
        console.log(`  Rôle: ${user.role}`);
        console.log(`  Tenant ID: ${user.tenant_id}`);
        console.log('');
      });
    }

    // Détails des tenants
    console.log('🏢 TENANTS EXISTANTS');
    console.log('====================');
    const tenantsResult = await pool.query(`
      SELECT id, name, is_active, created_at
      FROM tenants
      ORDER BY id
    `);

    if (tenantsResult.rows.length === 0) {
      console.log('⚠️  Aucun tenant trouvé\n');
    } else {
      tenantsResult.rows.forEach(tenant => {
        console.log(`ID: ${tenant.id}`);
        console.log(`  Nom: ${tenant.name}`);
        console.log(`  Actif: ${tenant.is_active ? '✅' : '❌'}`);
        console.log(`  Créé le: ${new Date(tenant.created_at).toLocaleDateString('fr-FR')}`);
        console.log('');
      });
    }

    // Détails des licences
    console.log('🔑 LICENCES ACTIVES');
    console.log('===================');
    const licensesResult = await pool.query(`
      SELECT id, key, tenant_id, assigned_to, plan, expiry_date, is_active
      FROM licenses
      WHERE is_active = true
      ORDER BY created_at DESC
    `);

    if (licensesResult.rows.length === 0) {
      console.log('⚠️  Aucune licence active trouvée\n');
    } else {
      licensesResult.rows.forEach(license => {
        const expiryDate = new Date(license.expiry_date);
        const isExpired = expiryDate < new Date();
        const daysLeft = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
        
        console.log(`Clé: ${license.key}`);
        console.log(`  Assignée à: ${license.assigned_to}`);
        console.log(`  Plan: ${license.plan}`);
        console.log(`  Tenant ID: ${license.tenant_id || 'Non assigné'}`);
        console.log(`  Expiration: ${expiryDate.toLocaleDateString('fr-FR')} ${isExpired ? '❌ EXPIRÉE' : `✅ (${daysLeft} jours restants)`}`);
        console.log('');
      });
    }

    // Statistiques des ventes
    console.log('💰 STATISTIQUES DES VENTES');
    console.log('==========================');
    const salesStats = await pool.query(`
      SELECT 
        COUNT(*) as total_sales,
        COALESCE(SUM(total), 0) as total_amount,
        COALESCE(AVG(total), 0) as avg_amount
      FROM sales
    `);

    if (salesStats.rows[0].total_sales > 0) {
      console.log(`Total des ventes: ${salesStats.rows[0].total_sales}`);
      console.log(`Montant total: ${parseFloat(salesStats.rows[0].total_amount).toFixed(2)} FCFA`);
      console.log(`Montant moyen: ${parseFloat(salesStats.rows[0].avg_amount).toFixed(2)} FCFA\n`);
    } else {
      console.log('⚪ Aucune vente enregistrée\n');
    }

    // Vérifications de sécurité
    console.log('🔐 VÉRIFICATIONS DE SÉCURITÉ');
    console.log('============================');

    // Vérifier le superadmin
    const superadminResult = await pool.query(`
      SELECT COUNT(*) FROM users WHERE role = 'superadmin'
    `);
    const superadminCount = parseInt(superadminResult.rows[0].count);
    
    if (superadminCount === 0) {
      console.log('❌ CRITIQUE : Aucun superadmin trouvé !');
    } else if (superadminCount === 1) {
      console.log('✅ Superadmin présent (1)');
    } else {
      console.log(`⚠️  Plusieurs superadmins trouvés (${superadminCount})`);
    }

    // Vérifier les utilisateurs sans tenant
    const orphanUsersResult = await pool.query(`
      SELECT COUNT(*) FROM users WHERE tenant_id IS NULL AND role != 'superadmin'
    `);
    const orphanUsers = parseInt(orphanUsersResult.rows[0].count);
    
    if (orphanUsers > 0) {
      console.log(`⚠️  ${orphanUsers} utilisateur(s) sans tenant`);
    } else {
      console.log('✅ Tous les utilisateurs ont un tenant');
    }

    // Vérifier les produits sans variantes
    const productsWithoutVariants = await pool.query(`
      SELECT COUNT(*) FROM products p
      WHERE NOT EXISTS (SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id)
    `);
    const orphanProducts = parseInt(productsWithoutVariants.rows[0].count);
    
    if (orphanProducts > 0) {
      console.log(`⚠️  ${orphanProducts} produit(s) sans variantes`);
    } else {
      console.log('✅ Tous les produits ont des variantes');
    }

    console.log('\n');

    // État général
    console.log('📋 ÉTAT GÉNÉRAL');
    console.log('===============');
    
    const totalUsers = parseInt((await pool.query('SELECT COUNT(*) FROM users')).rows[0].count);
    const totalProducts = parseInt((await pool.query('SELECT COUNT(*) FROM products')).rows[0].count);
    const totalCustomers = parseInt((await pool.query('SELECT COUNT(*) FROM customers')).rows[0].count);
    const totalSales = parseInt((await pool.query('SELECT COUNT(*) FROM sales')).rows[0].count);

    if (totalUsers === 1 && totalProducts === 0 && totalCustomers === 0 && totalSales === 0) {
      console.log('✅ Base de données PROPRE (prête pour la production)');
      console.log('   - 1 superadmin uniquement');
      console.log('   - Aucune donnée de test');
      console.log('   - Prête pour les premiers utilisateurs réels\n');
    } else if (totalUsers > 1 || totalProducts > 0 || totalCustomers > 0 || totalSales > 0) {
      console.log('🟡 Base de données CONTIENT DES DONNÉES');
      console.log(`   - ${totalUsers} utilisateur(s)`);
      console.log(`   - ${totalProducts} produit(s)`);
      console.log(`   - ${totalCustomers} client(s)`);
      console.log(`   - ${totalSales} vente(s)`);
      console.log('   - Peut contenir des données de test\n');
    }

    console.log('✅ Vérification terminée avec succès !\n');

  } catch (error) {
    console.error('❌ Erreur lors de la vérification :', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Exécuter la vérification
verifyProductionDatabase();
