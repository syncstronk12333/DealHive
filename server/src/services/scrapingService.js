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
    logger.info(`Starting scraping for query: ${query}`);
    
    const promises = Object.entries(this.scrapers).map(async ([name, scraper]) => {
      try {
        logger.info(`Starting ${name} scraping...`);
        const results = await scraper.searchProducts(query, 5);
        logger.info(`${name} completed: ${results.length} products found`);
        return results;
      } catch (error) {
        logger.error(`${name} scraping failed:`, error.message);
        return [];
      }
    });

    const results = await Promise.all(promises);
    const allProducts = results.flat();
    
    logger.info(`Total products scraped: ${allProducts.length}`);
    return allProducts;
  }
}

module.exports = ScrapingService;
