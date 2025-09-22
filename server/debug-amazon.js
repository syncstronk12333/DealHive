const axios = require('axios');
const cheerio = require('cheerio');

async function debugAmazon() {
  console.log('🔍 Debugging Amazon directly...\n');
  
  const url = 'https://www.amazon.in/s?k=iPhone+15';
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9'
  };
  
  try {
    const response = await axios.get(url, { headers, timeout: 10000 });
    const $ = cheerio.load(response.data);
    
    console.log('=== SEARCHING FOR PRODUCTS ===');
    
    // Test different selectors
    const selectors = [
      '[data-component-type="s-search-result"]',
      '[data-asin]',
      '.s-result-item',
      '.sg-col-inner .s-widget-container'
    ];
    
    for (const selector of selectors) {
      const elements = $(selector);
      console.log(`${selector}: Found ${elements.length} elements`);
      
      if (elements.length > 0) {
        console.log(`\n=== TESTING FIRST ELEMENT WITH ${selector} ===`);
        const $first = $(elements.first());
        
        // Test title selectors
        const titleSelectors = [
          'h2 a span',
          'h2 span',
          'h1',
          '.s-size-mini span',
          '[data-cy="title-recipe-title"]',
          'a h2 span'
        ];
        
        console.log('Title tests:');
        for (const titleSel of titleSelectors) {
          const title = $first.find(titleSel).text().trim();
          if (title) {
            console.log(`  ✅ ${titleSel}: "${title.substring(0, 60)}..."`);
          }
        }
        
        // Test price selectors
        const priceSelectors = [
          '.a-price-whole',
          '.a-offscreen',
          '.a-price .a-offscreen',
          '.s-price-text',
          '.a-price-range'
        ];
        
        console.log('Price tests:');
        for (const priceSel of priceSelectors) {
          const price = $first.find(priceSel).text().trim();
          if (price) {
            console.log(`  ✅ ${priceSel}: "${price}"`);
          }
        }
        
        // Test link selectors
        const linkSelectors = [
          'h2 a',
          'a[href*="/dp/"]',
          '.s-link-style a'
        ];
        
        console.log('Link tests:');
        for (const linkSel of linkSelectors) {
          const href = $first.find(linkSel).attr('href');
          if (href) {
            console.log(`  ✅ ${linkSel}: "${href.substring(0, 60)}..."`);
          }
        }
        
        break; // Stop after first working selector
      }
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

debugAmazon();
