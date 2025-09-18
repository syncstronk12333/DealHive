const ScrapingService = require('../services/scrapingService');
const logger = require('../utils/logger');

const scrapingService = new ScrapingService();

exports.searchProducts = async (req, res) => {
  try {
    const { query } = req.params;
    
    if (!query) {
      return res.status(400).json({ 
        error: 'Search query is required',
        message: 'Please provide a search term'
      });
    }

    logger.info(`Search request for: ${query}`);

    // Use the correct method name: scrapeAll (not searchAllStores)
    const scrapedProducts = await scrapingService.scrapeAll(query);
    
    logger.info(`Search completed: Found ${scrapedProducts.length} products`);
    
    if (scrapedProducts.length === 0) {
      return res.status(404).json({
        message: 'No products found - scrapers returned empty results',
        query: query,
        results: [],
        stores: []
      });
    }

    // Sort products by price for better comparison
    const sortedProducts = scrapedProducts.sort((a, b) => a.price - b.price);
    
    // Calculate statistics
    const prices = scrapedProducts.map(p => p.price);
    const lowestPrice = Math.min(...prices);
    const highestPrice = Math.max(...prices);
    const averagePrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
    
    // Group by stores for summary
    const storeCount = {};
    scrapedProducts.forEach(product => {
      storeCount[product.store] = (storeCount[product.store] || 0) + 1;
    });

    res.json({
      query: query,
      totalResults: scrapedProducts.length,
      stores: Object.keys(storeCount),
      storeCount: storeCount,
      priceRange: {
        lowest: lowestPrice,
        highest: highestPrice,
        average: averagePrice,
        difference: highestPrice - lowestPrice
      },
      results: sortedProducts,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Search error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to search products',
      details: error.message
    });
  }
};
