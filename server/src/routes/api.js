const express = require('express');
const ScraperService = require('../services/ScraperService'); // Fixed service name
const logger = require('../utils/logger');

const router = express.Router();

// FIXED: Changed to GET and use req.query instead of req.body
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query; // Changed from req.body to req.query
    
    if (!query) {
      return res.status(400).json({ 
        success: false, 
        error: 'Query parameter is required' 
      });
    }
    
    console.log(`🔍 API: Starting search for "${query}"`);
    
    // FIXED: Use the correct ScraperService
    const results = await ScraperService.searchAllStores(query);
    
    console.log(`✅ API: Search completed. Found ${results.length} products`);
    
    res.json({
      success: true,
      query: query,
      results: results, // This matches what frontend expects
      count: results.length,
      stores: ['Amazon', 'Flipkart'],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ API: Search failed:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to search products',
      message: error.message,
      results: []
    });
  }
});

router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'DealHive API is running',
    timestamp: new Date().toISOString(),
    stores: ['Amazon', 'Flipkart']
  });
});

module.exports = router;
