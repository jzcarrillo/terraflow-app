const { chromium } = require('playwright');

async function test() {
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const page = await (await browser.newContext()).newPage();
  
  try {
    await page.goto('http://localhost:30082/login');
    await page.waitForTimeout(2000);
    
    await page.locator('input[type="text"]').fill('admin');
    await page.locator('input[type="password"]').fill('admin123');
    await page.click('button[type="submit"]');
    
    console.log('Waiting 5 seconds after login...');
    await page.waitForTimeout(5000);
    
    console.log('Current URL:', page.url());
    console.log('Page title:', await page.title());
    
    const landTitles = await page.locator('text=Land Titles').count();
    console.log('Land Titles link found:', landTitles);
    
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

test();
