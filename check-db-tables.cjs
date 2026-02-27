// Script Node.js pour vérifier les tables de la base de données
const { Pool } = require('pg');
require('dotenv').config({ path: './backend/.env.development' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkDatabase() {
  console.log('=== VÉRIFICATION BASE DE DONNÉES ===\n');
  
  try {
    // Test de connexion
    console.log('1. Test de connexion...');
    await pool.query('SELECT NOW()');
    console.log('   ✓ Connexion réussie\n');
    
    // Vérifier les tables du système de facturation
    console.log('2. Vérification des tables de facturation...');
    const tables = ['invoices', 'invoice_items', 'invoice_taxes', 'invoice_sequences'];
    
    for (const table of tables) {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )
      `, [table]);
      
      const exists = result.rows[0].exists;
      if (exists) {
        console.log(`   ✓ Table "${table}" existe`);
        
        // Compter les enregistrements
        const countResult = await pool.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`     → ${countResult.rows[0].count} enregistrement(s)`);
      } else {
        console.log(`   ✗ Table "${table}" MANQUANTE`);
      }
    }
    
    console.log('\n3. Vérification de la table customers...');
    const customerColumns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'customers' 
      AND column_name IN ('ncc', 'address')
    `);
    
    if (customerColumns.rows.length === 2) {
      console.log('   ✓ Colonnes NCC et address présentes');
    } else {
      console.log('   ✗ Colonnes NCC et/ou address manquantes');
      console.log('     Colonnes trouvées:', customerColumns.rows.map(r => r.column_name));
    }
    
    console.log('\n4. Vérification des produits (pour test)...');
    const products = await pool.query('SELECT COUNT(*) FROM products');
    console.log(`   → ${products.rows[0].count} produit(s) disponible(s)`);
    
    const variants = await pool.query('SELECT COUNT(*) FROM product_variants');
    console.log(`   → ${variants.rows[0].count} variante(s) disponible(s)`);
    
    console.log('\n=== RÉSULTAT ===');
    const allTablesExist = await pool.query(`
      SELECT COUNT(*) as count
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('invoices', 'invoice_items', 'invoice_taxes', 'invoice_sequences')
    `);
    
    if (allTablesExist.rows[0].count === '4') {
      console.log('✓ Toutes les tables de facturation sont présentes');
      console.log('\nLe système de facturation est prêt!');
      console.log('Si vous avez une erreur 500, vérifiez les logs du backend.');
    } else {
      console.log('✗ Tables manquantes détectées');
      console.log('\nACTION REQUISE:');
      console.log('Exécutez la migration: database/migrations/001_add_invoice_system.sql');
      console.log('Utilisez pgAdmin ou un client PostgreSQL pour exécuter le fichier SQL.');
    }
    
  } catch (error) {
    console.error('\n✗ ERREUR:', error.message);
    console.error('\nDétails:', error);
  } finally {
    await pool.end();
  }
}

checkDatabase();
