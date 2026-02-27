const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.development') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

async function runMigration() {
  try {
    console.log('🚀 Exécution de la migration 002_add_tenant_invoice_fields.sql...\n');
    
    // Lire le fichier de migration
    const migrationPath = path.join(__dirname, '../../database/migrations/002_add_tenant_invoice_fields.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Exécuter la migration
    await pool.query(migrationSQL);
    
    console.log('✅ Migration exécutée avec succès!\n');
    
    // Vérifier que les colonnes ont été ajoutées
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'tenants' AND column_name IN ('ncc', 'address', 'updated_at')
      ORDER BY column_name
    `);
    
    console.log('📊 Colonnes ajoutées:');
    result.rows.forEach(row => {
      console.log(`  ✓ ${row.column_name}: ${row.data_type}`);
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
