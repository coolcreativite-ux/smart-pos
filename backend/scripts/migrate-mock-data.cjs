// Script de migration des données mockées vers PostgreSQL
// Usage: node scripts/migrate-mock-data.cjs

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

// Données mockées à migrer
const MOCK_DATA = {
  stores: [
    { id: 1, tenant_id: 1, name: 'Siège Principal', location: 'Avenue de l\'Indépendance', phone: '555-0100' },
    { id: 2, tenant_id: 1, name: 'Succursale Ouest', location: 'Centre Commercial Ouest', phone: '555-0200' },
  ],
  
  suppliers: [
    { id: 1, tenant_id: 1, name: 'Global Retail Solutions', contact_person: 'M. Sow', email: 'sales@globalretail.com', phone: '33-822-0000' },
    { id: 2, tenant_id: 1, name: 'Textile Africa', contact_person: 'Mme Diop', email: 'contact@textile.sn', phone: '33-855-1111' },
  ],

  categories: [
    { id: 1, tenant_id: 1, name: 'Vêtements', description: 'Articles vestimentaires' },
    { id: 2, tenant_id: 1, name: 'Accessoires', description: 'Accessoires de mode' },
  ],

  users: [
    { id: 1, tenant_id: 1, username: 'proprietaire', email: 'owner@example.com', first_name: 'Big', last_name: 'Boss', role: 'owner', assigned_store_id: null },
    { id: 2, tenant_id: 1, username: 'admin', email: 'admin@example.com', first_name: 'Jean', last_name: 'Dupont', role: 'admin', assigned_store_id: 1 },
    { id: 3, tenant_id: 1, username: 'gerant', email: 'jane@example.com', first_name: 'Jeanne', last_name: 'Martin', role: 'manager', assigned_store_id: 2 },
    { id: 4, tenant_id: 1, username: 'employe', email: 'peter@example.com', first_name: 'Pierre', last_name: 'Dubois', role: 'cashier', assigned_store_id: 1 },
    { id: 5, tenant_id: 1, username: 'caissiere', email: 'marie@example.com', first_name: 'Marie', last_name: 'Claire', role: 'cashier', assigned_store_id: 1 },
  ],

  customers: [
    { id: 1, tenant_id: 1, first_name: 'Alice', last_name: 'Koffi', email: 'alice@example.com', phone: '555-0101', loyalty_points: 125, store_credit: 0, store_id: 1 },
    { id: 2, tenant_id: 1, first_name: 'Bob', last_name: 'Sow', email: 'bob@example.com', phone: '555-0102', loyalty_points: 480, store_credit: 5000, store_id: 1 },
  ],

  promo_codes: [
    { id: 1, tenant_id: 1, code: 'SAVE10', type: 'percentage', value: 10, is_active: true },
    { id: 2, tenant_id: 1, code: '500OFF', type: 'fixed', value: 500, is_active: true },
  ],

  products: [
    {
      id: 1,
      tenant_id: 1,
      name: 'T-Shirt "Gemini"',
      category_id: 1,
      description: 'Un t-shirt confortable en coton bio avec le logo Gemini exclusif.',
      image_url: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=600',
      attributes: JSON.stringify([
        { name: 'Taille', values: ['S', 'M', 'L'] },
        { name: 'Couleur', values: ['Noir', 'Blanc'] }
      ]),
      low_stock_threshold: 10,
      enable_email_alert: true
    },
    {
      id: 2,
      tenant_id: 1,
      name: 'Portefeuille en cuir',
      category_id: 2,
      description: 'Élégant portefeuille en cuir véritable tanné végétalement.',
      image_url: 'https://images.unsplash.com/photo-1615393437348-91778c454593?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=600',
      attributes: JSON.stringify([]),
      low_stock_threshold: 5,
      enable_email_alert: false
    }
  ],

  product_variants: [
    // T-Shirt variants
    { id: 101, product_id: 1, selected_options: JSON.stringify({ 'Taille': 'S', 'Couleur': 'Noir'}), price: 15000, cost_price: 8000, sku: 'TS-GEM-S-BLK', barcode: '8801010001' },
    { id: 102, product_id: 1, selected_options: JSON.stringify({ 'Taille': 'M', 'Couleur': 'Noir'}), price: 15000, cost_price: 8000, sku: 'TS-GEM-M-BLK', barcode: '8801010002' },
    { id: 103, product_id: 1, selected_options: JSON.stringify({ 'Taille': 'L', 'Couleur': 'Noir'}), price: 15000, cost_price: 8000, sku: 'TS-GEM-L-BLK', barcode: '8801010003' },
    { id: 104, product_id: 1, selected_options: JSON.stringify({ 'Taille': 'S', 'Couleur': 'Blanc'}), price: 15000, cost_price: 8000, sku: 'TS-GEM-S-WHT', barcode: '8801010004' },
    { id: 105, product_id: 1, selected_options: JSON.stringify({ 'Taille': 'M', 'Couleur': 'Blanc'}), price: 15000, cost_price: 8000, sku: 'TS-GEM-M-WHT', barcode: '8801010005' },
    { id: 106, product_id: 1, selected_options: JSON.stringify({ 'Taille': 'L', 'Couleur': 'Blanc'}), price: 15000, cost_price: 8000, sku: 'TS-GEM-L-WHT', barcode: '8801010006' },
    // Portefeuille variant
    { id: 201, product_id: 2, selected_options: JSON.stringify({}), price: 45000, cost_price: 22000, sku: 'ACC-WALLET-LTH', barcode: '8801020001' },
  ],

  inventory: [
    // T-Shirt inventory
    { variant_id: 101, store_id: 1, quantity: 15 },
    { variant_id: 102, store_id: 1, quantity: 20 },
    { variant_id: 103, store_id: 1, quantity: 12 },
    { variant_id: 104, store_id: 1, quantity: 18 },
    { variant_id: 105, store_id: 1, quantity: 0 },
    { variant_id: 106, store_id: 1, quantity: 8 },
    // Portefeuille inventory
    { variant_id: 201, store_id: 1, quantity: 10 },
    // Store 2 inventory (empty for now)
    { variant_id: 101, store_id: 2, quantity: 0 },
    { variant_id: 102, store_id: 2, quantity: 0 },
    { variant_id: 103, store_id: 2, quantity: 0 },
    { variant_id: 104, store_id: 2, quantity: 0 },
    { variant_id: 105, store_id: 2, quantity: 0 },
    { variant_id: 106, store_id: 2, quantity: 0 },
    { variant_id: 201, store_id: 2, quantity: 0 },
  ]
};

