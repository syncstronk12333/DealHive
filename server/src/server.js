const express = require('express');
const cors = require('cors');
require('dotenv').config();

const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5000; // FIXED: Changed from 8000 to 5000

app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json());

// Register API routes
app.use('/api', apiRoutes);

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint  
app.get('/', (req, res) => {
  res.json({ 
    message: 'DealHive API Server',
    version: '1.0.0',
    status: 'Running',
    endpoints: {
      health: '/api/health',
      search: '/api/search?query=<product_name>'
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 DealHive Server running on http://localhost:${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/api/health`);
  console.log(`🔍 Search: http://localhost:${PORT}/api/search?query=iPhone`);
});

module.exports = app;
