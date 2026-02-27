import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { createInvoicesRouter } from './routes/invoices.routes';

// Charger les variables d'environnement selon l'environnement
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: envFile });

console.log(`🔧 Environnement: ${process.env.NODE_ENV || 'development'}`);
console.log(`📁 Fichier .env chargé: ${envFile}`);
console.log(`🔌 PORT configuré: ${process.env.PORT}`);

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://localhost:3001', 
    'http://192.168.8.100:3001',
    'https://smartpos.cooldigital.africa',
    'https://api.smartpos.cooldigital.africa'
  ],
  credentials: true
}));
app.use(express.json({ limit: '10mb' })); // Augmenter la limite pour les images
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Servir les fichiers statiques (logos uploadés)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configuration de multer pour l'upload de fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads', 'logos');
    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Générer un nom unique avec timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${req.body.type || 'logo'}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    // Accepter uniquement les images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images sont autorisées'));
    }
  }
});

// Configuration PostgreSQL - Utiliser DATABASE_URL de Coolify/Supabase
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test de connexion
pool.connect()
  .then(() => console.log('✅ Connexion à PostgreSQL réussie'))
  .catch(err => console.error('❌ Erreur de connexion PostgreSQL:', err));

// Fonction pour obtenir les permissions basées sur le rôle
function getPermissionsForRole(role: string) {
  switch (role) {
    case 'superadmin':
      return {
        viewAnalytics: true,
        manageProducts: true,
        viewHistory: true,
        accessSettings: true,
        manageUsers: true,
        manageStores: true,
        manageLicenses: true
      };
    case 'owner':
      return {
        viewAnalytics: true,
        manageProducts: true,
        viewHistory: true,
        accessSettings: true,
        manageUsers: true,
        manageStores: true,
        manageLicenses: false
      };
    case 'admin':
      return {
        viewAnalytics: true,
        manageProducts: true,
        viewHistory: true,
        accessSettings: true,
        manageUsers: true,
        manageStores: true,
        manageLicenses: false
      };
    case 'manager':
      return {
        viewAnalytics: true,
        manageProducts: true,
        viewHistory: true,
        accessSettings: false,
        manageUsers: false,
        manageStores: false,
        manageLicenses: false
      };
    case 'cashier':
      return {
        viewAnalytics: false,
        manageProducts: false,
        viewHistory: true,
        accessSettings: false,
        manageUsers: false,
        manageStores: false,
        manageLicenses: false
      };
    default:
      return {
        viewAnalytics: false,
        manageProducts: false,
        viewHistory: false,
        accessSettings: false,
        manageUsers: false,
        manageStores: false,
        manageLicenses: false
      };
  }
}

// ===== ROUTES SPÉCIFIQUES (AVANT LES ROUTES GÉNÉRIQUES) =====

// ===== HEALTH CHECK =====
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Smart POS Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', async (req, res) => {
  try {
    // Vérifier la connexion à la base de données
    await pool.query('SELECT 1');
    res.json({ 
      status: 'healthy', 
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'unhealthy', 
      database: 'disconnected',
      error: error.message 
    });
  }
});

