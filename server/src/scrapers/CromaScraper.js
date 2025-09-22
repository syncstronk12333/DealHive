const axios = require('axios');
const cheerio = require('cheerio');
const logger = require('../utils/logger');

class CromaScraper {
  constructor() {
    this.baseUrl = 'https://www.croma.com';
    
    // Enhanced headers to mimic real browser
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br', 
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Cache-Control': 'max-age=0',
      'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"macOS"'
    };
  }

  async searchProducts(query, maxResults = 15) {
    try {
      logger.info(`🔍 Croma: Starting enhanced search for "${query}"`);
      
      // Use direct category URLs instead of search to avoid 403
      const productUrls = this.getDirectProductUrls(query);
      let allProducts = [];
      
      for (const { url, description } of productUrls) {
        try {
          await this.randomDelay(2000, 4000); // Longer delays for Croma
          
          logger.info(`🌐 Fetching Croma: ${description}`);
          
          const response = await axios.get(url, {
            headers: {
              ...this.headers,
              'Referer': 'https://www.croma.com/'
            },
            timeout: 25000,
            maxRedirects: 5
          });

          const $ = cheerio.load(response.data);
          
          const products = this.parseProductsFromPage($, description);
          allProducts.push(...products);
          
          if (allProducts.length >= maxResults) break;
          
        } catch (error) {
          logger.warn(`❌ Croma ${description} failed: ${error.message}`);
          
          // If 403, try alternative approach
          if (error.response && error.response.status === 403) {
            logger.info(`🔄 Croma: Trying alternative approach for ${description}`);
            await this.randomDelay(5000, 8000);
            // Could implement proxy rotation or different approach here
          }
        }
      }
      
      const uniqueProducts = allProducts.slice(0, maxResults);
      logger.info(`🎯 Croma: Found ${uniqueProducts.length} products`);
      
      return uniqueProducts;
      
    } catch (error) {
      logger.error('❌ Croma scraping failed:', error.message);
      return [];
    }
  }
  
  getDirectProductUrls(query) {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('iphone')) {
      return [
        { 
          url: 'https://www.croma.com/phones-wearables/mobile-phones/apple-iphones', 
          description: 'Apple iPhones Category'
        },
        { 
          url: 'https://www.croma.com/phones-wearables/mobile-phones', 
          description: 'All Mobile Phones'
        }
      ];
    }
    
    if (lowerQuery.includes('samsung')) {
      return [
        { 
          url: 'https://www.croma.com/phones-wearables/mobile-phones/samsung-mobile-phones', 
          description: 'Samsung Mobile Phones'
        }
      ];
    }
    
    // Fallback to main mobile category
    return [
      { 
        url: 'https://www.croma.com/phones-wearables/mobile-phones', 
        description: 'Mobile Phones Category'
      }
    ];
  }
  
  parseProductsFromPage($, description) {
    const products = [];
    
    // Multiple selectors for Croma's layout
    const productSelectors = [
      '.product-item',
      '.product-card', 
      '.product-tile',
      '[data-testid*="product"]',
      '.product',
      '.item'
    ];
    
    let $products = $();
    for (const selector of productSelectors) {
      $products = $(selector);
      if ($products.length > 0) {
        logger.info(`📦 Found ${$products.length} Croma products with selector: ${selector}`);
        break;
      }
    }
    
    // If no structured products found, try text-based search
    if ($products.length === 0) {
      $products = $('*').filter((i, el) => {
        const text = $(el).text();
        return text.toLowerCase().includes('iphone') && text.includes('₹') && text.length > 20 && text.length < 200;
      });
      logger.info(`📦 Found ${$products.length} Croma products via text search`);
    }
    
    $products.slice(0, 8).each((index, element) => {
      try {
        const product = this.parseProductElement($, $(element));
        if (product) {
          products.push(product);
          logger.info(`✅ Croma: ${product.name.substring(0, 40)}... - ₹${product.price}`);
        }
      } catch (error) {
        logger.warn(`❌ Error parsing Croma product: ${error.message}`);
      }
    });
    
    return products;
  }
  
  parseProductElement($, $el) {
    // Extract title
    const titleSelectors = [
      '.product-title',
      '.product-name',
      'h3', 'h4', 'h5',
      'a[title]',
      '.title',
      '.name'
    ];
    
    let title = '';
    for (const selector of titleSelectors) {
      title = $el.find(selector).first().text().trim();
      if (title && title.length > 5) break;
    }
    
    if (!title) {
      title = $el.find('a').attr('title') || $el.find('img').attr('alt') || '';
    }
    
    if (!title || title.length < 5) {
      return null;
    }
    
    // Extract price
    const priceSelectors = [
      '.amount',
      '.new-price', 
      '.price',
      '.cost',
      '[class*="price"]',
      '.current-price'
    ];
    
    let priceText = '';
    for (const selector of priceSelectors) {
      priceText = $el.find(selector).first().text().trim();
      if (priceText && priceText.includes('₹')) break;
    }
    
    if (!priceText) {
      // Look for price in entire element text
      const elementText = $el.text();
      const priceMatch = elementText.match(/₹[\d,]+/);
      priceText = priceMatch ? priceMatch[0] : '';
    }
    
    if (!priceText || !priceText.includes('₹')) {
      return null;
    }
    
    const cleanPrice = priceText.replace(/₹/g, '').replace(/,/g, '').replace(/[^\d]/g, '').trim();
    const price = parseInt(cleanPrice);
    
    if (!price || price < 5000 || price > 500000) {
      return null;
    }
    
    // Extract URL
    let productUrl = $el.find('a').first().attr('href');
    if (!productUrl) {
      productUrl = $el.closest('a').attr('href') || $el.parent('a').attr('href');
    }
    
    if (!productUrl) {
      return null;
    }
    
    if (!productUrl.startsWith('http')) {
      productUrl = `${this.baseUrl}${productUrl}`;
    }
    
    // Extract image
    const image = $el.find('img').first().attr('src') || $el.find('img').first().attr('data-src');
    
    return {
      name: title,
      price: price,
      currency: 'INR',
      store: 'Croma',
      url: productUrl,
      imageUrl: image,
      rating: null,
      availability: true
    };
  }
  
  async randomDelay(min, max) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}

module.exports = CromaScraper;
