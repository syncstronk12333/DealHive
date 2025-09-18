const ScrapingService = require('../services/scrapingService');
const logger = require('../utils/logger');

const scrapingService = new ScrapingService();

exports.scrapeProducts = async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ 
        error: 'Query is required',
        message: 'Please provide a search query'
      });
    }

    logger.info(`Scraping request for: ${query}`);

    // Use the correct method name: scrapeAll (not searchAllStores)
    const products = await scrapingService.scrapeAll(query);
    
    logger.info(`Scraping completed: Found ${products.length} products`);
    
    res.json({
      success: true,
      query: query,
      totalProducts: products.length,
      stores: [...new Set(products.map(p => p.store))],
      results: products,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Scraping error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to scrape products',
      message: error.message
    });
  }
};
