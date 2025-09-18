const express = require('express');
const { searchProducts } = require('../controllers/searchController');

const router = express.Router();

// GET /api/search/:query - Search products
router.get('/:query', searchProducts);

// POST /api/search - Search products (alternative endpoint)
router.post('/', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }
    
    // Redirect to the GET endpoint logic
    req.params.query = query;
    return searchProducts(req, res);
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
