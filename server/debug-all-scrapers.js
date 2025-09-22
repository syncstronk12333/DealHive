const AmazonScraper = require('./src/scrapers/AmazonScraper');
const FlipkartScraper = require('./src/scrapers/FlipkartScraper');
const RelianceDigitalScraper = require('./src/scrapers/RelianceDigitalScraper');
const CromaScraper = require('./src/scrapers/CromaScraper');

async function testAllScrapers() {
  console.log('🔍 Testing all scrapers with "iPhone 15"...\n');
  
  const scrapers = [
    { name: 'Amazon', scraper: new AmazonScraper() },
    { name: 'Flipkart', scraper: new FlipkartScraper() },
    { name: 'Reliance Digital', scraper: new RelianceDigitalScraper() },
    { name: 'Croma', scraper: new CromaScraper() }
  ];
  
  for (const { name, scraper } of scrapers) {
    try {
      console.log(`=== Testing ${name} ===`);
      const results = await scraper.searchProducts('iPhone 15', 3);
      
      if (results.length > 0) {
        console.log(`✅ ${name}: Found ${results.length} products`);
        results.forEach((product, i) => {
          console.log(`  ${i + 1}. ${product.name.substring(0, 50)}... - ₹${product.price}`);
        });
      } else {
        console.log(`❌ ${name}: No products found`);
      }
      
    } catch (error) {
      console.log(`💥 ${name}: Error - ${error.message}`);
    }
    
    console.log('');
  }
}

testAllScrapers().then(() => {
  console.log('🏁 All tests completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});
