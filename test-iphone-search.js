const AmazonScraper = require('./src/scrapers/AmazonScraper');
const FlipkartScraper = require('./src/scrapers/FlipkartScraper');

async function testScrapers() {
  console.log('🔍 Testing iPhone 15 search...\n');
  
  // Test Amazon
  console.log('=== TESTING AMAZON ===');
  const amazonScraper = new AmazonScraper();
  try {
    const amazonResults = await amazonScraper.searchProducts('iPhone 15', 5);
    console.log(`✅ Amazon returned ${amazonResults.length} products:`);
    amazonResults.forEach((product, i) => {
      console.log(`${i + 1}. ${product.name.substring(0, 60)}... - ₹${product.price}`);
    });
  } catch (error) {
    console.log('❌ Amazon failed:', error.message);
  }
  
  console.log('\n=== TESTING FLIPKART ===');
  const flipkartScraper = new FlipkartScraper();
  try {
    const flipkartResults = await flipkartScraper.searchProducts('iPhone 15', 5);
    console.log(`✅ Flipkart returned ${flipkartResults.length} products:`);
    flipkartResults.forEach((product, i) => {
      console.log(`${i + 1}. ${product.name.substring(0, 60)}... - ₹${product.price}`);
    });
  } catch (error) {
    console.log('❌ Flipkart failed:', error.message);
  }
}

testScrapers().then(() => {
  console.log('\n🏁 Test completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});
