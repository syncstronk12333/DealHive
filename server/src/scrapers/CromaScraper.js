const axios = require('axios');
const cheerio = require('cheerio');
const logger = require('../utils/logger');

class CromaScraper {
  constructor() {
    this.baseUrl = 'https://www.croma.com';
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Cache-Control': 'max-age=0'
    };
  }

  async searchProducts(query, maxResults = 5) {
    try {
      // Only search main query to avoid too many requests
      const searchUrl = `${this.baseUrl}/search?q=${encodeURIComponent(query)}`;
      
      logger.info(`Scraping Croma for: ${query}`);
      
      // Add random delay to appear more human-like
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
      
      const response = await axios.get(searchUrl, { 
        headers: this.headers,
        timeout: 20000,
        maxRedirects: 5
      });
      
      const $ = cheerio.load(response.data);
      const products = [];
      
      // Try multiple selectors for Croma's current structure
      const selectors = [
        '.product-item',
        '.plp-product-thumb',
        '.cp-product',
        '[data-testid*="product"]',
        '.product-card',
        '.ProductCard'
      ];

      let foundElements = false;
      
      for (const selector of selectors) {
        const elements = $(selector);
        if (elements.length > 0) {
          logger.info(`Found ${elements.length} Croma products with selector: ${selector}`);
          foundElements = true;

          elements.slice(0, maxResults).each((index, element) => {
            try {
              const $el = $(element);
              
              const title = $el.find('h3, h4, .product-title, .cp-product__title, [class*="title"]').first().text().trim() ||
                           $el.find('a').attr('title') ||
                           $el.find('img').attr('alt');
              
              if (!title || title.length < 10 || !title.toLowerCase().includes('iphone')) return;
              
              const priceText = $el.find('.amount, .price, .cp-product__price, [class*="price"]').first().text().trim();
              if (!priceText) return;
              
              const priceMatch = priceText.replace(/[₹,]/g, '').match(/[\d.]+/);
              const price = priceMatch ? parseFloat(priceMatch[0]) : 0;
              if (price <= 1000) return;
              
              const href = $el.find('a').first().attr('href');
              const productUrl = href && href.startsWith('/') ? `${this.baseUrl}${href}` : href;
              if (!productUrl) return;
              
              const image = $el.find('img').first().attr('src') || $el.find('img').first().attr('data-src');
              
              products.push({
                name: title,
                price: price,
                currency: 'INR',
                store: 'Croma',
                url: productUrl,
                imageUrl: image,
                rating: null,
                availability: true
              });
              
              logger.info(`Found Croma product: ${title} - ₹${price}`);
              
            } catch (error) {
              logger.warn(`Error parsing Croma element:`, error.message);
            }
          });
          
          break;
        }
      }

      if (!foundElements) {
        logger.warn(`No products found on Croma - website may have changed structure`);
      }
      
      logger.info(`Croma scraping completed: ${products.length} products found`);
      return products.slice(0, maxResults);
      
    } catch (error) {
      if (error.response?.status === 403) {
        logger.warn('Croma is blocking requests - try again later or use different approach');
      } else {
        logger.error('Croma scraping failed:', error.message);
      }
      return [];
    }
  }
}

module.exports = CromaScraper;
