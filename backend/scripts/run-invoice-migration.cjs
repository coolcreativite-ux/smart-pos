/**
 * Script pour exécuter la migration du système de facturation
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.development') });

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Connexion à la base de données...');
    await pool.query('SELECT NOW()');
    console.log('✅ Connecté à PostgreSQL');

    // Lire le fichier de migration
    const migrationPath = path.join(__dirname, '../../database/migrations/001_add_invoice_system.sql');
    console.log(`📄 Lecture du fichier: ${migrationPath}`);
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('🚀 Exécution de la migration...');
    await pool.query(migrationSQL);
    
    console.log('✅ Migration exécutée avec succès!');
    
    // Vérifier que les tables ont été créées
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('invoices', 'invoice_items', 'invoice_sequences', 'invoice_taxes')
      ORDER BY table_name
    `);
    
    console.log('\n📊 Tables créées:');
    result.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });
    
    // Vérifier les colonnes ajoutées à customers
    const customerColumns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'customers' 
      AND column_name IN ('ncc', 'address')
      ORDER BY column_name
    `);
    
    console.log('\n📊 Colonnes ajoutées à customers:');
    customerColumns.rows.forEach(row => {
      console.log(`  ✓ ${row.column_name}`);
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error.message);
    console.error('Détails:', error);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('\n🔌 Connexion fermée');
  }
}

runMigration();
