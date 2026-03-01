// Script pour appliquer TOUTES les migrations en production
// Date: 2026-03-01

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: 'backend/.env.production' });

const migrations = [
  {
    file: 'database/migrations/003_add_tenant_contact_fields.sql',
    name: 'Add tenant contact fields (phone, email, rccm, logo_url)'
  },
  {
    file: 'database/migrations/004_add_user_phone.sql',
    name: 'Add user phone field'
  }
];

async function applyMigrations() {
  console.log('🔧 Application des migrations en PRODUCTION...');
  console.log('⚠️  ATTENTION: Vous êtes sur le point de modifier la base de données de PRODUCTION\n');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    for (const migration of migrations) {
      console.log(`\n📝 Migration: ${migration.name}`);
      console.log(`📄 Fichier: ${migration.file}`);
      
      const migrationPath = path.join(__dirname, migration.file);
      
      if (!fs.existsSync(migrationPath)) {
        console.log(`⚠️  Fichier non trouvé: ${migrationPath}`);
        continue;
      }
      
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      
      try {
        await pool.query(migrationSQL);
        console.log(`✅ Migration appliquée avec succès`);
      } catch (error) {
        if (error.message.includes('already exists') || error.message.includes('duplicate column')) {
          console.log(`⚠️  Migration déjà appliquée (colonne existe déjà)`);
        } else {
          throw error;
        }
      }
    }

    // Vérifier la structure finale
    console.log('\n📋 Vérification de la structure finale...');
    
    console.log('\n🏢 Colonnes de la table tenants:');
    const tenantsColumns = await pool.query(`
      SELECT column_name, data_type, character_maximum_length, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'tenants' 
      ORDER BY ordinal_position
    `);
    console.table(tenantsColumns.rows);

    console.log('\n👤 Colonnes de la table users:');
    const usersColumns = await pool.query(`
      SELECT column_name, data_type, character_maximum_length, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    console.table(usersColumns.rows);

    console.log('\n🎉 Toutes les migrations ont été appliquées avec succès!');
    console.log('\n📋 Prochaines étapes:');
    console.log('1. Redémarrer le backend sur Coolify');
    console.log('2. Tester la connexion');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('Détails:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

applyMigrations();
