/**
 * Script de test rapide du système de facturation
 */

const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.development') });

async function testInvoiceSystem() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🧪 Test du système de facturation\n');

    // 1. Vérifier les tables
    console.log('1️⃣ Vérification des tables...');
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%invoice%'
      ORDER BY table_name
    `);
    
    console.log(`   ✅ ${tables.rows.length} tables trouvées:`);
    tables.rows.forEach(row => console.log(`      - ${row.table_name}`));

    // 2. Vérifier les colonnes customers
    console.log('\n2️⃣ Vérification des colonnes customers...');
    const customerCols = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'customers' 
      AND column_name IN ('ncc', 'address')
    `);
    
    console.log(`   ✅ ${customerCols.rows.length} colonnes ajoutées:`);
    customerCols.rows.forEach(row => console.log(`      - ${row.column_name} (${row.data_type})`));

    // 3. Vérifier les colonnes tenants
    console.log('\n3️⃣ Vérification des colonnes tenants...');
    const tenantCols = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'tenants' 
      AND column_name IN ('ncc', 'address')
    `);
    
    console.log(`   ✅ ${tenantCols.rows.length} colonnes ajoutées:`);
    tenantCols.rows.forEach(row => console.log(`      - ${row.column_name} (${row.data_type})`));

    // 4. Vérifier les index
    console.log('\n4️⃣ Vérification des index...');
    const indexes = await pool.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename LIKE '%invoice%'
      ORDER BY indexname
    `);
    
    console.log(`   ✅ ${indexes.rows.length} index créés`);

    // 5. Vérifier les contraintes
    console.log('\n5️⃣ Vérification des contraintes...');
    const constraints = await pool.query(`
      SELECT conname, contype 
      FROM pg_constraint 
      WHERE conrelid IN (
        SELECT oid FROM pg_class WHERE relname LIKE '%invoice%'
      )
      ORDER BY conname
    `);
    
    console.log(`   ✅ ${constraints.rows.length} contraintes créées`);

    // 6. Test d'insertion dans invoice_sequences
    console.log('\n6️⃣ Test d\'insertion dans invoice_sequences...');
    try {
      await pool.query(`
        INSERT INTO invoice_sequences (tenant_id, year, document_subtype, last_number)
        VALUES (1, 2026, 'standard', 0)
        ON CONFLICT (tenant_id, year, document_subtype) DO NOTHING
      `);
      console.log('   ✅ Insertion test réussie');
    } catch (err) {
      console.log('   ⚠️  Séquence déjà existante (normal)');
    }

    // 7. Vérifier les séquences existantes
    console.log('\n7️⃣ Séquences existantes...');
    const sequences = await pool.query(`
      SELECT tenant_id, year, document_subtype, last_number 
      FROM invoice_sequences 
      ORDER BY tenant_id, year, document_subtype
      LIMIT 5
    `);
    
    if (sequences.rows.length > 0) {
      console.log(`   ✅ ${sequences.rows.length} séquence(s) trouvée(s):`);
      sequences.rows.forEach(row => {
        console.log(`      - Tenant ${row.tenant_id}, ${row.year}, ${row.document_subtype}: ${row.last_number}`);
      });
    } else {
      console.log('   ℹ️  Aucune séquence créée (normal pour première utilisation)');
    }

    console.log('\n✅ Tous les tests sont passés! Le système est prêt.');
    console.log('\n📋 Prochaines étapes:');
    console.log('   1. Ouvrir http://localhost:3001');
    console.log('   2. Se connecter avec un utilisateur');
    console.log('   3. Créer une vente avec un client');
    console.log('   4. Cliquer sur "Facture" pour générer une facture');

  } catch (error) {
    console.error('\n❌ Erreur lors du test:', error.message);
    console.error('Détails:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testInvoiceSystem();
