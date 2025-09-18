const axios = require('axios');
const cheerio = require('cheerio');

async function testFlipkartExtraction() {
  try {
    const url = 'https://www.flipkart.com/search?q=iphone+15&otracker=search&otracker1=search&marketplace=FLIPKART';
    console.log('Testing Flipkart extraction...');
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      timeout: 15000
    });
    
    const $ = cheerio.load(response.data);
    const productElements = $('[data-id]');
    
    console.log(`\nFound ${productElements.length} [data-id] elements\n`);
    
    productElements.slice(0, 5).each((index, element) => {
      const $el = $(element);
      const rawText = $el.text();
      
      console.log(`--- Product ${index + 1} ---`);
      console.log('Raw text length:', rawText.length);
      console.log('First 200 chars:', rawText.substring(0, 200));
      
      // Try to extract title
      const titleLink = $el.find('a[title]').first();
      const linkTitle = titleLink.attr('title');
      console.log('Link title:', linkTitle);
      
      // Try to extract price
      const priceMatches = rawText.match(/₹([\d,]+)/g);
      console.log('Price matches:', priceMatches);
      
      // Try to extract URL
      const href = $el.find('a').first().attr('href');
      console.log('First link href:', href);
      
      // Try to find image
      const imgSrc = $el.find('img').first().attr('src');
      console.log('Image src:', imgSrc);
      
      console.log('');
    });
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testFlipkartExtraction();
