const AmazonScraper = require('../scrapers/AmazonScraper');
const FlipkartScraper = require('../scrapers/FlipkartScraper');
const RelianceDigitalScraper = require('../scrapers/RelianceDigitalScraper');
const CromaScraper = require('../scrapers/CromaScraper');
const logger = require('../utils/logger');

class ScrapingService {
  constructor() {
    this.scrapers = {
      amazon: new AmazonScraper(),
      flipkart: new FlipkartScraper(),
      relianceDigital: new RelianceDigitalScraper(),
      croma: new CromaScraper()
    };
  }

  async scrapeAll(query) {
    logger.info(`🚀 Starting scraping for query: "${query}"`);
    
    const promises = Object.entries(this.scrapers).map(async ([storeName, scraper]) => {
      try {
        logger.info(`📡 ${storeName}: Starting scrape...`);
        const results = await scraper.searchProducts(query, 5);
        
        // **CRITICAL**: Ensure store name is properly assigned
        const resultsWithStore = results.map(product => ({
          ...product,
          store: storeName.charAt(0).toUpperCase() + storeName.slice(1).replace(/([A-Z])/g, ' $1').trim()
        }));
        
        // Debug output
        console.log(`\n🏪 ${storeName.toUpperCase()} RESULTS:`);
        console.log(`   Products found: ${results.length}`);
        console.log(`   Sample products:`, resultsWithStore.slice(0, 2).map(p => ({ name: p.name, price: p.price, store: p.store })));
        
        logger.info(`✅ ${storeName}: Found ${results.length} products`);
        return resultsWithStore;
      } catch (error) {
        console.error(`❌ ${storeName.toUpperCase()} ERROR:`, error.message);
        logger.error(`❌ ${storeName}: Scraping failed:`, error.message);
        return [];
      }
    });

    const results = await Promise.all(promises);
    const allProducts = results.flat();
    
    // Enhanced debug output
    console.log(`\n🎯 FINAL SUMMARY:`);
    console.log(`   Total products: ${allProducts.length}`);
    
    const storeBreakdown = {};
    allProducts.forEach(product => {
      const store = product.store || 'Unknown Store';
      storeBreakdown[store] = (storeBreakdown[store] || 0) + 1;
    });
    console.log(`   Store breakdown:`, storeBreakdown);
    
    // Show sample from each store
    Object.keys(storeBreakdown).forEach(store => {
      const sampleProduct = allProducts.find(p => p.store === store);
      if (sampleProduct) {
        console.log(`   ${store} sample: ${sampleProduct.name} - ₹${sampleProduct.price}`);
      }
    });
    
    logger.info(`🎯 Total products scraped: ${allProducts.length}`);
    return allProducts;
  }
}

module.exports = ScrapingService;
