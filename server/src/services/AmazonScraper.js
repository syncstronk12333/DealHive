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

  async searchProducts(query, maxResults = 30) {
    try {
      // FIXED: More comprehensive search queries for all storage options
      const searchQueries = [
        query,
        `${query} 64GB`,
        `${query} 128GB`,
        `${query} 256GB`, 
        `${query} 512GB`,
        `${query} 1TB`
      ];

      let allProducts = [];
      
      const searchPromises = searchQueries.map(async (searchQuery) => {
        try {
          const results = await this.searchSingleQuery(searchQuery);
          return results;
        } catch (error) {
          logger.warn(`Amazon query "${searchQuery}" failed: ${error.message}`);
          return [];
        }
      });
      
      const results = await Promise.all(searchPromises);
      
      results.forEach(products => {
        allProducts.push(...products);
      });
      
      const uniqueProducts = this.removeDuplicates(allProducts).slice(0, maxResults);
      
      logger.info(`🎯 Amazon: ${uniqueProducts.length} unique products found from ${allProducts.length} total`);
      
      return uniqueProducts;
      
    } catch (error) {
      logger.error('❌ Amazon scraping failed:', error.message);
      return [];
    }
  }

  async searchSingleQuery(searchQuery) {
    try {
      const searchUrl = `${this.baseUrl}/s?k=${encodeURIComponent(searchQuery)}&ref=sr_pg_1`;
      
      const response = await axios.get(searchUrl, { 
        headers: this.headers,
        timeout: 10000
      });
      
      const $ = cheerio.load(response.data);
      const products = [];
      
      const productElements = $('[data-component-type="s-search-result"]');
      
      logger.info(`🔍 Amazon "${searchQuery}": Found ${productElements.length} product elements`);
      
      productElements.slice(0, 20).each((index, element) => {
        try {
          const $el = $(element);
          
          // Skip ads completely
          if (this.isAdvertisement($el)) {
            return;
          }
          
          let title = '';
          const titleSelectors = [
            'h2 span',
            'a h2 span',
            'h2 a span'
          ];
          
          for (const selector of titleSelectors) {
            const foundTitle = $el.find(selector).text().trim();
            if (foundTitle && foundTitle.length > 10) {
              title = foundTitle;
              break;
            }
          }
          
          if (!title) return;
          
          // Skip if title contains ad text
          if (this.containsAdText(title)) {
            return;
          }
          
          let price = 0;
          const priceSelectors = [
            '.a-price-whole',
            '.a-offscreen',
            '.a-price .a-offscreen'
          ];
          
          for (const selector of priceSelectors) {
            const priceText = $el.find(selector).first().text().trim();
            if (priceText && (priceText.includes('₹') || /^\d{2,6}(,\d{3})*$/.test(priceText))) {
              const cleanPrice = priceText
                .replace(/₹/g, '')
                .replace(/,/g, '')
                .replace(/[^\d]/g, '')
                .trim();
              
              const priceMatch = cleanPrice.match(/^(\d{3,8})$/);
              
              if (priceMatch) {
                const parsedPrice = parseInt(priceMatch[1]);
                
                if (parsedPrice >= 1000 && parsedPrice <= 1000000) { // Increased range
                  price = parsedPrice;
                  break;
                }
              }
            }
          }
          
          if (price === 0) return;
          
          let productUrl = null;
          const linkSelectors = [
            'h2 a',
            'a[href*="/dp/"]',
            'a[href*="/gp/product/"]',
            '.s-link-style a',
            'a'
          ];
          
          for (const selector of linkSelectors) {
            const $link = $el.find(selector);
            if ($link.length > 0) {
              const href = $link.first().attr('href');
              if (href && (href.includes('/dp/') || href.includes('/gp/product/'))) {
                productUrl = href.startsWith('http') ? href : `${this.baseUrl}${href}`;
                break;
              }
            }
          }
          
          if (!productUrl) {
            const asin = $el.attr('data-asin');
            if (asin) {
              productUrl = `${this.baseUrl}/dp/${asin}`;
            }
          }
          
          if (!productUrl) return;
          
          const image = $el.find('img').first().attr('src');
          
          const ratingText = $el.find('.a-icon-alt').first().text();
          const ratingMatch = ratingText.match(/([\d.]+)/);
          const rating = ratingMatch ? parseFloat(ratingMatch[1]) : null;
          
          products.push({
            name: title,
            price: price,
            currency: 'INR',
            store: 'Amazon',
            url: productUrl,
            imageUrl: image,
            rating: rating,
            availability: true
          });
          
        } catch (error) {
          // Silent error handling for speed
        }
      });
      
      return products;
      
    } catch (error) {
      logger.warn(`❌ Amazon search failed for "${searchQuery}": ${error.message}`);
      return [];
    }
  }

  // Detect and skip advertisements
  isAdvertisement(element) {
    const $el = element;
    
    if ($el.find('[data-component-type="sp-sponsored-result"]').length > 0) {
      return true;
    }
    
    if ($el.text().toLowerCase().includes('sponsored')) {
      return true;
    }
    
    const adClasses = ['.AdHolder', '.s-sponsored-list-item'];
    for (const adClass of adClasses) {
      if ($el.find(adClass).length > 0 || $el.is(adClass)) {
        return true;
      }
    }
    
    return false;
  }
  
  // Detect ad text in titles
  containsAdText(title) {
    const adTexts = [
      'you are seeing this ad',
      'based on the product',
      'relevance to your search',
      'let us know',
      'sponsored',
      'advertisement'
    ];
    
    const lowerTitle = title.toLowerCase();
    return adTexts.some(adText => lowerTitle.includes(adText));
  }

  removeDuplicates(products) {
    const seen = new Set();
    return products.filter(product => {
      const getProductId = (url) => {
        const match = url.match(/\/dp\/([A-Z0-9]+)/);
        return match ? match[1] : url;
      };
      
      const id = getProductId(product.url);
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }
}

module.exports = AmazonScraper;
