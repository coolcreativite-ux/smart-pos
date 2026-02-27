const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '../.env.development') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

async function checkTenantsColumns() {
  try {
    console.log('🔍 Vérification des colonnes de la table tenants...\n');
    
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'tenants' 
      ORDER BY ordinal_position
    `);
    
    console.log('Colonnes trouvées:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Vérifier si ncc et address existent
    const hasNcc = result.rows.some(row => row.column_name === 'ncc');
    const hasAddress = result.rows.some(row => row.column_name === 'address');
    
    console.log('\n📊 Résultat:');
    console.log(`  - Colonne 'ncc': ${hasNcc ? '✅ Existe' : '❌ Manquante'}`);
    console.log(`  - Colonne 'address': ${hasAddress ? '✅ Existe' : '❌ Manquante'}`);
    
    if (!hasNcc || !hasAddress) {
      console.log('\n⚠️  Il faut ajouter les colonnes manquantes avec:');
      if (!hasNcc) {
        console.log('  ALTER TABLE tenants ADD COLUMN ncc VARCHAR(50);');
      }
      if (!hasAddress) {
        console.log('  ALTER TABLE tenants ADD COLUMN address TEXT;');
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await pool.end();
  }
}

checkTenantsColumns();
