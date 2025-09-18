const axios = require('axios');
const cheerio = require('cheerio');

async function testFlipkart() {
  try {
    const url = 'https://www.flipkart.com/search?q=iphone+15&otracker=search&otracker1=search&marketplace=FLIPKART';
    console.log('Testing Flipkart URL:', url);
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      timeout: 15000
    });
    
    console.log('Response Status:', response.status);
    console.log('Response Length:', response.data.length);
    
    const $ = cheerio.load(response.data);
    console.log('Page Title:', $('title').text());
    
    // Check if page contains iPhone
    const bodyText = $('body').text().toLowerCase();
    console.log('Contains "iphone":', bodyText.includes('iphone'));
    console.log('Contains "₹":', bodyText.includes('₹'));
    
    // Try to find any products
    const selectors = ['[data-id]', '._1AtVbE', '._13oc-S', '.s1Q9rs', '.cPHDOP'];
    
    for (const selector of selectors) {
      const elements = $(selector);
      console.log(`Selector "${selector}": ${elements.length} elements found`);
      if (elements.length > 0) {
        console.log('First element text:', elements.first().text().substring(0, 100));
      }
    }
    
    // Check for anti-bot measures
    if (bodyText.includes('blocked') || bodyText.includes('captcha') || bodyText.includes('robot')) {
      console.log('🚨 DETECTED: Page might be showing anti-bot content');
    }
    
  } catch (error) {
    console.error('Flipkart test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
    }
  }
}

testFlipkart();
