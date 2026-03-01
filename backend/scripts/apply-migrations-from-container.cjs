// Script pour appliquer les migrations depuis le conteneur Docker
// À exécuter avec: node scripts/apply-migrations-from-container.cjs
// Date: 2026-03-01

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Les variables d'environnement sont déjà chargées dans le conteneur
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL non définie');
  process.exit(1);
}

const migrations = [
  {
    name: 'Add tenant contact fields',
    sql: `
      -- Add phone column if not exists
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='phone') THEN
          ALTER TABLE tenants ADD COLUMN phone VARCHAR(50);
        END IF;
      END $$;

      -- Add email column if not exists
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='email') THEN
          ALTER TABLE tenants ADD COLUMN email VARCHAR(255);
        END IF;
      END $$;

      -- Add rccm column if not exists
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='rccm') THEN
          ALTER TABLE tenants ADD COLUMN rccm VARCHAR(100);
        END IF;
      END $$;

      -- Add logo_url column if not exists
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='logo_url') THEN
          ALTER TABLE tenants ADD COLUMN logo_url TEXT;
        END IF;
      END $$;
    `
  },
  {
    name: 'Add user phone field',
    sql: `
      -- Add phone column to users if not exists
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='users' AND column_name='phone' AND data_type='character varying'
        ) THEN
          ALTER TABLE users ADD COLUMN phone VARCHAR(50);
        END IF;
      END $$;
    `
  }
];

async function applyMigrations() {
  console.log('🔧 Application des migrations...');
  console.log('📊 DATABASE_URL:', DATABASE_URL.substring(0, 50) + '...');
  
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    for (const migration of migrations) {
      console.log(`\n📝 Migration: ${migration.name}`);
      
      try {
        await pool.query(migration.sql);
        console.log(`✅ Migration appliquée avec succès`);
      } catch (error) {
        console.error(`❌ Erreur lors de la migration:`, error.message);
        throw error;
      }
    }

    // Vérifier la structure finale
    console.log('\n📋 Vérification de la structure...');
    
    const tenantsColumns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tenants' 
      AND column_name IN ('phone', 'email', 'rccm', 'logo_url')
      ORDER BY column_name
    `);
    console.log('🏢 Colonnes tenants:', tenantsColumns.rows.map(r => r.column_name).join(', '));

    const usersColumns = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'phone'
    `);
    console.log('👤 Colonne phone users:', usersColumns.rows.length > 0 ? 'OK' : 'MANQUANTE');

    console.log('\n🎉 Migrations terminées!');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

applyMigrations();
