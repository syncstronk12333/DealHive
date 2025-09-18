const axios = require('axios');
const cheerio = require('cheerio');
const logger = require('../utils/logger');

class FlipkartScraper {
  constructor() {
    this.baseUrl = 'https://www.flipkart.com';
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9'
    };
  }

  cleanProductTitle(rawTitle) {
    if (!rawTitle) return '';
    
    let cleaned = rawTitle
      .replace(/^Add to Compare/, '')
      .replace(/\d+\.\d+[\d,]+\s*Ratings?\s*&?\s*[\d,]+\s*Reviews?/gi, '')
      .replace(/\d+\s*year\s*warranty[^A-Z]*/gi, '')
      .replace(/₹[\d,]+/g, '')
      .replace(/Only\s*\d+\s*left/gi, '')
      .replace(/Upto\s*₹[\d,]+\s*Off[^A-Z]*/gi, '')
      .replace(/\b\d{4,}\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    const mainProductMatch = cleaned.match(/^([^₹]*?(?:iPhone|Samsung|OnePlus|Xiaomi|Realme|Oppo|Vivo)[^₹]*?)(?:\d+\.\d+|₹|$)/i);
    if (mainProductMatch) {
      cleaned = mainProductMatch[1].trim();
    }
    
    return cleaned.replace(/\s+/g, ' ').trim().replace(/[.,;:]$/, '');
  }

  async searchProducts(query, maxResults = 10) {
    try {
      // Search with broader terms to capture more variants
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
          const searchUrl = `${this.baseUrl}/search?q=${encodeURIComponent(searchQuery)}&otracker=search&otracker1=search&marketplace=FLIPKART`;
          
          logger.info(`Scraping Flipkart for: ${searchQuery}`);
          
          const response = await axios.get(searchUrl, { 
            headers: this.headers,
            timeout: 15000
          });
          
          const $ = cheerio.load(response.data);
          const productElements = $('[data-id]');
          
          productElements.slice(0, 5).each((index, element) => {
            try {
              const $el = $(element);
              const rawText = $el.text();
              
              let title = '';
              const titleLink = $el.find('a[title]').first();
              if (titleLink.length > 0) {
                const linkTitle = titleLink.attr('title');
                if (linkTitle && linkTitle.length > 10) {
                  title = this.cleanProductTitle(linkTitle);
                }
              }
              
              if (!title || title.length < 10) {
                const productMatch = rawText.match(/(Apple\s+iPhone\s+\d+[^₹]*?)(?:\d+\.\d+|₹)/i) ||
                                  rawText.match(/(Samsung\s+Galaxy[^₹]*?)(?:\d+\.\d+|₹)/i) ||
                                  rawText.match(/(OnePlus[^₹]*?)(?:\d+\.\d+|₹)/i);
                
                if (productMatch) {
                  title = this.cleanProductTitle(productMatch[1]);
                }
              }
              
              if (!title || title.length < 10) return;
              
              let price = 0;
              const priceMatches = rawText.match(/₹([\d,]+)/g);
              
              if (priceMatches && priceMatches.length > 0) {
                const priceText = priceMatches[0];
                const numericPrice = priceText.replace(/[₹,]/g, '');
                price = parseFloat(numericPrice);
              }
              
              if (price <= 1000) return;
              
              let productUrl = null;
              const linkElement = $el.find('a').first();
              if (linkElement.length > 0) {
                const href = linkElement.attr('href');
                if (href) {
                  productUrl = href.startsWith('/') ? `${this.baseUrl}${href}` : href;
                }
              }
              
              let imageUrl = null;
              const imgElement = $el.find('img').first();
              if (imgElement.length > 0) {
                imageUrl = imgElement.attr('src') || imgElement.attr('data-src');
              }
              
              let rating = null;
              const ratingMatch = rawText.match(/(\d+\.\d+)\d+,\d+,\d+ Ratings/);
              if (ratingMatch) {
                rating = parseFloat(ratingMatch[1]);
              }
              
              // Check if we already have this exact product
              const isDuplicate = allProducts.some(existing => 
                existing.name === title && 
                existing.price === price && 
                existing.store === 'Flipkart'
              );

              if (!isDuplicate && title && price && productUrl) {
                allProducts.push({
                  name: title,
                  price: price,
                  currency: 'INR',
                  store: 'Flipkart',
                  url: productUrl,
                  imageUrl: imageUrl,
                  rating: rating,
                  availability: true
                });
                
                logger.info(`Found Flipkart product: ${title} - ₹${price}`);
              }
              
            } catch (error) {
              logger.error(`Error parsing Flipkart element:`, error.message);
            }
          });

        } catch (error) {
          logger.warn(`Failed to search Flipkart for "${searchQuery}":`, error.message);
        }

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Remove duplicates and return up to maxResults
      const uniqueProducts = allProducts.slice(0, maxResults);
      logger.info(`Flipkart scraping completed: ${uniqueProducts.length} unique products found`);
      return uniqueProducts;
      
    } catch (error) {
      logger.error('Flipkart scraping failed:', error.message);
      return [];
    }
  }
}

module.exports = FlipkartScraper;
