const axios = require('axios');
const cheerio = require('cheerio');
const logger = require('../utils/logger');

class AmazonScraper {
  constructor() {
    this.baseUrl = 'https://www.amazon.in';
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Connection': 'keep-alive',
      'Cache-Control': 'max-age=0',
      'Upgrade-Insecure-Requests': '1'
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
          const searchUrl = `${this.baseUrl}/s?k=${encodeURIComponent(searchQuery)}&ref=sr_pg_1`;
          
          logger.info(`Scraping Amazon for: ${searchQuery}`);
          
          const response = await axios.get(searchUrl, { 
            headers: this.headers,
            timeout: 15000
          });
          
          const $ = cheerio.load(response.data);
          
          $('[data-component-type="s-search-result"]').slice(0, 5).each((index, element) => {
            try {
              const $el = $(element);
              
              let title = '';
              const titleSelectors = [
                'h2 a span',
                'h2 .a-link-normal span', 
                'h2 span',
                '[data-cy="title-recipe-title"]',
                '.s-size-mini span',
                '.a-size-mini span'
              ];
              
              for (const selector of titleSelectors) {
                const foundTitle = $el.find(selector).text().trim();
                if (foundTitle && foundTitle.length > 10) {
                  title = foundTitle;
                  break;
                }
              }
              
              if (!title) return;
              
              let priceText = '';
              const priceSelectors = [
                '.a-price-whole',
                '.a-offscreen',
                '.a-price .a-offscreen',
                '.s-price-text'
              ];
              
              for (const selector of priceSelectors) {
                priceText = $el.find(selector).first().text().trim();
                if (priceText && priceText.includes('₹')) {
                  break;
                }
              }
              
              if (!priceText) return;
              
              const priceMatch = priceText.replace(/[₹,]/g, '').match(/[\d.]+/);
              const price = priceMatch ? parseFloat(priceMatch[0]) : 0;
              
              if (price <= 1000) return;
              
              let productUrl = null;
              const linkSelectors = [
                'h2 a',
                '[data-cy="title-recipe-title"]',
                '.s-link-style a',
                'a[href*="/dp/"]'
              ];
              
              for (const selector of linkSelectors) {
                const href = $el.find(selector).first().attr('href');
                if (href) {
                  productUrl = href.startsWith('http') ? href : `${this.baseUrl}${href}`;
                  break;
                }
              }
              
              const image = $el.find('img').first().attr('src');
              
              const ratingText = $el.find('.a-icon-alt').first().text();
              const ratingMatch = ratingText.match(/([\d.]+)/);
              const rating = ratingMatch ? parseFloat(ratingMatch[1]) : null;
              
              // Check for duplicates
              const isDuplicate = allProducts.some(existing => 
                existing.name === title && 
                existing.price === price && 
                existing.store === 'Amazon'
              );

              if (!isDuplicate && title && price && productUrl) {
                allProducts.push({
                  name: title,
                  price: price,
                  currency: 'INR',
                  store: 'Amazon',
                  url: productUrl,
                  imageUrl: image,
                  rating: rating,
                  availability: true
                });
                
                logger.info(`Found Amazon product: ${title} - ₹${price}`);
              }
              
            } catch (error) {
              logger.warn(`Error parsing Amazon product:`, error.message);
            }
          });

        } catch (error) {
          logger.warn(`Failed to search Amazon for "${searchQuery}":`, error.message);
        }

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      const uniqueProducts = allProducts.slice(0, maxResults);
      logger.info(`Amazon scraping completed: ${uniqueProducts.length} unique products found`);
      return uniqueProducts;
      
    } catch (error) {
      logger.error('Amazon scraping failed:', error.message);
      return [];
    }
  }
}

module.exports = AmazonScraper;
