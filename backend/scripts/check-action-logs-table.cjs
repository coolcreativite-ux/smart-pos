const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.development') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkAndCreateActionLogsTable() {
  try {
    console.log('🔍 Vérification de la table action_logs...\n');

    // Vérifier si la table existe
    const checkTable = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'action_logs'
      );
    `);

    const tableExists = checkTable.rows[0].exists;

    if (tableExists) {
      console.log('✅ La table action_logs existe déjà\n');
      
      // Afficher la structure
      const structure = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'action_logs'
        ORDER BY ordinal_position;
      `);
      
      console.log('📋 Structure de la table:');
      structure.rows.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
      });

      // Compter les enregistrements
      const count = await pool.query('SELECT COUNT(*) FROM action_logs');
      console.log(`\n📊 Nombre d'enregistrements: ${count.rows[0].count}`);
    } else {
      console.log('❌ La table action_logs n\'existe pas\n');
      console.log('🔧 Création de la table...\n');

      await pool.query(`
        CREATE TABLE action_logs (
          id SERIAL PRIMARY KEY,
          tenant_id INTEGER NOT NULL REFERENCES tenants(id),
          user_id INTEGER NOT NULL REFERENCES users(id),
          action VARCHAR(255) NOT NULL,
          details TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      console.log('✅ Table action_logs créée avec succès!\n');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (error.detail) console.error('   Détails:', error.detail);
  } finally {
    await pool.end();
  }
}

checkAndCreateActionLogsTable();
