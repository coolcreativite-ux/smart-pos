const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/sales',
  method: 'GET',
  headers: {
    'Accept': 'application/json'
  }
};

console.log('🧪 Testing GET /api/sales with raw HTTP...\n');

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const sales = JSON.parse(data);
      
      console.log(`✅ Received ${sales.length} sales\n`);
      
      if (sales.length > 0) {
        const firstSale = sales[0];
        console.log('📦 First sale:');
        console.log('  ID:', firstSale.id);
        console.log('  Items:', firstSale.items);
        console.log('  Items type:', typeof firstSale.items);
        console.log('  Items is array:', Array.isArray(firstSale.items));
        
        if (firstSale.items && firstSale.items.length > 0) {
          const firstItem = firstSale.items[0];
          console.log('\n📦 First item:');
          console.log('  Product:', firstItem.productName);
          console.log('  Quantity:', firstItem.quantity);
          console.log('  Quantity type:', typeof firstItem.quantity);
          console.log('  Quantity as string:', JSON.stringify(firstItem.quantity));
          console.log('  Quantity === 2:', firstItem.quantity === 2);
          console.log('  Quantity === "2":', firstItem.quantity === "2");
          console.log('  Quantity === 20:', firstItem.quantity === 20);
          console.log('  Quantity === "20":', firstItem.quantity === "20");
          
          // Check raw JSON
          console.log('\n📄 Raw JSON for first item:');
          console.log(JSON.stringify(firstItem, null, 2));
        } else {
          console.log('\n⚠️ No items in first sale!');
        }
      }
      
    } catch (error) {
      console.error('❌ Error parsing JSON:', error.message);
      console.log('Raw data:', data.substring(0, 500));
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request error:', error.message);
  console.log('\n💡 Make sure backend is running on port 5000');
});

req.end();
