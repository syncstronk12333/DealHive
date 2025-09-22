const AmazonScraper = require('../scrapers/AmazonScraper');
const FlipkartScraper = require('../scrapers/FlipkartScraper');
const logger = require('../utils/logger');

class ScraperService {
  constructor() {
    // Clean and simple: Just the 2 best working scrapers
    this.scrapers = {
      amazon: new AmazonScraper(),
      flipkart: new FlipkartScraper()
    };
  }

  async searchAllStores(query) {
    logger.info(`🔍 DealHive: Searching "${query}" (Amazon + Flipkart)`);
    
    const promises = Object.entries(this.scrapers).map(async ([storeName, scraper]) => {
      try {
        logger.info(`🛒 Searching ${storeName}...`);
        const results = await scraper.searchProducts(query, 20); // More results per store
        logger.info(`✅ ${storeName}: Found ${results.length} products`);
        return results;
      } catch (error) {
        logger.error(`❌ ${storeName} failed:`, error.message);
        return [];
      }
    });

    const results = await Promise.all(promises);
    const allProducts = results.flat();
    
    const uniqueProducts = this.removeDuplicates(allProducts);
    const sortedProducts = this.sortByRelevance(uniqueProducts, query);
    
    logger.info(`🎯 Total: ${allProducts.length} products → ${uniqueProducts.length} unique`);
    
    return sortedProducts;
  }
  
  removeDuplicates(products) {
    const seen = new Map();
    
    return products.filter(product => {
      const nameKey = product.name.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      const uniqueKey = `${product.store}-${nameKey}`;
      
      if (seen.has(uniqueKey)) {
        const existing = seen.get(uniqueKey);
        if (product.price > 0 && (existing.price === 0 || product.price < existing.price)) {
          seen.set(uniqueKey, product);
          return true;
        }
        return false;
      } else {
        seen.set(uniqueKey, product);
        return true;
      }
    });
  }
  
  sortByRelevance(products, query) {
    const queryWords = query.toLowerCase().split(' ');
    
    return products.sort((a, b) => {
      const scoreA = this.calculateRelevanceScore(a.name.toLowerCase(), queryWords);
      const scoreB = this.calculateRelevanceScore(b.name.toLowerCase(), queryWords);
      
      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }
      
      return a.price - b.price;
    });
  }
  
  calculateRelevanceScore(productName, queryWords) {
    let score = 0;
    
    queryWords.forEach(word => {
      if (productName.includes(word)) {
        score += 10;
        
        const regex = new RegExp(`\\b${word}\\b`, 'i');
        if (regex.test(productName)) {
          score += 5;
        }
      }
    });
    
    return score;
  }
}

module.exports = new ScraperService();
