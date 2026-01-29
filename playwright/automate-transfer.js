const { chromium } = require('playwright');

async function automateTransferTitle() {
  console.log('🔄 Starting automated land title transfer...\n');
  
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext({
    recordVideo: {
      dir: '/Users/johnchristophermcarrillo/Desktop/Playwright Simulations',
      size: { width: 1280, height: 720 }
    },
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  try {
    // Use existing user credentials
    const username = 'admin';
    const password = 'admin123';
    
    // Step 1: Navigate to login page
    console.log('🔐 Step 1: Navigating to login page...');
    await page.goto('http://localhost:4005/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Step 2: Login
    console.log('🔑 Step 2: Logging in...');
    
    const usernameSelector = '[name="username"], [name="email"], input[type="text"], input[type="email"]';
    await page.locator(usernameSelector).first().fill(username);
    await page.waitForTimeout(500);
    
    const passwordSelector = '[name="password"], input[type="password"]';
    await page.locator(passwordSelector).first().fill(password);
    await page.waitForTimeout(1000);
    
    await page.click('button:has-text("Login"), button[type="submit"]');
    await page.waitForTimeout(2000);
    console.log('  ✅ Logged in successfully!');
    
    // Step 3: Navigate to Transfer Title page
    console.log('📍 Step 3: Navigating to Transfer Title page...');
    await page.goto('http://localhost:4005/transfer-land-title', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Step 4: Click Create New Transfer
    console.log('➕ Step 4: Opening transfer form...');
    const createTransferSelectors = [
      'button:has-text("Create New Transfer")',
      'button:has-text("New Transfer")',
      'button:has-text("Create Transfer")',
      'text=Create New Transfer'
    ];
    
    let createClicked = false;
    for (const selector of createTransferSelectors) {
      if (await page.locator(selector).count() > 0) {
        await page.click(selector);
        createClicked = true;
        console.log('  ✅ Create New Transfer button clicked');
        break;
      }
    }
    
    if (!createClicked) {
      console.log('  ⚠️  Create New Transfer button not found');
    }
    
    await page.waitForTimeout(2000);
    
    // Step 5: Select active land title
    console.log('🏠 Step 5: Selecting active land title...');
    const landTitleSelector = '[name="land_title_id"], [name="landTitleId"], select[name="land_title_id"]';
    if (await page.locator(landTitleSelector).count() > 0) {
      const landTitleField = page.locator(landTitleSelector).first();
      await landTitleField.selectOption({ index: 1 });
      console.log('  ✅ Active land title selected');
      await page.waitForTimeout(500);
    }
    
    // Step 6: Fill buyer details
    console.log('✍️  Step 6: Filling buyer details...');
    
    const fillField = async (selectors, value, label) => {
      for (const selector of selectors) {
        if (await page.locator(selector).count() > 0) {
          await page.locator(selector).first().fill(value);
          console.log(`  ✅ ${label}: ${value}`);
          await page.waitForTimeout(500);
          return true;
        }
      }
      return false;
    };
    
    await fillField(['[name="buyer_name"]', '[name="buyerName"]'], 'Joyboy Carrillo', 'Buyer Name');
    await fillField(['[name="buyer_contact"]', '[name="buyerContact"]'], '09178249312', 'Buyer Contact');
    await fillField(['[name="buyer_email"]', '[name="buyerEmail"]', 'input[type="email"]'], 'john@gmail.com', 'Buyer Email');
    await fillField(['[name="buyer_address"]', '[name="buyerAddress"]', 'textarea[name="buyer_address"]'], 'Mandaluyong City', 'Buyer Address');
    
    // Step 7: Click Create Transfer button
    console.log('🚀 Step 7: Creating transfer...');
    
    const createButtonSelectors = [
      '.MuiDialog-container button:has-text("Create Transfer")',
      'div[role="dialog"] button:has-text("Create")',
      '.MuiDialog-root button:has-text("Create")',
      'button[type="submit"]:has-text("Create")'
    ];
    
    let transferCreated = false;
    for (const selector of createButtonSelectors) {
      if (await page.locator(selector).count() > 0) {
        await page.locator(selector).first().click({ force: true });
        transferCreated = true;
        console.log('  ✅ Create Transfer button clicked');
        break;
      }
    }
    
    if (!transferCreated) {
      await page.locator('button:has-text("Create")').last().click({ force: true });
    }
    
    await page.waitForTimeout(3000);
    console.log('  ✅ Transfer created successfully!');
    
    await page.waitForTimeout(3000);
    
    console.log('\n✅ Transfer automation completed successfully!');
    console.log('📹 Video saved to: Desktop/Playwright Simulations/');
    
  } catch (error) {
    console.error('❌ Error during automation:', error.message);
    await page.screenshot({ path: './playwright/transfer-error.png' });
  } finally {
    await context.close();
    await browser.close();
  }
}

automateTransferTitle().catch(console.error);