async function migrateData() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Début de la migration des données...');
    
    await client.query('BEGIN');

    // 1. Nettoyer les données existantes (dans l'ordre inverse des dépendances)
    console.log('🧹 Nettoyage des données existantes...');
    await client.query('DELETE FROM inventory');
    await client.query('DELETE FROM product_variants');
    await client.query('DELETE FROM products');
    await client.query('DELETE FROM categories');
    await client.query('DELETE FROM promo_codes');
    await client.query('DELETE FROM customers');
    await client.query('DELETE FROM users WHERE id != 0'); // Garder le superadmin
    await client.query('DELETE FROM suppliers');
    await client.query('DELETE FROM stores');
    await client.query('DELETE FROM settings WHERE tenant_id = 1');

    // 2. Insérer les magasins
    console.log('🏪 Insertion des magasins...');
    for (const store of MOCK_DATA.stores) {
      await client.query(
        'INSERT INTO stores (id, tenant_id, name, location, phone) VALUES ($1, $2, $3, $4, $5)',
        [store.id, store.tenant_id, store.name, store.location, store.phone]
      );
    }

    // 3. Insérer les fournisseurs
    console.log('🚚 Insertion des fournisseurs...');
    for (const supplier of MOCK_DATA.suppliers) {
      await client.query(
        'INSERT INTO suppliers (id, tenant_id, name, contact_person, email, phone) VALUES ($1, $2, $3, $4, $5, $6)',
        [supplier.id, supplier.tenant_id, supplier.name, supplier.contact_person, supplier.email, supplier.phone]
      );
    }

    // 4. Insérer les catégories
    console.log('📂 Insertion des catégories...');
    for (const category of MOCK_DATA.categories) {
      await client.query(
        'INSERT INTO categories (id, tenant_id, name, description) VALUES ($1, $2, $3, $4)',
        [category.id, category.tenant_id, category.name, category.description]
      );
    }

    // 5. Insérer les utilisateurs avec mots de passe hashés
    console.log('👥 Insertion des utilisateurs...');
    const passwords = {
      'proprietaire': 'owner',
      'admin': 'admin',
      'gerant': 'manager',
      'employe': 'staff',
      'caissiere': 'password'
    };

    for (const user of MOCK_DATA.users) {
      const passwordHash = await bcrypt.hash(passwords[user.username], 10);
      await client.query(
        'INSERT INTO users (id, tenant_id, username, email, first_name, last_name, password_hash, role, assigned_store_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [user.id, user.tenant_id, user.username, user.email, user.first_name, user.last_name, passwordHash, user.role, user.assigned_store_id]
      );
    }

    // 6. Insérer les clients
    console.log('👤 Insertion des clients...');
    for (const customer of MOCK_DATA.customers) {
      await client.query(
        'INSERT INTO customers (id, tenant_id, first_name, last_name, email, phone, loyalty_points, store_credit, store_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [customer.id, customer.tenant_id, customer.first_name, customer.last_name, customer.email, customer.phone, customer.loyalty_points, customer.store_credit, customer.store_id]
      );
    }

    // 7. Insérer les codes promo
    console.log('🎫 Insertion des codes promo...');
    for (const promo of MOCK_DATA.promo_codes) {
      await client.query(
        'INSERT INTO promo_codes (id, tenant_id, code, type, value, is_active) VALUES ($1, $2, $3, $4, $5, $6)',
        [promo.id, promo.tenant_id, promo.code, promo.type, promo.value, promo.is_active]
      );
    }

    // 8. Insérer les produits
    console.log('📦 Insertion des produits...');
    for (const product of MOCK_DATA.products) {
      await client.query(
        'INSERT INTO products (id, tenant_id, name, category_id, description, image_url, attributes, low_stock_threshold, enable_email_alert) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [product.id, product.tenant_id, product.name, product.category_id, product.description, product.image_url, product.attributes, product.low_stock_threshold, product.enable_email_alert]
      );
    }

    // 9. Insérer les variantes de produits
    console.log('🔄 Insertion des variantes...');
    for (const variant of MOCK_DATA.product_variants) {
      await client.query(
        'INSERT INTO product_variants (id, product_id, selected_options, price, cost_price, sku, barcode) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [variant.id, variant.product_id, variant.selected_options, variant.price, variant.cost_price, variant.sku, variant.barcode]
      );
    }

    // 10. Insérer l'inventaire
    console.log('📊 Insertion de l\'inventaire...');
    for (const inv of MOCK_DATA.inventory) {
      await client.query(
        'INSERT INTO inventory (variant_id, store_id, quantity) VALUES ($1, $2, $3)',
        [inv.variant_id, inv.store_id, inv.quantity]
      );
    }

    // 11. Insérer les paramètres par défaut
    console.log('⚙️ Insertion des paramètres...');
    await client.query(
      'INSERT INTO settings (tenant_id, store_name, tax_rate, loyalty_program_enabled, loyalty_points_per_dollar, loyalty_point_value) VALUES ($1, $2, $3, $4, $5, $6)',
      [1, 'Gemini Retail', 0.18, true, 0.01, 1]
    );

    // Réinitialiser les séquences
    console.log('🔄 Réinitialisation des séquences...');
    await client.query('SELECT setval(\'stores_id_seq\', (SELECT MAX(id) FROM stores))');
    await client.query('SELECT setval(\'suppliers_id_seq\', (SELECT MAX(id) FROM suppliers))');
    await client.query('SELECT setval(\'categories_id_seq\', (SELECT MAX(id) FROM categories))');
    await client.query('SELECT setval(\'users_id_seq\', (SELECT MAX(id) FROM users))');
    await client.query('SELECT setval(\'customers_id_seq\', (SELECT MAX(id) FROM customers))');
    await client.query('SELECT setval(\'promo_codes_id_seq\', (SELECT MAX(id) FROM promo_codes))');
    await client.query('SELECT setval(\'products_id_seq\', (SELECT MAX(id) FROM products))');
    await client.query('SELECT setval(\'product_variants_id_seq\', (SELECT MAX(id) FROM product_variants))');

    await client.query('COMMIT');
    
    console.log('✅ Migration terminée avec succès!');
    console.log('');
    console.log('📋 Données migrées:');
    console.log(`   - ${MOCK_DATA.stores.length} magasins`);
    console.log(`   - ${MOCK_DATA.suppliers.length} fournisseurs`);
    console.log(`   - ${MOCK_DATA.categories.length} catégories`);
    console.log(`   - ${MOCK_DATA.users.length} utilisateurs`);
    console.log(`   - ${MOCK_DATA.customers.length} clients`);
    console.log(`   - ${MOCK_DATA.promo_codes.length} codes promo`);
    console.log(`   - ${MOCK_DATA.products.length} produits`);
    console.log(`   - ${MOCK_DATA.product_variants.length} variantes`);
    console.log(`   - ${MOCK_DATA.inventory.length} entrées d'inventaire`);
    console.log('');
    console.log('🔑 Comptes utilisateurs:');
    console.log('   - proprietaire / owner (Propriétaire)');
    console.log('   - admin / admin (Administrateur)');
    console.log('   - gerant / manager (Gérant)');
    console.log('   - employe / staff (Caissier)');
    console.log('   - caissiere / password (Caissier)');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur lors de la migration:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

migrateData()
  .then(() => {
    console.log('🎉 Migration complète!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Échec de la migration:', error);
    process.exit(1);
  });