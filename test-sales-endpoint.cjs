async function testSalesEndpoint() {
  try {
    console.log('🧪 Testing GET /api/sales endpoint...\n');
    
    const response = await fetch('http://localhost:5000/api/sales');
    
    if (!response.ok) {
      console.error('❌ Response not OK:', response.status, response.statusText);
      return;
    }
    
    const sales = await response.json();
    
    console.log(`✅ Received ${sales.length} sales\n`);
    
    if (sales.length > 0) {
      const firstSale = sales[0];
      console.log('📦 First sale data:');
      console.log('  ID:', firstSale.id);
      console.log('  Created:', firstSale.created_at);
      console.log('  Items:', firstSale.items);
      console.log('  Items type:', typeof firstSale.items);
      console.log('  Items is array:', Array.isArray(firstSale.items));
      console.log('  Items length:', firstSale.items?.length);
      
      if (firstSale.items && firstSale.items.length > 0) {
        console.log('\n📦 First item:');
        console.log(JSON.stringify(firstSale.items[0], null, 2));
      } else {
        console.log('\n⚠️ No items in first sale!');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testSalesEndpoint();
