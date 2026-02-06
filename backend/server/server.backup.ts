
// Serveur de développement local pour Smart POS
// Commande: npm run dev:server

import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import bcrypt from 'bcrypt';

// Charger les variables d'environnement
dotenv.config({ path: '.env.local' });

const app = express();
const port = process.env.PORT || 5000;

// Configuration PostgreSQL depuis les variables d'environnement
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'gemini_pos_dev',
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

// Test de connexion à la base de données
pool.connect()
  .then(() => console.log('✅ Connexion à PostgreSQL réussie'))
  .catch(err => console.error('❌ Erreur de connexion PostgreSQL:', err.message));

app.use(cors());
app.use(express.json());

// Helper function to get permissions for role
function getPermissionsForRole(role: string) {
  const ROLE_PERMISSIONS = {
    'superadmin': {
      viewAnalytics: false,
      manageProducts: false,
      viewHistory: false,
      accessSettings: false,
      manageUsers: true,
      manageStores: false,
      manageLicenses: true,
    },
    'owner': {
      viewAnalytics: true,
      manageProducts: true,
      viewHistory: true,
      accessSettings: true,
      manageUsers: true,
      manageStores: true,
      manageLicenses: false,
    },
    'admin': {
      viewAnalytics: true,
      manageProducts: true,
      viewHistory: true,
      accessSettings: true,
      manageUsers: true,
      manageStores: true,
      manageLicenses: false,
    },
    'manager': {
      viewAnalytics: true,
      manageProducts: true,
      viewHistory: true,
      accessSettings: false,
      manageUsers: false,
      manageStores: false,
      manageLicenses: false,
    },
    'cashier': {
      viewAnalytics: false,
      manageProducts: false,
      viewHistory: true,
      accessSettings: false,
      manageUsers: false,
      manageStores: false,
      manageLicenses: false,
    },
  };

  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS['cashier'];
}

