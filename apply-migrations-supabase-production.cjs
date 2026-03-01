// Script pour appliquer les migrations sur Supabase PRODUCTION
// Base: https://lsujhpaxdsirlnllangt.supabase.co
// Date: 2026-03-01

const { Pool } = require('pg');
require('dotenv').config({ path: 'backend/.env.production' });

console.log('🔧 Application des migrations sur Supabase PRODUCTION');
console.log('🌍 Base de données:', process.env.SUPABASE_URL);
console.log('⚠️  ATTENTION: Vous êtes sur le point de modifier la base de données de PRODUCTION\n');

const migrations = [
  {
    name: 'Add tenant contact fields (phone, email, rccm, logo_url)',
    sql: `
      -- Add phone column if not exists
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='phone') THEN
          ALTER TABLE tenants ADD COLUMN phone VARCHAR(50);
          COMMENT ON COLUMN tenants.phone IS 'Numéro de téléphone de l''entreprise';
        END IF;
      END $$;

      -- Add email column if not exists
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='email') THEN
          ALTER TABLE tenants ADD COLUMN email VARCHAR(255);
          COMMENT ON COLUMN tenants.email IS 'Email de contact de l''entreprise';
        END IF;
      END $$;

      -- Add rccm column if not exists
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='rccm') THEN
          ALTER TABLE tenants ADD COLUMN rccm VARCHAR(100);
          COMMENT ON COLUMN tenants.rccm IS 'Registre du Commerce et du Crédit Mobilier';
        END IF;
      END $$;

      -- Add logo_url column if not exists
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='logo_url') THEN
          ALTER TABLE tenants ADD COLUMN logo_url TEXT;
          COMMENT ON COLUMN tenants.logo_url IS 'URL du logo de l''entreprise';
        END IF;
      END $$;
    `
  },
  {
    name: 'Add user phone field',
    sql: `
      -- Add phone column to users if not exists (VARCHAR type)
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='users' 
          AND column_name='phone' 
          AND data_type='character varying'
        ) THEN
          -- Check if phone column exists with different type
          IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name='users' AND column_name='phone'
          ) THEN
            -- Column exists but with different type, skip
            RAISE NOTICE 'Column phone already exists with different type';
          ELSE
            -- Add the column
            ALTER TABLE users ADD COLUMN phone VARCHAR(50);
            COMMENT ON COLUMN users.phone IS 'Numéro de téléphone personnel de l''utilisateur';
          END IF;
        END IF;
      END $$;
    `
  }
];

async function applyMigrations() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('📊 Connexion à la base de données...\n');

    for (const migration of migrations) {
      console.log(`📝 Migration: ${migration.name}`);
      
      try {
        await pool.query(migration.sql);
        console.log(`✅ Migration appliquée avec succès\n`);
      } catch (error) {
        console.error(`❌ Erreur lors de la migration:`, error.message);
        throw error;
      }
    }

    // Vérifier la structure finale
    console.log('📋 Vérification de la structure finale...\n');
    
    console.log('🏢 Colonnes de la table tenants:');
    const tenantsColumns = await pool.query(`
      SELECT column_name, data_type, character_maximum_length, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'tenants' 
      ORDER BY ordinal_position
    `);
    console.table(tenantsColumns.rows);

    console.log('\n👤 Colonnes de la table users (phone uniquement):');
    const usersPhoneColumn = await pool.query(`
      SELECT column_name, data_type, character_maximum_length, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name LIKE '%phone%'
      ORDER BY ordinal_position
    `);
    console.table(usersPhoneColumn.rows);

    console.log('\n🎉 Migrations terminées avec succès!');
    console.log('\n📋 Prochaines étapes:');
    console.log('1. Redéployer le backend sur Coolify');
    console.log('2. Tester la connexion sur https://smartpos.cooldigital.africa');

  } catch (error) {
    console.error('\n❌ Erreur fatale:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

applyMigrations();