// ===== EMAIL ENDPOINT =====
app.post('/api/send-email', async (req, res) => {
  try {
    const { to, subject, body } = req.body;
    
    if (!to || !subject || !body) {
      return res.status(400).json({ error: 'Missing required fields: to, subject, body' });
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;
    const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';
    const FROM_NAME = process.env.FROM_NAME || 'Smart POS';

    if (!RESEND_API_KEY) {
      console.log('⚠️ RESEND_API_KEY non configurée, simulation d\'envoi');
      return res.json({ 
        success: true, 
        simulated: true,
        message: 'Email simulé (RESEND_API_KEY non configurée)' 
      });
    }

    // Convertir Markdown en HTML simple
    const htmlBody = body
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`(.+?)`/g, '<code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px;">$1</code>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');

    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">Smart POS</h1>
        </div>
        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <p>${htmlBody}</p>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px;">
          <p>© ${new Date().getFullYear()} Smart POS. Tous droits réservés.</p>
        </div>
      </body>
      </html>
    `;

    // Appel à l'API Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: [to],
        subject: subject,
        html: htmlTemplate
      })
    });

    if (!response.ok) {
      const error: any = await response.json();
      console.error('❌ Erreur Resend:', error);
      return res.status(500).json({ error: 'Failed to send email', details: error });
    }

    const data: any = await response.json();
    console.log('✅ Email envoyé via Resend:', data.id);
    
    res.json({ success: true, emailId: data.id });
  } catch (error: any) {
    console.error('❌ Erreur envoi email:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// ===== ACTION LOGS ENDPOINTS =====
app.get('/api/action-logs', async (req, res) => {
  console.log('🔍 Route /api/action-logs appelée');
  try {
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
    console.error('❌ Erreur logs:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

app.post('/api/action-logs', async (req, res) => {
  try {
    console.log('📝 Création action log:', req.body);
    
    const { tenant_id, user_id, action, details } = req.body;

    // Permettre tenant_id = 0 pour les actions du superadmin
    if (tenant_id === undefined || tenant_id === null || user_id === undefined || user_id === null || !action) {
      console.error('❌ Données manquantes:', { tenant_id, user_id, action });
      return res.status(400).json({ error: 'Données manquantes' });
    }

    console.log('🔍 Tentative d\'insertion:', { tenant_id, user_id, action, details });

    const result = await pool.query(
      'INSERT INTO "action_logs" (tenant_id, user_id, action, details) VALUES ($1, $2, $3, $4) RETURNING *',
      [tenant_id, user_id, action, details]
    );

    console.log('✅ Action log créé:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('❌ Erreur création log:', error);
    console.error('   Message:', error.message);
    console.error('   Code:', error.code);
    console.error('   Detail:', error.detail);
    res.status(500).json({ error: 'Erreur serveur', details: error.message, code: error.code });
  }
});

// ===== PRODUCTS ENDPOINTS =====
app.get('/api/products', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'];
    console.log('🛍️ Récupération produits pour tenant:', tenantId);
    
    if (!tenantId) {
      return res.status(400).json({ error: 'x-tenant-id header requis' });
    }
    
    // Récupérer les produits avec variantes ET catégories
    const result = await pool.query(`
      SELECT 
        p.*,
        c.name as category_name,
        COALESCE(
          json_agg(
            CASE WHEN pv.id IS NOT NULL THEN
              json_build_object(
                'id', pv.id,
                'selectedOptions', pv.selected_options,
                'price', pv.price,
                'costPrice', pv.cost_price,
                'sku', pv.sku,
                'barcode', pv.barcode
              )
            END
          ) FILTER (WHERE pv.id IS NOT NULL),
          '[]'::json
        ) as variants
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_variants pv ON p.id = pv.product_id
      WHERE p.tenant_id = $1
      GROUP BY p.id, c.name
      ORDER BY p.name
    `, [tenantId]);

    // Récupérer l'inventaire pour toutes les variantes
    const inventoryResult = await pool.query(`
      SELECT variant_id, store_id, quantity
      FROM inventory
    `);

    // Créer un map de l'inventaire par variant_id
    const inventoryMap = new Map();
    inventoryResult.rows.forEach(inv => {
      if (!inventoryMap.has(inv.variant_id)) {
        inventoryMap.set(inv.variant_id, {});
      }
      inventoryMap.get(inv.variant_id)[inv.store_id] = inv.quantity;
    });

    // Enrichir les produits avec l'inventaire
    const productsWithInventory = result.rows.map(product => {
      const variants = product.variants.map(variant => {
        const quantityByStore = inventoryMap.get(variant.id) || {};
        const totalStock = Object.values(quantityByStore).reduce((sum: number, qty: any) => sum + (qty || 0), 0);
        
        return {
          ...variant,
          stock_quantity: totalStock,
          quantityByStore: quantityByStore
        };
      });

      return {
        ...product,
        category: product.category_name || 'Autre', // Utiliser le nom de la catégorie
        variants: variants
      };
    });

    console.log(`✅ ${productsWithInventory.length} produits récupérés avec inventaire`);
    res.json(productsWithInventory);
  } catch (error) {
    console.error('❌ Erreur produits:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

app.get('/api/product-variants', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM product_variants ORDER BY product_id, id');
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Erreur variantes:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.get('/api/inventory', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM inventory ORDER BY variant_id, store_id');
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Erreur inventaire:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.get('/api/categories', async (req, res) => {
  try {
    console.log('📁 Récupération catégories...');
    const result = await pool.query('SELECT * FROM categories ORDER BY name');
    console.log(`✅ ${result.rows.length} catégories récupérées`);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Erreur catégories:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    console.log('📁 Création catégorie:', req.body);
    const { name, tenantId } = req.body;

    if (!name || !tenantId) {
      return res.status(400).json({ error: 'Nom et tenantId requis' });
    }

    // Vérifier si la catégorie existe déjà
    const existingCategory = await pool.query(
      'SELECT id FROM categories WHERE name = $1 AND tenant_id = $2',
      [name, tenantId]
    );

    if (existingCategory.rows.length > 0) {
      return res.status(409).json({ error: 'Catégorie existe déjà' });
    }

    // Créer la nouvelle catégorie
    const result = await pool.query(
      'INSERT INTO categories (tenant_id, name) VALUES ($1, $2) RETURNING *',
      [tenantId, name]
    );

    console.log('✅ Catégorie créée:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('❌ Erreur création catégorie:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    console.log('📦 Création produit:', req.body);
    
    const { name, category, description, imageUrl, attributes, variants, tenantId, storeId, low_stock_threshold, enable_email_alert } = req.body;

    // Trouver ou créer la catégorie
    let categoryId = null;
    if (category) {
      // Chercher la catégorie existante
      const categoryResult = await pool.query(
        'SELECT id FROM categories WHERE name = $1 AND tenant_id = $2',
        [category, tenantId]
      );
      
      if (categoryResult.rows.length > 0) {
        categoryId = categoryResult.rows[0].id;
      } else {
        // Créer une nouvelle catégorie
        const newCategoryResult = await pool.query(
          'INSERT INTO categories (tenant_id, name) VALUES ($1, $2) RETURNING id',
          [tenantId, category]
        );
        categoryId = newCategoryResult.rows[0].id;
      }
    }

    // Créer le produit
    const productResult = await pool.query(
      'INSERT INTO products (tenant_id, name, category_id, description, image_url, attributes, low_stock_threshold, enable_email_alert) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [tenantId, name, categoryId, description, imageUrl, JSON.stringify(attributes || []), low_stock_threshold || 0, enable_email_alert || false]
    );

    const product = productResult.rows[0];
    console.log('✅ Produit créé:', product.id);

    // Créer les variantes et l'inventaire initial
    const createdVariants = [];
    const activeStoreId = storeId || 1;
    
    if (variants && variants.length > 0) {
      for (const variant of variants) {
        // Créer la variante
        const variantResult = await pool.query(
          'INSERT INTO product_variants (product_id, selected_options, price, cost_price, sku, barcode) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
          [
            product.id, 
            JSON.stringify(variant.selectedOptions || {}), 
            variant.price || 0, 
            variant.costPrice || 0, 
            variant.sku || null, 
            variant.barcode || null
          ]
        );
        
        const createdVariant = variantResult.rows[0];
        
        // Créer l'entrée d'inventaire initial si stock_quantity est fourni
        const initialStock = variant.stock_quantity || 0;
        if (initialStock > 0) {
          await pool.query(
            'INSERT INTO inventory (variant_id, store_id, quantity) VALUES ($1, $2, $3) ON CONFLICT (variant_id, store_id) DO UPDATE SET quantity = $3',
            [createdVariant.id, activeStoreId, initialStock]
          );
          console.log(`✅ Inventaire initial créé: ${initialStock} unités pour variante ${createdVariant.id}`);
        } else {
          // Créer une entrée avec quantité 0 pour éviter les problèmes
          await pool.query(
            'INSERT INTO inventory (variant_id, store_id, quantity) VALUES ($1, $2, $3) ON CONFLICT (variant_id, store_id) DO NOTHING',
            [createdVariant.id, activeStoreId, 0]
          );
        }
        
        // Transformer les noms de colonnes snake_case en camelCase pour le frontend
        createdVariants.push({
          id: createdVariant.id,
          selectedOptions: createdVariant.selected_options,
          price: createdVariant.price,
          costPrice: createdVariant.cost_price, // Transformer cost_price en costPrice
          sku: createdVariant.sku,
          barcode: createdVariant.barcode,
          stock_quantity: initialStock,
          quantityByStore: { [activeStoreId]: initialStock }
        });
      }
    }

    console.log(`✅ ${createdVariants.length} variantes créées avec inventaire`);
    
    // Récupérer le nom de la catégorie pour la réponse
    let categoryName = 'Autre';
    if (categoryId) {
      const categoryResult = await pool.query(
        'SELECT name FROM categories WHERE id = $1',
        [categoryId]
      );
      if (categoryResult.rows.length > 0) {
        categoryName = categoryResult.rows[0].name;
      }
    }
    
    res.status(201).json({ 
      ...product, 
      category: categoryName,
      variants: createdVariants 
    });
  } catch (error) {
    console.error('❌ Erreur création produit:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// UPDATE product endpoint
app.patch('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, description, imageUrl, attributes, low_stock_threshold, enable_email_alert, tenantId, variants } = req.body;
    
    console.log('✏️ Mise à jour produit:', id);

    // Vérifier si le produit existe
    const productResult = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    
    if (productResult.rows.length === 0) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    // Gérer la catégorie si fournie
    let categoryId = productResult.rows[0].category_id;
    if (category) {
      const categoryResult = await pool.query(
        'SELECT id FROM categories WHERE name = $1 AND tenant_id = $2',
        [category, tenantId]
      );
      
      if (categoryResult.rows.length > 0) {
        categoryId = categoryResult.rows[0].id;
      } else {
        const newCategoryResult = await pool.query(
          'INSERT INTO categories (tenant_id, name) VALUES ($1, $2) RETURNING id',
          [tenantId, category]
        );
        categoryId = newCategoryResult.rows[0].id;
      }
    }

    // Mettre à jour le produit
    const result = await pool.query(
      `UPDATE products 
       SET name = COALESCE($1, name),
           category_id = COALESCE($2, category_id),
           description = COALESCE($3, description),
           image_url = COALESCE($4, image_url),
           attributes = COALESCE($5, attributes),
           low_stock_threshold = COALESCE($6, low_stock_threshold),
           enable_email_alert = COALESCE($7, enable_email_alert)
       WHERE id = $8
       RETURNING *`,
      [name, categoryId, description, imageUrl, JSON.stringify(attributes), low_stock_threshold, enable_email_alert, id]
    );

    // Mettre à jour les variants si fournis
    if (variants && Array.isArray(variants)) {
      console.log('🔄 Mise à jour des variants:', variants.length);
      
      for (const variant of variants) {
        if (variant.id) {
          // Mettre à jour le variant existant (sans le stock)
          await pool.query(
            `UPDATE product_variants 
             SET price = $1, 
                 cost_price = $2, 
                 sku = $3, 
                 barcode = $4
             WHERE id = $5 AND product_id = $6`,
            [variant.price, variant.costPrice || variant.cost_price, variant.sku, variant.barcode, variant.id, id]
          );
          console.log('✅ Variant mis à jour:', variant.id);
        }
      }
    }

    console.log('✅ Produit mis à jour:', result.rows[0].name);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Erreur mise à jour produit:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// DELETE product endpoint
app.delete('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ Suppression produit:', id);

    // Vérifier si le produit existe
    const productResult = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    
    if (productResult.rows.length === 0) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    const product = productResult.rows[0];
    
    // Supprimer d'abord les variantes (cascade)
    await pool.query('DELETE FROM product_variants WHERE product_id = $1', [id]);
    
    // Supprimer l'inventaire lié
    await pool.query('DELETE FROM inventory WHERE variant_id IN (SELECT id FROM product_variants WHERE product_id = $1)', [id]);
    
    // Supprimer le produit
    await pool.query('DELETE FROM products WHERE id = $1', [id]);
    
    console.log('✅ Produit supprimé:', product.name);
    res.json({ success: true, message: 'Produit supprimé avec succès' });
  } catch (error) {
    console.error('❌ Erreur suppression produit:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// ===== AUTH ENDPOINTS =====
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log('🔐 Tentative de connexion:', username);

    // Vérifier que les données sont présentes
    if (!username || !password) {
      return res.status(400).json({ error: 'Nom d\'utilisateur et mot de passe requis' });
    }

    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    
    if (result.rows.length === 0) {
      console.log('❌ Utilisateur non trouvé:', username);
      return res.status(401).json({ error: 'Utilisateur non trouvé' });
    }

    const user = result.rows[0];
    
    console.log('👤 Utilisateur trouvé:', { id: user.id, username: user.username, has_password_hash: !!user.password_hash });
    
    // Vérifier que le mot de passe hashé existe
    if (!user.password_hash) {
      console.error('❌ Mot de passe manquant pour l\'utilisateur:', username);
      return res.status(401).json({ error: 'Erreur de configuration utilisateur' });
    }

    console.log('🔍 Vérification du mot de passe...');
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    console.log('🔍 Résultat de la vérification:', isValidPassword);

    if (!isValidPassword) {
      console.log('❌ Mot de passe incorrect pour:', username);
      return res.status(401).json({ error: 'Mot de passe incorrect' });
    }

    // Retourner les données utilisateur (sans le mot de passe)
    const { password_hash: _, ...userWithoutPassword } = user;
    
    // Ajouter les permissions basées sur le rôle
    const permissions = getPermissionsForRole(user.role);
    const userWithPermissions = {
      ...userWithoutPassword,
      tenantId: user.tenant_id,
      firstName: user.first_name,
      lastName: user.last_name,
      assignedStoreId: user.assigned_store_id,
      permissions
    };
    
    console.log('✅ Connexion réussie pour:', username);
    res.json({ success: true, user: userWithPermissions });
  } catch (error) {
    console.error('❌ Erreur auth:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ===== CUSTOMERS ENDPOINTS =====
app.get('/api/customers', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM customers ORDER BY id ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Erreur clients:', error);
    res.status(500).json({ error: 'Erreur serveur' });
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
  } catch (error) {
    console.error('❌ Erreur création client:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE customer endpoint
app.delete('/api/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ Suppression client:', id);

    // Vérifier si le client existe
    const customerResult = await pool.query('SELECT * FROM customers WHERE id = $1', [id]);
    
    if (customerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Client non trouvé' });
    }

    const customer = customerResult.rows[0];
    
    // Supprimer le client
    await pool.query('DELETE FROM customers WHERE id = $1', [id]);
    
    console.log('✅ Client supprimé:', `${customer.first_name} ${customer.last_name}`);
    res.json({ success: true, message: 'Client supprimé avec succès' });
  } catch (error) {
    console.error('❌ Erreur suppression client:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// UPDATE customer endpoint
app.put('/api/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, email, phone, loyalty_points, store_credit, store_id } = req.body;

    console.log(`✏️ Mise à jour client ${id}:`, req.body);

    const result = await pool.query(
      'UPDATE customers SET first_name = $1, last_name = $2, email = $3, phone = $4, loyalty_points = $5, store_credit = $6, store_id = $7 WHERE id = $8 RETURNING *',
      [first_name, last_name, email, phone, loyalty_points || 0, store_credit || 0, store_id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client non trouvé' });
    }

    console.log('✅ Client mis à jour:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Erreur mise à jour client:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// ===== LICENSES ENDPOINTS =====
app.get('/api/licenses', async (req, res) => {
  try {
    console.log('🔑 Récupération des licences...');
    
    const result = await pool.query('SELECT * FROM licenses ORDER BY created_at DESC');
    
    console.log(`✅ ${result.rows.length} licences récupérées`);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Erreur licences:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

app.post('/api/licenses', async (req, res) => {
  try {
    console.log('🔑 Création licence:', req.body);
    
    const { key, tenant_id, assigned_to, expiry_date, plan } = req.body;

    if (!key || !assigned_to || !expiry_date || !plan) {
      return res.status(400).json({ error: 'Données manquantes' });
    }

    const result = await pool.query(
      'INSERT INTO licenses (key, tenant_id, assigned_to, expiry_date, is_active, plan) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [key, tenant_id, assigned_to, expiry_date, true, plan]
    );

    console.log('✅ Licence créée');
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('❌ Erreur création licence:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

app.patch('/api/licenses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { tenant_id } = req.body;

    console.log(`🔑 Mise à jour licence ${id} avec tenant_id:`, tenant_id);

    const result = await pool.query(
      'UPDATE licenses SET tenant_id = $1 WHERE id = $2 RETURNING *',
      [tenant_id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Licence non trouvée' });
    }

    console.log('✅ Licence mise à jour');
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Erreur mise à jour licence:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// ===== USERS ENDPOINTS =====
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users ORDER BY id ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Erreur utilisateurs:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    console.log('👤 Création utilisateur:', req.body);
    
    const { tenant_id, username, email, first_name, last_name, password, role, assigned_store_id } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ error: 'Données manquantes (username, password, role requis)' });
    }

    let finalTenantId = tenant_id;

    // Si c'est un propriétaire (owner), créer un nouveau tenant
    if (role.toLowerCase() === 'owner') {
      const tenantName = `${first_name} ${last_name} - Business`;
      const tenantResult = await pool.query(
        'INSERT INTO tenants (name, is_active) VALUES ($1, $2) RETURNING id',
        [tenantName, true]
      );
      finalTenantId = tenantResult.rows[0].id;
      console.log('✅ Nouveau tenant créé:', finalTenantId);
    }

    // Hasher le mot de passe
    const password_hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (tenant_id, username, email, first_name, last_name, password_hash, role, assigned_store_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [finalTenantId, username, email, first_name, last_name, password_hash, role, assigned_store_id]
    );

    console.log('✅ Utilisateur créé:', result.rows[0].id);

    // Si c'est un propriétaire, créer automatiquement une licence d'essai de 14 jours BUSINESS PRO
    if (role.toLowerCase() === 'owner') {
      try {
        // Générer une clé de licence unique
        const trialKey = `TRIAL-${Date.now()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
        
        // Date d'expiration : 14 jours à partir de maintenant
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 14);
        
        // Créer la licence d'essai
        const licenseResult = await pool.query(
          'INSERT INTO licenses (key, tenant_id, assigned_to, expiry_date, is_active, plan) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
          [trialKey, finalTenantId, `${first_name} ${last_name}`, expiryDate, true, 'BUSINESS_PRO']
        );
        
        console.log('✅ Licence d\'essai créée automatiquement:', licenseResult.rows[0].key);
        
        // Retourner l'utilisateur avec les infos de la licence d'essai
        res.status(201).json({
          ...result.rows[0],
          trial_license: {
            key: trialKey,
            expiry_date: expiryDate,
            plan: 'BUSINESS_PRO',
            is_trial: true
          }
        });
      } catch (licenseError) {
        console.error('❌ Erreur création licence d\'essai:', licenseError);
        // Continuer même si la création de la licence échoue
        res.status(201).json(result.rows[0]);
      }
    } else {
      res.status(201).json(result.rows[0]);
    }
  } catch (error) {
    console.error('❌ Erreur création utilisateur:', error);
    
    // Gérer les erreurs de contrainte unique
    if (error.code === '23505') {
      if (error.constraint === 'users_username_key') {
        return res.status(409).json({ error: 'username_exists' });
      }
      if (error.constraint === 'users_email_key') {
        return res.status(409).json({ error: 'email_exists' });
      }
    }
    
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// DELETE user endpoint
app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ Suppression utilisateur:', id);

    // Vérifier si l'utilisateur existe
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const user = userResult.rows[0];
    
    // Supprimer l'utilisateur
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    
    console.log('✅ Utilisateur supprimé:', user.username);
    res.json({ success: true, message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    console.error('❌ Erreur suppression utilisateur:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// UPDATE user endpoint
app.patch('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { email, first_name, last_name, role, assigned_store_id, permissions } = req.body;
    
    console.log('✏️ Mise à jour utilisateur:', id);

    // Vérifier si l'utilisateur existe
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Mettre à jour l'utilisateur
    const result = await pool.query(
      `UPDATE users 
       SET email = COALESCE($1, email),
           first_name = COALESCE($2, first_name),
           last_name = COALESCE($3, last_name),
           role = COALESCE($4, role),
           assigned_store_id = $5
       WHERE id = $6
       RETURNING *`,
      [email, first_name, last_name, role, assigned_store_id, id]
    );

    console.log('✅ Utilisateur mis à jour:', result.rows[0].username);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Erreur mise à jour utilisateur:', error);
    
    // Gérer les erreurs de contrainte unique
    if (error.code === '23505') {
      if (error.constraint === 'users_email_key') {
        return res.status(409).json({ error: 'email_exists' });
      }
    }
    
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// Change password endpoint
app.patch('/api/users/:id/password', async (req, res) => {
  try {
    const { id } = req.params;
    const { old_password, new_password } = req.body;
    
    console.log('🔐 Changement de mot de passe pour utilisateur:', id);

    if (!old_password || !new_password) {
      return res.status(400).json({ error: 'Ancien et nouveau mot de passe requis' });
    }

    // Récupérer l'utilisateur
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'user_not_found' });
    }

    const user = userResult.rows[0];

    // Vérifier l'ancien mot de passe
    const isValidPassword = await bcrypt.compare(old_password, user.password_hash);
    
    if (!isValidPassword) {
      console.log('❌ Ancien mot de passe incorrect');
      return res.status(401).json({ error: 'incorrect_password' });
    }

    // Hasher le nouveau mot de passe
    const new_password_hash = await bcrypt.hash(new_password, 10);

    // Mettre à jour le mot de passe
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [new_password_hash, id]
    );

    console.log('✅ Mot de passe changé avec succès');
    res.json({ success: true, message: 'Mot de passe changé avec succès' });
  } catch (error) {
    console.error('❌ Erreur changement mot de passe:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// Reset password endpoint (for admins to reset other users' passwords)
app.post('/api/users/:id/reset-password', async (req, res) => {
  try {
    const { id } = req.params;
    const { new_password, admin_user_id } = req.body;
    
    console.log('🔄 Réinitialisation de mot de passe pour utilisateur:', id, 'par admin:', admin_user_id);

    if (!new_password) {
      return res.status(400).json({ error: 'Nouveau mot de passe requis' });
    }

    if (!admin_user_id) {
      return res.status(400).json({ error: 'ID de l\'administrateur requis' });
    }

    // Récupérer l'utilisateur cible
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'user_not_found' });
    }

    const targetUser = userResult.rows[0];

    // Récupérer l'administrateur qui fait la réinitialisation
    const adminResult = await pool.query('SELECT * FROM users WHERE id = $1', [admin_user_id]);
    
    if (adminResult.rows.length === 0) {
      return res.status(404).json({ error: 'admin_not_found' });
    }

    const adminUser = adminResult.rows[0];

    // Vérifier les permissions
    // SuperAdmin peut réinitialiser n'importe quel mot de passe
    // Owner/Admin peuvent réinitialiser les mots de passe de leur tenant (sauf autres owners/admins)
    if (adminUser.role === 'superadmin') {
      // SuperAdmin peut tout faire
      console.log('✅ SuperAdmin autorisé');
    } else if (adminUser.role === 'owner' || adminUser.role === 'admin') {
      // Vérifier que l'utilisateur cible est du même tenant
      if (adminUser.tenant_id !== targetUser.tenant_id) {
        console.log('❌ Tentative de réinitialisation cross-tenant');
        return res.status(403).json({ error: 'unauthorized' });
      }
      // Ne pas permettre de réinitialiser le mot de passe d'un owner ou admin (sauf soi-même)
      if ((targetUser.role === 'owner' || targetUser.role === 'admin') && targetUser.id !== adminUser.id) {
        console.log('❌ Tentative de réinitialisation d\'un owner/admin');
        return res.status(403).json({ error: 'cannot_reset_admin_password' });
      }
      console.log('✅ Owner/Admin autorisé');
    } else {
      console.log('❌ Permissions insuffisantes');
      return res.status(403).json({ error: 'insufficient_permissions' });
    }

    // Hasher le nouveau mot de passe
    const new_password_hash = await bcrypt.hash(new_password, 10);

    // Mettre à jour le mot de passe
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [new_password_hash, id]
    );

    console.log('✅ Mot de passe réinitialisé avec succès pour:', targetUser.username);
    res.json({ success: true, message: 'Mot de passe réinitialisé avec succès' });
  } catch (error) {
    console.error('❌ Erreur réinitialisation mot de passe:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// PATCH endpoint simplifié pour SuperAdmin (sans vérification de permissions)
app.patch('/api/users/:id/reset-password', async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    
    console.log('🔄 [SuperAdmin] Réinitialisation mot de passe utilisateur:', id);

    if (!newPassword) {
      return res.status(400).json({ error: 'Nouveau mot de passe requis' });
    }

    // Vérifier que l'utilisateur existe
    const userResult = await pool.query('SELECT username FROM users WHERE id = $1', [id]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Hasher le nouveau mot de passe
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Mettre à jour le mot de passe
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [passwordHash, id]
    );

    console.log('✅ Mot de passe réinitialisé pour:', userResult.rows[0].username);
    res.json({ success: true, message: 'Mot de passe réinitialisé avec succès' });
  } catch (error) {
    console.error('❌ Erreur réinitialisation mot de passe:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// ===== STORES ENDPOINTS =====
app.get('/api/stores', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM stores ORDER BY id ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Erreur magasins:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/stores', async (req, res) => {
  try {
    console.log('🏪 Création magasin:', req.body);
    const { tenant_id, name, location, phone } = req.body;

    if (!name || !tenant_id) {
      return res.status(400).json({ error: 'Nom et tenant_id requis' });
    }

    const result = await pool.query(
      'INSERT INTO stores (tenant_id, name, location, phone) VALUES ($1, $2, $3, $4) RETURNING *',
      [tenant_id, name, location, phone]
    );

    console.log('✅ Magasin créé:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('❌ Erreur création magasin:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

app.put('/api/stores/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location, phone } = req.body;

    console.log(`✏️ Mise à jour magasin ${id}:`, req.body);

    const result = await pool.query(
      'UPDATE stores SET name = $1, location = $2, phone = $3 WHERE id = $4 RETURNING *',
      [name, location, phone, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Magasin non trouvé' });
    }

    console.log('✅ Magasin mis à jour:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Erreur mise à jour magasin:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

app.delete('/api/stores/:id', async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`🗑️ Suppression magasin ${id}`);

    const result = await pool.query('DELETE FROM stores WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Magasin non trouvé' });
    }

    console.log('✅ Magasin supprimé:', id);
    res.json({ message: 'Magasin supprimé', store: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur suppression magasin:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// ===== SUPPLIERS ENDPOINTS =====
app.get('/api/suppliers', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM suppliers ORDER BY name ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Erreur fournisseurs:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/suppliers', async (req, res) => {
  try {
    console.log('🏭 Création fournisseur:', req.body);
    const { tenant_id, name, contact_person, email, phone, address } = req.body;

    if (!name || !tenant_id) {
      return res.status(400).json({ error: 'Nom et tenant_id requis' });
    }

    const result = await pool.query(
      'INSERT INTO suppliers (tenant_id, name, contact_person, email, phone, address) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [tenant_id, name, contact_person, email, phone, address]
    );

    console.log('✅ Fournisseur créé:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('❌ Erreur création fournisseur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.put('/api/suppliers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, contact_person, email, phone, address } = req.body;

    const result = await pool.query(
      'UPDATE suppliers SET name = $1, contact_person = $2, email = $3, phone = $4, address = $5 WHERE id = $6 RETURNING *',
      [name, contact_person, email, phone, address, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fournisseur non trouvé' });
    }

    console.log('✅ Fournisseur mis à jour:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Erreur mise à jour fournisseur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.delete('/api/suppliers/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM suppliers WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fournisseur non trouvé' });
    }

    console.log('✅ Fournisseur supprimé:', id);
    res.json({ message: 'Fournisseur supprimé' });
  } catch (error) {
    console.error('❌ Erreur suppression fournisseur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ===== PROMO CODES ENDPOINTS =====
app.get('/api/promo-codes', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM promo_codes ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Erreur codes promo:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/promo-codes', async (req, res) => {
  try {
    console.log('🎟️ Création code promo:', req.body);
    const { tenant_id, code, type, value, expires_at } = req.body;

    if (!code || !tenant_id || !type || value === undefined) {
      return res.status(400).json({ error: 'Code, tenant_id, type et value requis' });
    }

    // Vérifier si le code existe déjà
    const existing = await pool.query(
      'SELECT id FROM promo_codes WHERE code = $1 AND tenant_id = $2',
      [code, tenant_id]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Code promo existe déjà' });
    }

    const result = await pool.query(
      'INSERT INTO promo_codes (tenant_id, code, type, value, expires_at, is_active) VALUES ($1, $2, $3, $4, $5, true) RETURNING *',
      [tenant_id, code, type, value, expires_at || null]
    );

    console.log('✅ Code promo créé:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('❌ Erreur création code promo:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.put('/api/promo-codes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { code, type, value, is_active, expires_at } = req.body;

    const result = await pool.query(
      'UPDATE promo_codes SET code = $1, type = $2, value = $3, is_active = $4, expires_at = $5 WHERE id = $6 RETURNING *',
      [code, type, value, is_active, expires_at || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Code promo non trouvé' });
    }

    console.log('✅ Code promo mis à jour:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Erreur mise à jour code promo:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.delete('/api/promo-codes/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM promo_codes WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Code promo non trouvé' });
    }

    console.log('✅ Code promo supprimé:', id);
    res.json({ message: 'Code promo supprimé' });
  } catch (error) {
    console.error('❌ Erreur suppression code promo:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ===== PURCHASE ORDERS ENDPOINTS =====
app.get('/api/purchase-orders', async (req, res) => {
  try {
    const ordersResult = await pool.query('SELECT * FROM purchase_orders ORDER BY created_at DESC');
    const itemsResult = await pool.query('SELECT * FROM purchase_order_items');

    const orders = ordersResult.rows.map(order => ({
      ...order,
      items: itemsResult.rows.filter(item => item.purchase_order_id === order.id)
    }));

    res.json(orders);
  } catch (error) {
    console.error('❌ Erreur bons de commande:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/purchase-orders', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    console.log('📦 Création bon de commande:', req.body);
    const { tenant_id, supplier_id, store_id, reference, total_amount, items } = req.body;

    if (!tenant_id || !supplier_id || !store_id || !items || items.length === 0) {
      return res.status(400).json({ error: 'Données manquantes' });
    }

    // Créer le bon de commande
    const orderResult = await client.query(
      'INSERT INTO purchase_orders (tenant_id, supplier_id, store_id, reference, status, total_amount) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [tenant_id, supplier_id, store_id, reference || null, 'ordered', total_amount]
    );

    const order = orderResult.rows[0];

    // Créer les items
    for (const item of items) {
      await client.query(
        'INSERT INTO purchase_order_items (purchase_order_id, product_id, variant_id, quantity, cost_price, total_price) VALUES ($1, $2, $3, $4, $5, $6)',
        [order.id, item.product_id, item.variant_id, item.quantity, item.cost_price, item.quantity * item.cost_price]
      );
    }

    await client.query('COMMIT');
    console.log('✅ Bon de commande créé:', order.id);
    res.status(201).json(order);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur création bon de commande:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    client.release();
  }
});

app.put('/api/purchase-orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, received_at } = req.body;

    const result = await pool.query(
      'UPDATE purchase_orders SET status = $1, received_at = $2 WHERE id = $3 RETURNING *',
      [status, received_at || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bon de commande non trouvé' });
    }

    console.log('✅ Bon de commande mis à jour:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Erreur mise à jour bon de commande:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ===== INVENTORY ENDPOINTS =====
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
      
      console.log('✅ Inventaire mis à jour');
      res.json(updateResult.rows[0]);
    } else {
      // Créer une nouvelle entrée inventaire
      const insertResult = await pool.query(
        'INSERT INTO inventory (variant_id, store_id, quantity) VALUES ($1, $2, $3) RETURNING *',
        [variantId, storeId, Math.max(0, change)]
      );
      
      console.log('✅ Nouvelle entrée inventaire créée');
      res.json(insertResult.rows[0]);
    }
  } catch (error) {
    console.error('❌ Erreur inventaire:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// ===== APP SETTINGS (PERSONNALISATION) =====

// GET - Récupérer tous les paramètres ou par catégorie
app.get('/api/app-settings', async (req, res) => {
  try {
    console.log('📋 GET /api/app-settings appelé');
    const { category } = req.query;
    
    let query = 'SELECT * FROM app_settings';
    const params: any[] = [];
    
    if (category) {
      query += ' WHERE category = $1';
      params.push(category);
    }
    
    query += ' ORDER BY category, key';
    
    console.log('🔍 Exécution query:', query);
    const result = await pool.query(query, params);
    console.log(`✅ ${result.rows.length} paramètres récupérés`);
    
    // Transformer en objet clé-valeur
    const settings: Record<string, any> = {};
    result.rows.forEach((row: any) => {
      // Parser JSON si nécessaire
      try {
        settings[row.key] = JSON.parse(row.value);
      } catch {
        settings[row.key] = row.value;
      }
    });
    
    res.json(settings);
  } catch (error: any) {
    console.error('❌ Error fetching app_settings:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// PUT - Mettre à jour un paramètre (SuperAdmin uniquement)
app.put('/api/app-settings/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    
    console.log(`🔧 Mise à jour paramètre: ${key} =`, typeof value === 'string' ? value.substring(0, 50) + '...' : value);
    
    // Convertir en string si c'est un objet/array
    const valueStr = typeof value === 'object' ? JSON.stringify(value) : value;
    
    // Utiliser UPSERT (INSERT ... ON CONFLICT DO UPDATE)
    const result = await pool.query(
      `INSERT INTO app_settings (key, value, category, description) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (key) DO UPDATE SET 
         value = $2, 
         updated_at = NOW()
       RETURNING *`,
      [key, valueStr, 'branding', `Paramètre ${key}`]
    );
    
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error updating setting:', error);
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

// POST - Créer un nouveau paramètre (SuperAdmin uniquement)
app.post('/api/app-settings', async (req, res) => {
  try {
    const { key, value, category, description } = req.body;
    
    const valueStr = typeof value === 'object' ? JSON.stringify(value) : value;
    
    const result = await pool.query(
      `INSERT INTO app_settings (key, value, category, description) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [key, valueStr, category, description]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Error creating setting:', error);
    res.status(500).json({ error: 'Failed to create setting' });
  }
});

// POST - Upload de fichier logo/favicon SaaS (SuperAdmin uniquement)
app.post('/api/app-settings/upload-logo-file', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier uploadé' });
    }

    const { type } = req.body; // 'logo' ou 'favicon'
    
    // Construire l'URL du fichier
    const fileUrl = `/uploads/logos/${req.file.filename}`;
    const settingKey = type === 'logo' ? 'saas_logo_url' : 'saas_favicon_url';
    
    console.log(`🖼️ Upload fichier ${type}: ${fileUrl}`);
    
    // Supprimer l'ancien fichier s'il existe
    try {
      const oldFile = await pool.query(
        'SELECT value FROM app_settings WHERE key = $1',
        [settingKey]
      );
      
      if (oldFile.rows.length > 0 && oldFile.rows[0].value.startsWith('/uploads/')) {
        const oldPath = path.join(__dirname, oldFile.rows[0].value);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
          console.log(`🗑️ Ancien fichier supprimé: ${oldPath}`);
        }
      }
    } catch (err) {
      console.warn('Impossible de supprimer l\'ancien fichier:', err);
    }
    
    // Sauvegarder l'URL dans la base de données
    await pool.query(
      `INSERT INTO app_settings (key, value, category, description) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
      [settingKey, fileUrl, 'branding', `${type === 'logo' ? 'Logo' : 'Favicon'} SaaS`]
    );
    
    res.json({ 
      success: true, 
      url: fileUrl,
      message: `${type === 'logo' ? 'Logo' : 'Favicon'} uploadé avec succès`
    });
    
  } catch (error: any) {
    console.error('Error uploading logo file:', error);
    // Supprimer le fichier uploadé en cas d'erreur
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Failed to upload logo file' });
  }
});

// POST - Upload de logo/favicon SaaS (SuperAdmin uniquement)
app.post('/api/app-settings/upload-logo', async (req, res) => {
  try {
    const { type, formats } = req.body; // type: 'logo' | 'favicon', formats: object with different sizes
    
    console.log(`🖼️ Upload ${type} SaaS:`, Object.keys(formats));
    
    // Sauvegarder tous les formats
    const promises = Object.entries(formats).map(([formatKey, formatValue]) => {
      const settingKey = `saas_${type}_${formatKey}`;
      return pool.query(
        `INSERT INTO app_settings (key, value, category, description) 
         VALUES ($1, $2, $3, $4) 
         ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP`,
        [
          settingKey, 
          formatValue, 
          'branding', 
          `${type === 'logo' ? 'Logo' : 'Favicon'} SaaS - Format ${formatKey}`
        ]
      );
    });
    
    await Promise.all(promises);
    
    res.json({ 
      success: true, 
      message: `${type === 'logo' ? 'Logo' : 'Favicon'} SaaS mis à jour avec succès`,
      formats: Object.keys(formats)
    });
    
  } catch (error: any) {
    console.error('Error uploading logo:', error);
    res.status(500).json({ error: 'Failed to upload logo' });
  }
});

// ===== INVOICES ENDPOINTS =====
// Routes pour le système de facturation FNE (AVANT LA ROUTE GÉNÉRIQUE)
app.use('/api/invoices', createInvoicesRouter(pool));

// ===== ROUTES GÉNÉRIQUES (APRÈS LES ROUTES SPÉCIFIQUES) =====
app.get('/api/:table', async (req, res) => {
  try {
    const { table } = req.params;
    console.log(`📋 Route générique: ${table}`);
    const result = await pool.query(`SELECT * FROM ${table} ORDER BY id ASC`);
    res.json(result.rows);
  } catch (error) {
    console.error(`❌ Erreur table ${req.params.table}:`, error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/sales - Créer une nouvelle vente (MUST BE BEFORE GENERIC ROUTE)
app.post('/api/sales', async (req, res) => {
  const client = await pool.connect();
  
  try {
    console.log('💰 Création vente:', req.body);
    
    const {
      tenant_id,
      store_id,
      user_id,
      customer_id,
      subtotal,
      discount,
      loyalty_discount,
      tax,
      total,
      promo_code,
      loyalty_points_earned,
      loyalty_points_used,
      payment_method,
      is_credit,
      total_paid,
      item_status,
      items
    } = req.body;

    // Démarrer une transaction
    await client.query('BEGIN');

    // Créer la vente
    const saleResult = await client.query(
      `INSERT INTO sales (
        tenant_id, store_id, user_id, customer_id,
        subtotal, discount, loyalty_discount, tax, total,
        promo_code, loyalty_points_earned, loyalty_points_used,
        payment_method, is_credit, total_paid, item_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        tenant_id, store_id, user_id, customer_id,
        subtotal, discount, loyalty_discount, tax, total,
        promo_code, loyalty_points_earned, loyalty_points_used,
        payment_method, is_credit, total_paid, item_status
      ]
    );

    const sale = saleResult.rows[0];
    console.log('✅ Vente créée:', sale.id);

    // Créer les items de la vente
    const createdItems = [];
    for (const item of items) {
      console.log('📦 Item à insérer:', {
        product_id: item.product_id,
        variant_id: item.variant_id,
        quantity: item.quantity,
        quantity_type: typeof item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price
      });
      
      const itemResult = await client.query(
        `INSERT INTO sale_items (
          sale_id, product_id, variant_id, quantity, unit_price, total_price
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *`,
        [
          sale.id,
          item.product_id,
          item.variant_id,
          item.quantity,
          item.unit_price,
          item.total_price
        ]
      );
      createdItems.push(itemResult.rows[0]);
    }

    console.log(`✅ ${createdItems.length} items créés`);

    // Commit la transaction
    await client.query('COMMIT');

    res.status(201).json({ ...sale, items: createdItems });
  } catch (error) {
    // Rollback en cas d'erreur
    await client.query('ROLLBACK');
    console.error('❌ Erreur création vente:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  } finally {
    client.release();
  }
});

/*// Generic POST route for other tables
app.post('/api/:table', async (req, res) => {
  try {
    const { table } = req.params;
    console.log(`📝 Création dans ${table}:`, req.body);
    
    const columns = Object.keys(req.body);
    const values = Object.values(req.body);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    
    const result = await pool.query(
      `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders}) RETURNING *`,
      values
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(`❌ Erreur création ${req.params.table}:`, error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});*/

// ===== SETTINGS ENDPOINTS =====
// GET /api/settings - Récupérer les paramètres
app.get('/api/settings/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    
    const result = await pool.query(
      `SELECT 
        store_name,
        logo_url,
        tax_rate,
        loyalty_program_enabled,
        loyalty_points_per_dollar,
        loyalty_point_value,
        printing_settings
      FROM settings 
      WHERE tenant_id = $1`,
      [tenantId]
    );
    
    if (result.rows.length === 0) {
      // Créer des paramètres par défaut si ils n'existent pas
      const defaultSettings = {
        store_name: 'Smart POS',
        tax_rate: 0.18,
        loyalty_program_enabled: true,
        loyalty_points_per_dollar: 0.01,
        loyalty_point_value: 1,
        printing_settings: {
          autoPrint: true,
          paperWidth: '80mm',
          showBarcodes: true,
          promotionalMessages: [
            'Merci pour votre visite ! Revenez nous voir bientôt.',
            'Suivez-nous sur les réseaux sociaux pour nos offres spéciales.',
            'Recommandez-nous à vos amis et obtenez 10% de réduction.',
            'Prochaine visite : -5% avec ce ticket (valable 30 jours).',
            'Votre satisfaction est notre priorité. Merci de votre confiance.'
          ],
          printStatistics: {
            enabled: true,
            totalReceipts: 0,
            paperSaved: 0
          }
        }
      };
      
      const insertResult = await pool.query(
        `INSERT INTO settings (
          tenant_id, store_name, tax_rate, loyalty_program_enabled, 
          loyalty_points_per_dollar, loyalty_point_value, printing_settings
        ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [
          tenantId,
          defaultSettings.store_name,
          defaultSettings.tax_rate,
          defaultSettings.loyalty_program_enabled,
          defaultSettings.loyalty_points_per_dollar,
          defaultSettings.loyalty_point_value,
          JSON.stringify(defaultSettings.printing_settings)
        ]
      );
      
      res.json(insertResult.rows[0]);
    } else {
      res.json(result.rows[0]);
    }
  } catch (error) {
    console.error('❌ Erreur récupération paramètres:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/settings - Mettre à jour les paramètres
app.put('/api/settings/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const {
      storeName,
      taxRate,
      loyaltyProgram,
      printing
    } = req.body;
    
    const result = await pool.query(
      `UPDATE settings SET 
        store_name = $2,
        tax_rate = $3,
        loyalty_program_enabled = $4,
        loyalty_points_per_dollar = $5,
        loyalty_point_value = $6,
        printing_settings = $7,
        updated_at = CURRENT_TIMESTAMP
      WHERE tenant_id = $1
      RETURNING *`,
      [
        tenantId,
        storeName,
        taxRate / 100, // Convertir le pourcentage en décimal
        loyaltyProgram?.enabled || false,
        loyaltyProgram?.pointsPerDollar || 0.01,
        loyaltyProgram?.pointValue || 1,
        JSON.stringify(printing)
      ]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Paramètres non trouvés' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Erreur mise à jour paramètres:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ===== TENANTS ENDPOINTS =====
// PATCH /api/tenants/:id - Mettre à jour les informations du tenant
app.patch('/api/tenants/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { ncc, address } = req.body;

    console.log(`🏢 Mise à jour tenant ${id}:`, { ncc, address });

    // Vérifier que le tenant existe
    const tenantCheck = await pool.query(
      'SELECT id FROM tenants WHERE id = $1',
      [id]
    );

    if (tenantCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Tenant non trouvé' });
    }

    // Mettre à jour les informations
    const result = await pool.query(
      `UPDATE tenants 
       SET ncc = $1, address = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [ncc || null, address || null, id]
    );

    console.log('✅ Tenant mis à jour:', result.rows[0]);
    res.json({ success: true, tenant: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur mise à jour tenant:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ===== SALES ENDPOINTS =====
// GET /api/sales - Récupérer toutes les ventes
app.get('/api/sales', async (req, res) => {
  try {
    console.log('💰 Récupération des ventes...');
    
    const result = await pool.query(`
      SELECT 
        s.*,
        json_agg(
          json_build_object(
            'id', CONCAT(si.product_id, '-', si.variant_id),
            'productId', si.product_id,
            'productName', p.name,
            'imageUrl', p.image_url,
            'variantName', COALESCE(
              (SELECT STRING_AGG(CONCAT(key, ': ', value), ', ')
               FROM json_each_text(pv.selected_options)),
              'Standard'
            ),
            'variant', json_build_object(
              'id', pv.id,
              'selectedOptions', pv.selected_options,
              'price', pv.price,
              'costPrice', pv.cost_price,
              'sku', pv.sku,
              'barcode', pv.barcode
            ),
            'quantity', si.quantity,
            'returnedQuantity', COALESCE(si.returned_quantity, 0)
          ) ORDER BY si.id
        ) as items,
        json_build_object(
          'id', u.id,
          'username', u.username,
          'role', u.role
        ) as user
      FROM sales s
      LEFT JOIN sale_items si ON s.id = si.sale_id
      LEFT JOIN products p ON si.product_id = p.id
      LEFT JOIN product_variants pv ON si.variant_id = pv.id
      LEFT JOIN users u ON s.user_id = u.id
      GROUP BY s.id, u.id, u.username, u.role
      ORDER BY s.created_at DESC
    `);
    
    console.log(`✅ ${result.rows.length} ventes récupérées`);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Erreur récupération ventes:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// PATCH /api/sales/:id - Mettre à jour une vente (pour les retours)
app.patch('/api/sales/:id', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const { returned_items, return_details } = req.body;
    
    console.log('🔄 Mise à jour vente (retour):', id);
    console.log('📦 Items à retourner:', returned_items);
    console.log('📝 Détails retour:', return_details);

    await client.query('BEGIN');

    // Mettre à jour les quantités retournées pour chaque item
    for (const item of returned_items) {
      // Extraire variant_id du cartItemId (format: "productId-variantId")
      const variantId = parseInt(item.id.split('-')[1]);
      
      const result = await client.query(
        `UPDATE sale_items 
         SET returned_quantity = returned_quantity + $1 
         WHERE sale_id = $2 AND variant_id = $3
         RETURNING *`,
        [item.returned_quantity, id, variantId]
      );
      
      if (result.rowCount === 0) {
        console.warn(`⚠️ Aucun item trouvé pour sale_id=${id}, variant_id=${variantId}`);
      } else {
        console.log(`✅ Item mis à jour: variant_id=${variantId}, returned_quantity=${item.returned_quantity}`);
      }
    }

    // Recalculer les totaux de la vente après retour
    const itemsResult = await client.query(
      `SELECT 
        quantity, 
        returned_quantity, 
        unit_price 
       FROM sale_items 
       WHERE sale_id = $1`,
      [id]
    );

    // Calculer le nouveau subtotal (seulement les items non retournés)
    let newSubtotal = 0;
    for (const item of itemsResult.rows) {
      const activeQuantity = item.quantity - (item.returned_quantity || 0);
      newSubtotal += activeQuantity * parseFloat(item.unit_price);
    }

    // Récupérer les infos de la vente originale pour calculer les proportions
    const saleResult = await client.query(
      'SELECT subtotal, discount, loyalty_discount, tax, total, tenant_id FROM sales WHERE id = $1',
      [id]
    );

    if (saleResult.rows.length === 0) {
      throw new Error('Vente non trouvée');
    }

    const originalSale = saleResult.rows[0];
    const originalSubtotal = parseFloat(originalSale.subtotal);
    const tenantId = originalSale.tenant_id;

    // Calculer les nouveaux montants proportionnellement
    const ratio = originalSubtotal > 0 ? newSubtotal / originalSubtotal : 0;
    const newDiscount = parseFloat(originalSale.discount) * ratio;
    const newLoyaltyDiscount = parseFloat(originalSale.loyalty_discount) * ratio;
    const newTax = parseFloat(originalSale.tax) * ratio;
    const newTotal = newSubtotal - newDiscount - newLoyaltyDiscount + newTax;

    // Mettre à jour les totaux de la vente
    await client.query(
      `UPDATE sales 
       SET subtotal = $1, 
           discount = $2, 
           loyalty_discount = $3, 
           tax = $4, 
           total = $5
       WHERE id = $6`,
      [
        newSubtotal.toFixed(2),
        newDiscount.toFixed(2),
        newLoyaltyDiscount.toFixed(2),
        newTax.toFixed(2),
        newTotal.toFixed(2),
        id
      ]
    );

    console.log(`✅ Totaux recalculés: subtotal=${newSubtotal.toFixed(2)}, total=${newTotal.toFixed(2)}`);

    // Enregistrer la transaction de retour si les détails sont fournis
    if (return_details) {
      await client.query(
        `INSERT INTO return_transactions (
          sale_id, tenant_id, processed_by, approved_by, 
          return_reason, notes, refund_method, 
          total_refund_amount, items
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
          id,
          tenantId,
          return_details.processedBy,
          return_details.approvedBy || null,
          return_details.reason,
          return_details.notes || null,
          return_details.refundMethod,
          return_details.totalRefundAmount,
          JSON.stringify(return_details.items)
        ]
      );
      
      console.log('✅ Transaction de retour enregistrée');
    }

    await client.query('COMMIT');
    console.log('✅ Vente mise à jour avec nouveaux totaux');
    res.json({ 
      success: true, 
      message: 'Retour enregistré',
      updatedTotals: {
        subtotal: newSubtotal.toFixed(2),
        discount: newDiscount.toFixed(2),
        loyaltyDiscount: newLoyaltyDiscount.toFixed(2),
        tax: newTax.toFixed(2),
        total: newTotal.toFixed(2)
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur mise à jour vente:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  } finally {
    client.release();
  }
});

// GET /api/sales/:id/returns - Récupérer les retours d'une vente
app.get('/api/sales/:id/returns', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT 
        rt.*,
        u1.username as processed_by_name,
        u2.username as approved_by_name
       FROM return_transactions rt
       LEFT JOIN users u1 ON rt.processed_by = u1.id
       LEFT JOIN users u2 ON rt.approved_by = u2.id
       WHERE rt.sale_id = $1
       ORDER BY rt.created_at DESC`,
      [id]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Erreur récupération retours:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// DELETE /api/sales - Supprimer l'historique des ventes (clear history)
app.delete('/api/sales', async (req, res) => {
  try {
    console.log('🗑️ Suppression de l\'historique des ventes');

    // Supprimer d'abord les items (cascade devrait le faire mais soyons explicites)
    await pool.query('DELETE FROM sale_items');
    
    // Supprimer les ventes
    const result = await pool.query('DELETE FROM sales RETURNING id');
    
    console.log(`✅ ${result.rowCount} ventes supprimées`);
    res.json({ success: true, message: `${result.rowCount} ventes supprimées` });
  } catch (error) {
    console.error('❌ Erreur suppression historique:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// Démarrage du serveur
app.listen(port, () => {
  console.log(`Backend POS running on http://localhost:${port}`);
});