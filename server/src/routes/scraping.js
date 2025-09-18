const express = require('express');
const { scrapeProducts } = require('../controllers/scrapingController');
const logger = require('../utils/logger');

const router = express.Router();

// POST /api/scraping/search - Search and scrape products
router.post('/search', scrapeProducts);

// GET /api/scraping/health - Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Scraping service is running',
    timestamp: new Date().toISOString(),
    endpoints: {
      search: 'POST /api/scraping/search',
      health: 'GET /api/scraping/health'
    }
  });
});

module.exports = router;
