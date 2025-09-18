const express = require('express');
const scrapingRoutes = require('./scraping');

const router = express.Router();

router.use('/search', scrapingRoutes);

router.get('/', (req, res) => {
  res.json({
    message: 'Price Monitor API',
    version: '1.0.0',
    endpoints: {
      search: '/api/search/:query',
      health: '/health'
    }
  });
});

module.exports = router;
