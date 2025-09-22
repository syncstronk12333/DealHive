const RelianceDigitalScraper = require('./src/scrapers/RelianceDigitalScraper');

async function testRelianceOnly() {
  console.log('🔍 Testing Reliance Digital only...\n');
  
  const scraper = new RelianceDigitalScraper();
  
  try {
    console.log('=== Testing Reliance Digital ===');
    const results = await scraper.searchProducts('iPhone 15', 5);
    
    if (results.length > 0) {
      console.log(`✅ Reliance Digital: Found ${results.length} products`);
      results.forEach((product, i) => {
        console.log(`  ${i + 1}. ${product.name} - ₹${product.price}`);
        console.log(`     URL: ${product.url}`);
      });
    } else {
      console.log(`❌ Reliance Digital: No products found`);
    }
    
  } catch (error) {
    console.log(`💥 Reliance Digital: Error - ${error.message}`);
  }
}

testRelianceOnly().then(() => {
  console.log('\n🏁 Test completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});
