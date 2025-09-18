const express = require('express');
const ScrapingService = require('../services/scrapingService');
const logger = require('../utils/logger');

const router = express.Router();

router.post('/search', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ 
        success: false, 
        error: 'Query is required' 
      });
    }
    
    console.log(`🔍 API: Starting search for "${query}"`);
    
    const scrapingService = new ScrapingService();
    const results = await scrapingService.scrapeAll(query);
    
    console.log(`✅ API: Search completed. Found ${results.length} products`);
    
    res.json({
      success: true,
      query: query,
      results: results,
      totalProducts: results.length,
      stores: [...new Set(results.map(p => p.store))],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ API: Search failed:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to search products',
      details: error.message
    });
  }
});

router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'API routes working',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
