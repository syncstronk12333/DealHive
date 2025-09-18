const AmazonScraper = require('./src/scrapers/AmazonScraper');
const FlipkartScraper = require('./src/scrapers/FlipkartScraper');
const RelianceDigitalScraper = require('./src/scrapers/RelianceDigitalScraper');
const CromaScraper = require('./src/scrapers/CromaScraper');

async function testAllScrapers() {
  const query = 'iPhone 15';
  
  console.log(`\n🔍 Testing all scrapers for: "${query}"\n`);
  
  const scrapers = [
    { name: 'Amazon', scraper: new AmazonScraper() },
    { name: 'Flipkart', scraper: new FlipkartScraper() },
    { name: 'Reliance Digital', scraper: new RelianceDigitalScraper() },
    { name: 'Croma', scraper: new CromaScraper() }
  ];
  
  for (const { name, scraper } of scrapers) {
    try {
      console.log(`\n--- Testing ${name} ---`);
      const products = await scraper.searchProducts(query, 3);
      console.log(`✅ ${name}: Found ${products.length} products`);
      
      products.forEach((product, index) => {
        console.log(`  ${index + 1}. ${product.name} - ₹${product.price}`);
      });
      
    } catch (error) {
      console.log(`❌ ${name}: Failed - ${error.message}`);
    }
  }
}

testAllScrapers().catch(console.error);
