const axios = require('axios');
const cheerio = require('cheerio');
const logger = require('../utils/logger');

class FlipkartScraper {
    constructor() {
        this.baseUrl = 'https://www.flipkart.com';
        this.headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Connection': 'keep-alive',
            'Cache-Control': 'max-age=0'
        };
    }

    async searchProducts(query, maxResults = 25) {
        try {
            const searchQueries = [
                query,
                `${query} mobile`,
                `${query} phone`
            ];
            
            let allProducts = [];
            
            for (const searchQuery of searchQueries) {
                const products = await this.searchSingleQuery(searchQuery);
                allProducts.push(...products);
                
                await new Promise(resolve => setTimeout(resolve, 1200));
                
                if (allProducts.length >= maxResults) break;
            }
            
            const uniqueProducts = this.removeDuplicates(allProducts).slice(0, maxResults);
            logger.info(`Flipkart: ${uniqueProducts.length} products found`);
            return uniqueProducts;
            
        } catch (error) {
            logger.error('Flipkart scraping failed:', error.message);
            return [];
        }
    }

    async searchSingleQuery(searchQuery) {
        try {
            const searchUrl = `${this.baseUrl}/search?q=${encodeURIComponent(searchQuery)}`;
            logger.info(`Flipkart: Searching for "${searchQuery}"`);
            
            const response = await axios.get(searchUrl, {
                headers: this.headers,
                timeout: 15000
            });

            const $ = cheerio.load(response.data);
            const products = [];

            let productElements = $();
            const productSelectors = [
                '[data-id]',
                '._1AtVbE',
                '._2kHMtA',
                '._1fQZEK',
                '.col-7-12',
                '._3pLy-c'
            ];

            for (const selector of productSelectors) {
                productElements = $(selector);
                if (productElements.length > 0) {
                    logger.info(`Flipkart: Found ${productElements.length} products with selector: ${selector}`);
                    break;
                }
            }

            if (productElements.length === 0) {
                logger.warn(`Flipkart: No products found for "${searchQuery}"`);
                return [];
            }

            productElements.slice(0, 15).each((index, element) => {
                try {
                    const $el = $(element);
                    
                    let title = '';
                    const titleSelectors = [
                        '.KzDlHZ',
                        '.IRpwTa', 
                        '.wjcEIp',
                        '.s1Q9rs',
                        '._4rR01T',
                        'a[title]'
                    ];
                    
                    for (const selector of titleSelectors) {
                        title = $el.find(selector).text().trim();
                        if (!title) title = $el.find(`a${selector}`).attr('title') || '';
                        if (title && title.length > 5) break;
                    }
                    
                    if (!title || title.length < 5) return;

                    let price = 0;
                    const priceSelectors = [
                        '._30jeq3',
                        '._1_WHN1',
                        '.Nx9bqj',
                        '._25b18c',
                        '._1vC4OE',
                        '.hl05eU'
                    ];
                    
                    for (const selector of priceSelectors) {
                        const priceText = $el.find(selector).text().trim();
                        if (priceText && /[₹,\d]/.test(priceText)) {
                            const cleanPrice = priceText
                                .replace(/₹/g, '')
                                .replace(/,/g, '')
                                .replace(/\s/g, '')
                                .trim();
                            const priceMatch = cleanPrice.match(/\d{3,8}/);
                            if (priceMatch) {
                                const parsedPrice = parseInt(priceMatch[0]);
                                if (parsedPrice > 1000 && parsedPrice < 500000) {
                                    price = parsedPrice;
                                    break;
                                }
                            }
                        }
                    }
                    
                    if (price === 0) return;

                    const linkSelectors = [
                        'a[href*="/p/"]',
                        '._1fQZEK a',
                        '.s1Q9rs a',
                        'a'
                    ];
                    
                    let href = '';
                    for (const selector of linkSelectors) {
                        const link = $el.find(selector).first();
                        href = link.attr('href');
                        if (href && href.includes('/p/')) break;
                    }
                    
                    if (!href) return;
                    
                    const productUrl = href.startsWith('http') ? href : `${this.baseUrl}${href}`;

                    const image = $el.find('img').first().attr('src') || '';

                    const ratingElement = $el.find('._3LWZlK').text();
                    const rating = ratingElement ? parseFloat(ratingElement) : null;

                    products.push({
                        name: title,
                        price: price,
                        currency: 'INR',
                        store: 'Flipkart',
                        url: productUrl,
                        imageUrl: image,
                        rating: rating,
                        availability: true
                    });

                } catch (error) {
                    logger.warn(`Flipkart: Error parsing product ${index}:`, error.message);
                }
            });

            logger.info(`Flipkart: Successfully parsed ${products.length} products for "${searchQuery}"`);
            return products;

        } catch (error) {
            logger.warn(`Flipkart search failed for "${searchQuery}":`, error.message);
            return [];
        }
    }

    removeDuplicates(products) {
        const seen = new Set();
        return products.filter(product => {
            const getProductId = (url) => {
                const match = url.match(/\/p\/([a-zA-Z0-9]+)/);
                return match ? match[1] : url;
            };
            
            const id = getProductId(product.url);
            if (seen.has(id)) return false;
            seen.add(id);
            return true;
        });
    }
}

module.exports = FlipkartScraper;
