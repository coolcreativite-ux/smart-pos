/**
 * Script pour exécuter la migration return_transactions
 * Usage: node backend/scripts/run-return-migration.cjs
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Charger les variables d'environnement
require('dotenv').config({ path: path.join(__dirname, '../.env.development') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Connexion à la base de données...');
    
    // Lire le fichier de migration
    const migrationPath = path.join(__dirname, '../../database/migrations/add_return_transactions.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Exécution de la migration add_return_transactions.sql...');
    
    // Exécuter la migration
    await client.query(migrationSQL);
    
    console.log('✅ Migration exécutée avec succès !');
    
    // Vérifier que la table existe
    const checkResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'return_transactions'
    `);
    
    if (checkResult.rows.length > 0) {
      console.log('✅ Table return_transactions créée et vérifiée');
      
      // Afficher la structure de la table
      const columnsResult = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'return_transactions'
        ORDER BY ordinal_position
      `);
      
      console.log('\n📊 Structure de la table:');
      columnsResult.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
      });
    } else {
      console.log('⚠️ La table n\'a pas été créée');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
