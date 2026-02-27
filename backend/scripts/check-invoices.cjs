const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.development') });

async function checkInvoices() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('📊 Factures créées:\n');
    
    const result = await pool.query(`
      SELECT 
        i.id,
        i.invoice_number,
        i.document_type,
        i.invoice_type,
        i.total_ttc,
        i.created_at,
        CONCAT(c.first_name, ' ', c.last_name) as customer_name
      FROM invoices i
      LEFT JOIN customers c ON c.id = i.customer_id
      ORDER BY i.created_at DESC
      LIMIT 5
    `);
    
    if (result.rows.length === 0) {
      console.log('  ❌ Aucune facture trouvée');
    } else {
      console.log(`  ✅ ${result.rows.length} facture(s) trouvée(s):\n`);
      result.rows.forEach(invoice => {
        console.log(`  📄 ${invoice.invoice_number}`);
        console.log(`     Type: ${invoice.document_type} (${invoice.invoice_type})`);
        console.log(`     Client: ${invoice.customer_name}`);
        console.log(`     Montant: ${parseFloat(invoice.total_ttc).toLocaleString('fr-FR')} FCFA`);
        console.log(`     Créée: ${new Date(invoice.created_at).toLocaleString('fr-FR')}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await pool.end();
  }
}

checkInvoices();