// Route d'authentification
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password required' });
    }

    // Rechercher l'utilisateur dans la base de données
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const dbUser = result.rows[0];
    
    // Vérifier le mot de passe
    const isValidPassword = await bcrypt.compare(password, dbUser.password_hash);
    
    if (!isValidPassword) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Construire l'objet utilisateur pour le frontend
    const user = {
      id: dbUser.id,
      tenantId: dbUser.tenant_id,
      username: dbUser.username,
      email: dbUser.email,
      firstName: dbUser.first_name,
      lastName: dbUser.last_name,
      role: dbUser.role,
      permissions: getPermissionsForRole(dbUser.role),
      assignedStoreId: dbUser.assigned_store_id
    };

    res.json({ success: true, user });
    
  } catch (error) {
    console.error('Erreur lors de l\'authentification:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Route de mise à jour de l'inventaire
app.post('/api/inventory/update', async (req, res) => {
  try {
    const { variantId, storeId, change, reason, userId, notes } = req.body;
    
    if (!variantId || !storeId || change === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Mettre à jour l'inventaire
      const currentInventory = await client.query(
        'SELECT quantity FROM inventory WHERE variant_id = $1 AND store_id = $2',
        [variantId, storeId]
      );
      
      const currentQuantity = currentInventory.rows[0]?.quantity || 0;
      const newQuantity = currentQuantity + change;
      
      if (currentInventory.rows.length > 0) {
        await client.query(
          'UPDATE inventory SET quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE variant_id = $2 AND store_id = $3',
          [newQuantity, variantId, storeId]
        );
      } else {
        await client.query(
          'INSERT INTO inventory (variant_id, store_id, quantity) VALUES ($1, $2, $3)',
          [variantId, storeId, newQuantity]
        );
      }
      
      // Ajouter l'entrée dans l'historique
      await client.query(
        'INSERT INTO stock_history (variant_id, store_id, change_amount, new_quantity, reason, notes, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [variantId, storeId, change, newQuantity, reason, notes, userId]
      );
      
      await client.query('COMMIT');
      res.json({ success: true, newQuantity });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'inventaire:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Routes pour les clients
app.get('/api/customers', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM customers ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/customers', async (req, res) => {
  try {
    const { tenant_id, first_name, last_name, email, phone, store_id } = req.body;
    
    const result = await pool.query(
      'INSERT INTO customers (tenant_id, first_name, last_name, email, phone, store_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [tenant_id, first_name, last_name, email, phone, store_id]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, email, phone, loyalty_points, store_credit, store_id } = req.body;
    
    const result = await pool.query(
      'UPDATE customers SET first_name = $1, last_name = $2, email = $3, phone = $4, loyalty_points = $5, store_credit = $6, store_id = $7, updated_at = CURRENT_TIMESTAMP WHERE id = $8 RETURNING *',
      [first_name, last_name, email, phone, loyalty_points, store_credit, store_id, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Routes pour les magasins
app.get('/api/stores', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM stores ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/stores', async (req, res) => {
  try {
    const { tenant_id, name, location, phone } = req.body;
    
    const result = await pool.query(
      'INSERT INTO stores (tenant_id, name, location, phone) VALUES ($1, $2, $3, $4) RETURNING *',
      [tenant_id, name, location, phone]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/stores/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location, phone } = req.body;
    
    const result = await pool.query(
      'UPDATE stores SET name = $1, location = $2, phone = $3 WHERE id = $4 RETURNING *',
      [name, location, phone, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Store not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/stores/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM stores WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Store not found' });
    }
    
    res.json({ message: 'Store deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== ACTION LOGS ENDPOINTS =====

// Get action logs
app.get('/api/action-logs', async (req, res) => {
  console.log('🔍 Route /api/action-logs appelée');
  try {
    console.log('🔍 Tentative de récupération des action logs...');
    
    const result = await pool.query(`
      SELECT 
        al.id,
        al.tenant_id,
        al.user_id,
        al.action,
        al.details,
        al.created_at,
        u.username
      FROM "action_logs" al
      JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT 1000
    `);

    console.log(`✅ ${result.rows.length} logs récupérés`);

    // Transformer les données pour correspondre au format attendu
    const logs = result.rows.map(log => ({
      id: log.id,
      tenantId: log.tenant_id,
      timestamp: new Date(log.created_at),
      userId: log.user_id,
      username: log.username,
      action: log.action,
      details: log.details
    }));

    res.json(logs);
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des logs:', error);
    console.error('Détails de l\'erreur:', error.message);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// Create action log
app.post('/api/action-logs', async (req, res) => {
  try {
    console.log('📝 Tentative de création d\'un action log:', req.body);
    
    const { tenant_id, user_id, action, details } = req.body;

    if (!tenant_id || !user_id || !action) {
      console.log('❌ Données manquantes:', { tenant_id, user_id, action });
      return res.status(400).json({ error: 'Données manquantes' });
    }

    const result = await pool.query(
      'INSERT INTO "action_logs" (tenant_id, user_id, action, details) VALUES ($1, $2, $3, $4) RETURNING *',
      [tenant_id, user_id, action, details]
    );

    console.log('✅ Action log créé:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('❌ Erreur lors de la création du log:', error);
    console.error('Détails de l\'erreur:', error.message);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// ===== PRODUCTS ENDPOINTS =====

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    console.log('🛍️ Récupération des produits...');
    
    const result = await pool.query(`
      SELECT 
        p.*,
        json_agg(
          json_build_object(
            'id', pv.id,
            'selectedOptions', pv.selected_options,
            'price', pv.price,
            'costPrice', pv.cost_price,
            'stock_quantity', pv.stock_quantity,
            'sku', pv.sku,
            'barcode', pv.barcode
          )
        ) as variants
      FROM products p
      LEFT JOIN product_variants pv ON p.id = pv.product_id
      GROUP BY p.id
      ORDER BY p.name
    `);

    console.log(`✅ ${result.rows.length} produits récupérés`);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des produits:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// Get product variants
app.get('/api/product-variants', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM product_variants ORDER BY product_id, id');
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des variantes:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Get inventory
app.get('/api/inventory', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM inventory ORDER BY variant_id, store_id');
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'inventaire:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Get categories
app.get('/api/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des catégories:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Create product
app.post('/api/products', async (req, res) => {
  try {
    console.log('📦 Création d\'un nouveau produit:', req.body);
    
    const { name, category, description, imageUrl, attributes, variants, tenantId, low_stock_threshold, enable_email_alert } = req.body;

    // Créer le produit
    const productResult = await pool.query(
      'INSERT INTO products (tenant_id, name, category, description, image_url, attributes, low_stock_threshold, enable_email_alert) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [tenantId, name, category, description, imageUrl, JSON.stringify(attributes), low_stock_threshold, enable_email_alert]
    );

    const product = productResult.rows[0];
    console.log('✅ Produit créé:', product);

    // Créer les variantes
    const createdVariants = [];
    for (const variant of variants) {
      const variantResult = await pool.query(
        'INSERT INTO product_variants (product_id, selected_options, price, cost_price, stock_quantity, sku, barcode) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [product.id, JSON.stringify(variant.selectedOptions), variant.price, variant.costPrice, variant.stock_quantity, variant.sku, variant.barcode]
      );
      createdVariants.push(variantResult.rows[0]);
    }

    console.log(`✅ ${createdVariants.length} variantes créées`);

    res.status(201).json({ ...product, variants: createdVariants });
  } catch (error) {
    console.error('❌ Erreur lors de la création du produit:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// Update inventory (duplicate route - we'll keep the existing one)
app.post('/api/inventory/update', async (req, res) => {
  try {
    console.log('📊 Mise à jour inventaire:', req.body);
    
    const { variantId, storeId, change, reason, userId, notes } = req.body;

    // Vérifier si l'entrée inventaire existe
    const existingResult = await pool.query(
      'SELECT * FROM inventory WHERE variant_id = $1 AND store_id = $2',
      [variantId, storeId]
    );

    if (existingResult.rows.length > 0) {
      // Mettre à jour l'inventaire existant
      const updateResult = await pool.query(
        'UPDATE inventory SET quantity = quantity + $1 WHERE variant_id = $2 AND store_id = $3 RETURNING *',
        [change, variantId, storeId]
      );
      
      // Enregistrer l'historique
      await pool.query(
        'INSERT INTO stock_history (variant_id, store_id, change_quantity, reason, user_id, notes) VALUES ($1, $2, $3, $4, $5, $6)',
        [variantId, storeId, change, reason, userId, notes]
      );

      console.log('✅ Inventaire mis à jour:', updateResult.rows[0]);
      res.json(updateResult.rows[0]);
    } else {
      // Créer une nouvelle entrée inventaire
      const insertResult = await pool.query(
        'INSERT INTO inventory (variant_id, store_id, quantity) VALUES ($1, $2, $3) RETURNING *',
        [variantId, storeId, Math.max(0, change)]
      );
      
      // Enregistrer l'historique
      await pool.query(
        'INSERT INTO stock_history (variant_id, store_id, change_quantity, reason, user_id, notes) VALUES ($1, $2, $3, $4, $5, $6)',
        [variantId, storeId, change, reason, userId, notes]
      );

      console.log('✅ Nouvelle entrée inventaire créée:', insertResult.rows[0]);
      res.json(insertResult.rows[0]);
    }
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour de l\'inventaire:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// Routes API génériques (APRÈS les routes spécifiques)
app.get('/api/:table', async (req, res) => {
  try {
    const { table } = req.params;
    const result = await pool.query(`SELECT * FROM ${table} ORDER BY id ASC`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/:table', async (req, res) => {
    try {
        const { table } = req.params;
        const keys = Object.keys(req.body).join(', ');
        const values = Object.values(req.body);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
        
        const query = `INSERT INTO ${table} (${keys}) VALUES (${placeholders}) RETURNING *`;
        const result = await pool.query(query, values);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Route spécifique pour les ventes (Transaction)
app.post('/api/complete-sale', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { sale, items } = req.body;
        
        // 1. Insérer la vente
        const saleRes = await client.query(
            `INSERT INTO sales (store_id, user_id, customer_id, subtotal, tax, total) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [sale.storeId, sale.userId, sale.customerId, sale.subtotal, sale.tax, sale.total]
        );
        const saleId = saleRes.rows[0].id;

        // 2. Insérer les articles et mettre à jour le stock
        for (const item of items) {
            await client.query(
                `INSERT INTO sale_items (sale_id, product_id, variant_id, quantity, unit_price, total_price) VALUES ($1, $2, $3, $4, $5, $6)`,
                [saleId, item.productId, item.variantId, item.quantity, item.price, item.total]
            );
            await client.query(
                `UPDATE inventory SET quantity = quantity - $1 WHERE variant_id = $2 AND store_id = $3`,
                [item.quantity, item.variantId, sale.storeId]
            );
        }

        await client.query('COMMIT');
        res.json({ success: true, saleId });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// ===== ACTION LOGS ENDPOINTS =====

// Get action logs
app.get('/api/action-logs', async (req, res) => {
  console.log('🔍 Route /api/action-logs appelée');
  try {
    console.log('🔍 Tentative de récupération des action logs...');
    
    const result = await pool.query(`
      SELECT 
        al.id,
        al.tenant_id,
        al.user_id,
        al.action,
        al.details,
        al.created_at,
        u.username
      FROM "action_logs" al
      JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT 1000
    `);

    console.log(`✅ ${result.rows.length} logs récupérés`);

    // Transformer les données pour correspondre au format attendu
    const logs = result.rows.map(log => ({
      id: log.id,
      tenantId: log.tenant_id,
      timestamp: new Date(log.created_at),
      userId: log.user_id,
      username: log.username,
      action: log.action,
      details: log.details
    }));

    res.json(logs);
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des logs:', error);
    console.error('Détails de l\'erreur:', error.message);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// Create action log
app.post('/api/action-logs', async (req, res) => {
  try {
    console.log('📝 Tentative de création d\'un action log:', req.body);
    
    const { tenant_id, user_id, action, details } = req.body;

    if (!tenant_id || !user_id || !action) {
      console.log('❌ Données manquantes:', { tenant_id, user_id, action });
      return res.status(400).json({ error: 'Données manquantes' });
    }

    const result = await pool.query(
      'INSERT INTO "action_logs" (tenant_id, user_id, action, details) VALUES ($1, $2, $3, $4) RETURNING *',
      [tenant_id, user_id, action, details]
    );

    console.log('✅ Action log créé:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('❌ Erreur lors de la création du log:', error);
    console.error('Détails de l\'erreur:', error.message);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// ===== END ACTION LOGS ENDPOINTS =====

// ===== PRODUCTS ENDPOINTS =====

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    console.log('🛍️ Récupération des produits...');
    
    const result = await pool.query(`
      SELECT 
        p.*,
        json_agg(
          json_build_object(
            'id', pv.id,
            'selectedOptions', pv.selected_options,
            'price', pv.price,
            'costPrice', pv.cost_price,
            'stock_quantity', pv.stock_quantity,
            'sku', pv.sku,
            'barcode', pv.barcode
          )
        ) as variants
      FROM products p
      LEFT JOIN product_variants pv ON p.id = pv.product_id
      GROUP BY p.id
      ORDER BY p.name
    `);

    console.log(`✅ ${result.rows.length} produits récupérés`);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des produits:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// Get product variants
app.get('/api/product-variants', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM product_variants ORDER BY product_id, id');
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des variantes:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Get inventory
app.get('/api/inventory', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM inventory ORDER BY variant_id, store_id');
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'inventaire:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Get categories
app.get('/api/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des catégories:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Create product
app.post('/api/products', async (req, res) => {
  try {
    console.log('📦 Création d\'un nouveau produit:', req.body);
    
    const { name, category, description, imageUrl, attributes, variants, tenantId, low_stock_threshold, enable_email_alert } = req.body;

    // Créer le produit
    const productResult = await pool.query(
      'INSERT INTO products (tenant_id, name, category, description, image_url, attributes, low_stock_threshold, enable_email_alert) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [tenantId, name, category, description, imageUrl, JSON.stringify(attributes), low_stock_threshold, enable_email_alert]
    );

    const product = productResult.rows[0];
    console.log('✅ Produit créé:', product);

    // Créer les variantes
    const createdVariants = [];
    for (const variant of variants) {
      const variantResult = await pool.query(
        'INSERT INTO product_variants (product_id, selected_options, price, cost_price, stock_quantity, sku, barcode) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [product.id, JSON.stringify(variant.selectedOptions), variant.price, variant.costPrice, variant.stock_quantity, variant.sku, variant.barcode]
      );
      createdVariants.push(variantResult.rows[0]);
    }

    console.log(`✅ ${createdVariants.length} variantes créées`);

    res.status(201).json({ ...product, variants: createdVariants });
  } catch (error) {
    console.error('❌ Erreur lors de la création du produit:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// Update inventory
app.post('/api/inventory/update', async (req, res) => {
  try {
    console.log('📊 Mise à jour inventaire:', req.body);
    
    const { variantId, storeId, change, reason, userId, notes } = req.body;

    // Vérifier si l'entrée inventaire existe
    const existingResult = await pool.query(
      'SELECT * FROM inventory WHERE variant_id = $1 AND store_id = $2',
      [variantId, storeId]
    );

    if (existingResult.rows.length > 0) {
      // Mettre à jour l'inventaire existant
      const updateResult = await pool.query(
        'UPDATE inventory SET quantity = quantity + $1 WHERE variant_id = $2 AND store_id = $3 RETURNING *',
        [change, variantId, storeId]
      );
      
      // Enregistrer l'historique
      await pool.query(
        'INSERT INTO stock_history (variant_id, store_id, change_quantity, reason, user_id, notes) VALUES ($1, $2, $3, $4, $5, $6)',
        [variantId, storeId, change, reason, userId, notes]
      );

      console.log('✅ Inventaire mis à jour:', updateResult.rows[0]);
      res.json(updateResult.rows[0]);
    } else {
      // Créer une nouvelle entrée inventaire
      const insertResult = await pool.query(
        'INSERT INTO inventory (variant_id, store_id, quantity) VALUES ($1, $2, $3) RETURNING *',
        [variantId, storeId, Math.max(0, change)]
      );
      
      // Enregistrer l'historique
      await pool.query(
        'INSERT INTO stock_history (variant_id, store_id, change_quantity, reason, user_id, notes) VALUES ($1, $2, $3, $4, $5, $6)',
        [variantId, storeId, change, reason, userId, notes]
      );

      console.log('✅ Nouvelle entrée inventaire créée:', insertResult.rows[0]);
      res.json(insertResult.rows[0]);
    }
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour de l\'inventaire:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// ===== END PRODUCTS ENDPOINTS =====

app.listen(port, () => {
  console.log(`Backend POS running on http://localhost:${port}`);
});
