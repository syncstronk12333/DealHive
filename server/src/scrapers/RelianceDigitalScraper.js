const axios = require('axios');
const cheerio = require('cheerio');
const logger = require('../utils/logger');

class RelianceDigitalScraper {
  constructor() {
    this.baseUrl = 'https://www.reliancedigital.in';
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9'
    };
  }

  async searchProducts(query, maxResults = 10) {
    try {
      // Search with different storage variants
      const searchQueries = [
        query,
        `${query} 128GB`,
        `${query} 256GB`,
        `${query} 512GB`,
        `${query} 1TB`
      ];

      let allProducts = [];

      for (const searchQuery of searchQueries) {
        try {
          const searchUrl = `${this.baseUrl}/search?q=${encodeURIComponent(searchQuery)}`;
          
          logger.info(`Scraping Reliance Digital for: ${searchQuery}`);
          
          const response = await axios.get(searchUrl, { 
            headers: this.headers,
            timeout: 15000
          });
          
          const $ = cheerio.load(response.data);
          
          // Try multiple selectors for Reliance Digital
          const selectors = [
            '.sp__product',
            '.product-item', 
            '.ProductCard',
            '.product-card',
            '[data-testid="product-card"]',
            '.product-tile',
            '.pdp-product-card'
          ];

          let foundProducts = false;
          
          for (const selector of selectors) {
            const elements = $(selector);
            if (elements.length > 0) {
              logger.info(`Found ${elements.length} products with selector: ${selector}`);
              foundProducts = true;

              elements.slice(0, 5).each((index, element) => {
                try {
                  const $el = $(element);
                  
                  // Extract title
                  const title = $el.find('.sp__name, .product-title, .product-name, h3, h4, .title, [class*="title"], [class*="name"]').first().text().trim() ||
                               $el.find('a').attr('title') ||
                               $el.find('img').attr('alt');
                  
                  if (!title || title.length < 10) return;
                  
                  // Extract price
                  const priceText = $el.find('.sp__price, .price, .amount, [class*="price"], [class*="amount"]').first().text().trim();
                  
                  if (!priceText) return;
                  
                  const priceMatch = priceText.replace(/[₹,]/g, '').match(/[\d.]+/);
                  const price = priceMatch ? parseFloat(priceMatch[0]) : 0;
                  
                  if (price <= 1000) return;
                  
                  // Extract URL
                  const href = $el.find('a').first().attr('href');
                  const productUrl = href && href.startsWith('/') ? `${this.baseUrl}${href}` : href;
                  
                  if (!productUrl) return;
                  
                  // Extract image
                  const image = $el.find('img').first().attr('src') || $el.find('img').first().attr('data-src');
                  
                  // Check for duplicates
                  const isDuplicate = allProducts.some(existing => 
                    existing.name === title && 
                    existing.price === price && 
                    existing.store === 'Reliance Digital'
                  );

                  if (!isDuplicate && title && price && productUrl) {
                    allProducts.push({
                      name: title,
                      price: price,
                      currency: 'INR',
                      store: 'Reliance Digital',
                      url: productUrl,
                      imageUrl: image,
                      rating: null,
                      availability: true
                    });
                    
                    logger.info(`Found Reliance Digital product: ${title} - ₹${price}`);
                  }
                  
                } catch (error) {
                  logger.warn(`Error parsing Reliance Digital element:`, error.message);
                }
              });
              
              break; // Stop trying other selectors if we found products
            }
          }

          if (!foundProducts) {
            logger.warn(`No products found on Reliance Digital for "${searchQuery}"`);
          }

        } catch (error) {
          logger.warn(`Failed to search Reliance Digital for "${searchQuery}":`, error.message);
        }

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      const uniqueProducts = allProducts.slice(0, maxResults);
      logger.info(`Reliance Digital scraping completed: ${uniqueProducts.length} products found`);
      return uniqueProducts;
      
    } catch (error) {
      logger.error('Reliance Digital scraping failed:', error.message);
      return [];
    }
  }
}

module.exports = RelianceDigitalScraper;
