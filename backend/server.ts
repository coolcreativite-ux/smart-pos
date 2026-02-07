import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

// Charger les variables d'environnement selon l'environnement
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: envFile });

console.log(`🔧 Environnement: ${process.env.NODE_ENV || 'development'}`);
console.log(`📁 Fichier .env chargé: ${envFile}`);

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

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
      const error = await response.json();
      console.error('❌ Erreur Resend:', error);
      return res.status(500).json({ error: 'Failed to send email', details: error });
    }

    const data = await response.json();
    console.log('✅ Email envoyé via Resend:', data.id);
    
    res.json({ success: true, emailId: data.id });
  } catch (error) {
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
      return res.status(400).json({ error: 'Données manquantes' });
    }

    const result = await pool.query(
      'INSERT INTO "action_logs" (tenant_id, user_id, action, details) VALUES ($1, $2, $3, $4) RETURNING *',
      [tenant_id, user_id, action, details]
    );

    console.log('✅ Action log créé');
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('❌ Erreur création log:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// ===== PRODUCTS ENDPOINTS =====
app.get('/api/products', async (req, res) => {
  try {
    console.log('🛍️ Récupération produits...');
    
    const result = await pool.query(`
      SELECT 
        p.*,
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
      LEFT JOIN product_variants pv ON p.id = pv.product_id
      GROUP BY p.id
      ORDER BY p.name
    `);

    console.log(`✅ ${result.rows.length} produits récupérés`);
    res.json(result.rows);
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
    const result = await pool.query('SELECT * FROM categories ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Erreur catégories:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    console.log('📦 Création produit:', req.body);
    
    const { name, category, description, imageUrl, attributes, variants, tenantId, low_stock_threshold, enable_email_alert } = req.body;

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

    // Créer les variantes
    const createdVariants = [];
    if (variants && variants.length > 0) {
      for (const variant of variants) {
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
        createdVariants.push(variantResult.rows[0]);
      }
    }

    console.log(`✅ ${createdVariants.length} variantes créées`);
    res.status(201).json({ ...product, variants: createdVariants });
  } catch (error) {
    console.error('❌ Erreur création produit:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// ===== AUTH ENDPOINTS =====
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Vérifier que les données sont présentes
    if (!username || !password) {
      return res.status(400).json({ error: 'Nom d\'utilisateur et mot de passe requis' });
    }

    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Utilisateur non trouvé' });
    }

    const user = result.rows[0];
    
    // Vérifier que le mot de passe hashé existe
    if (!user.password_hash) {
      console.error('❌ Mot de passe manquant pour l\'utilisateur:', username);
      return res.status(401).json({ error: 'Erreur de configuration utilisateur' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
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
    res.status(201).json(result.rows[0]);
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
});

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

// Démarrage du serveur
app.listen(port, () => {
  console.log(`Backend POS running on http://localhost:${port}`);
});