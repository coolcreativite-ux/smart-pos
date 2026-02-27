// Script pour tester la création de facture
const https = require('https');
const http = require('http');

const testData = JSON.stringify({
  documentType: "invoice",
  invoiceType: "B2C",
  documentSubtype: "standard",
  customerData: {
    name: "Client Test",
    phone: "0123456789",
    email: "test@example.com",
    address: "Abidjan, Côte d'Ivoire"
  },
  paymentMethod: "Espèces",
  items: [
    {
      productId: 1,
      variantId: 1,
      quantity: 1,
      unitPriceHT: 10000,
      discountPercent: 0,
      tvaRate: 18
    }
  ],
  globalDiscountPercent: 0,
  additionalTaxes: []
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/invoices',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(testData),
    'x-tenant-id': '1',
    'x-user-id': '1'
  }
};

console.log('=== TEST CRÉATION FACTURE ===\n');
console.log('Envoi de la requête POST à http://localhost:5000/api/invoices...\n');

const req = http.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}\n`);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Réponse:');
    try {
      const parsed = JSON.parse(data);
      console.log(JSON.stringify(parsed, null, 2));
      
      if (res.statusCode === 201) {
        console.log('\n✓ Facture créée avec succès!');
      } else {
        console.log('\n✗ Erreur lors de la création');
      }
    } catch (e) {
      console.log(data);
    }
  });
});

req.on('error', (error) => {
  console.error('✗ Erreur de connexion:', error.message);
});

req.write(testData);
req.end();
