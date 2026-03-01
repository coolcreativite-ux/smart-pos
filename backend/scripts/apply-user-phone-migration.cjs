// Script pour appliquer la migration user phone
// Date: 2026-03-01

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Charger le bon fichier .env selon l'environnement
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
require('dotenv').config({ path: envFile });

console.log(`🔧 Environnement: ${process.env.NODE_ENV || 'development'}`);
console.log(`📁 Fichier .env: ${envFile}`);

async function applyMigration() {
  console.log('🔧 Application de la migration user phone...');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    // Vérifier si la colonne phone existe déjà
    console.log('🔍 Vérification de l\'existence de la colonne phone...');
    const checkResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'phone'
    `);

    if (checkResult.rows.length > 0) {
      console.log('⚠️  La colonne phone existe déjà dans la table users');
    } else {
      console.log('📝 La colonne phone n\'existe pas, application de la migration...');
      
      // Lire le fichier de migration
      const migrationPath = path.join(__dirname, '../../database/migrations/004_add_user_phone.sql');
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      
      // Appliquer la migration
      await pool.query(migrationSQL);
      console.log('✅ Migration appliquée avec succès!');
    }

    // Afficher la structure de la table users
    console.log('\n📋 Structure de la table users:');
    const structureResult = await pool.query(`
      SELECT column_name, data_type, character_maximum_length, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    console.table(structureResult.rows);

    console.log('\n🎉 Migration terminée!');
    console.log('\n📋 Prochaines étapes:');
    console.log('1. Redémarrer le serveur backend');
    console.log('2. Tester la mise à jour des informations personnelles dans l\'interface');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

applyMigration();
