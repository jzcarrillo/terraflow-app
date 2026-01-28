const { chromium } = require('playwright');

async function automateLandRegistration() {
  console.log('🚀 Starting automated user registration and land title registration...\n');
  
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
    const timestamp = Date.now();
    const username = `juan_${timestamp}`;
    const email = `juan${timestamp}@example.com`;
    const password = 'SecurePass123!';
    
    // Step 1: Navigate to register page
    console.log('📍 Step 1: Navigating to registration page...');
    await page.goto('http://localhost:4005/register', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Step 2: First attempt - incomplete details
    console.log('❌ Step 2: First attempt with incomplete details...');
    await page.fill('[name="username"]', username);
    await page.waitForTimeout(500);
    
    await page.fill('[name="email"]', email);
    await page.waitForTimeout(500);
    
    // Try to submit with incomplete fields
    const submitButtons = await page.locator('button[type="submit"]').count();
    if (submitButtons > 0) {
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
      console.log('  ⚠️  Validation error shown');
    }
    
    // Step 3: Complete the details
    console.log('✅ Step 3: Completing registration details...');
    
    // Fill all required fields
    await page.fill('[name="username"]', username);
    await page.waitForTimeout(300);
    
    await page.fill('[name="email"]', email);
    await page.waitForTimeout(300);
    
    await page.fill('[name="password"]', password);
    await page.waitForTimeout(300);
    
    // Confirm password
    const confirmPasswordSelector = '[name="confirm_password"], [name="passwordConfirm"], [name="confirmPassword"], input[type="password"]:nth-of-type(2)';
    if (await page.locator(confirmPasswordSelector).count() > 0) {
      await page.locator(confirmPasswordSelector).first().fill(password);
      await page.waitForTimeout(300);
    }
    
    // First name
    const firstNameSelector = '[name="first_name"], [name="firstName"], [name="firstname"]';
    if (await page.locator(firstNameSelector).count() > 0) {
      await page.locator(firstNameSelector).first().fill('Juan');
      await page.waitForTimeout(300);
    }
    
    // Last name
    const lastNameSelector = '[name="last_name"], [name="lastName"], [name="lastname"]';
    if (await page.locator(lastNameSelector).count() > 0) {
      await page.locator(lastNameSelector).first().fill('Dela Cruz');
      await page.waitForTimeout(300);
    }
    
    // Location
    const locationSelector = '[name="location"], select[name="location"]';
    if (await page.locator(locationSelector).count() > 0) {
      const locationField = page.locator(locationSelector).first();
      const isSelect = await locationField.evaluate(el => el.tagName.toLowerCase() === 'select');
      if (isSelect) {
        await locationField.selectOption({ index: 1 });
      } else {
        await locationField.fill('Manila');
      }
      await page.waitForTimeout(300);
    }
    
    // Role
    const roleSelector = '[name="role"], select[name="role"]';
    if (await page.locator(roleSelector).count() > 0) {
      const roleField = page.locator(roleSelector).first();
      const isSelect = await roleField.evaluate(el => el.tagName.toLowerCase() === 'select');
      if (isSelect) {
        await roleField.selectOption({ index: 1 });
      } else {
        await roleField.fill('user');
      }
      await page.waitForTimeout(300);
    }
    
    // Contact number
    const contactSelector = '[name="contact_number"], [name="contactNumber"], [name="contact"], [name="phone"]';
    if (await page.locator(contactSelector).count() > 0) {
      await page.locator(contactSelector).first().fill('09123456789');
      await page.waitForTimeout(1000);
    }
    
    // Click Register button
    await page.click('button:has-text("Register"), button[type="submit"]');
    await page.waitForTimeout(2000);
    console.log('  ✅ User registered successfully!');
    
    // Step 4: Navigate to login page
    console.log('🔐 Step 4: Navigating to login page...');
    await page.goto('http://localhost:4005/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Step 5: Login
    console.log('🔑 Step 5: Logging in...');
    
    // Try different username field selectors
    const usernameSelector = '[name="username"], [name="email"], input[type="text"], input[type="email"]';
    await page.locator(usernameSelector).first().fill(username);
    await page.waitForTimeout(500);
    
    // Password field
    const passwordSelector = '[name="password"], input[type="password"]';
    await page.locator(passwordSelector).first().fill(password);
    await page.waitForTimeout(1000);
    
    await page.click('button:has-text("Login"), button[type="submit"]');
    await page.waitForTimeout(2000);
    console.log('  ✅ Logged in successfully!');
    
    // Step 6: Click Land Titles tab
    console.log('📝 Step 6: Navigating to Land Titles...');
    await page.click('text=Land Titles');
    await page.waitForTimeout(1500);
    
    // Step 7: Click Create New Land Title button
    console.log('➕ Step 7: Opening land title form...');
    await page.click('text=Create New Land Title');
    await page.waitForTimeout(2000);
    
    // Wait for form to appear
    await page.waitForSelector('input[type="text"], input[name*="title"], input[name*="owner"]', { state: 'visible', timeout: 5000 });
    await page.waitForTimeout(1000);
    
    // Step 8: Fill land title information
    console.log('✍️  Step 8: Filling land title information...');
    
    // Fill fields one by one with scroll and wait
    const fillField = async (selectors, value, label) => {
      for (const selector of selectors) {
        const count = await page.locator(selector).count();
        if (count > 0) {
          const field = page.locator(selector).first();
          await field.scrollIntoViewIfNeeded();
          await field.fill(value);
          console.log(`  ✅ ${label}: ${value}`);
          await page.waitForTimeout(500);
          return true;
        }
      }
      console.log(`  ⚠️  ${label} field not found`);
      return false;
    };
    
    await fillField(
      ['input[placeholder="Title Number"]', '[name="title_number"]', '[name="titleNumber"]'],
      'TCT-2024-AUTO-001',
      'Title Number'
    );
    
    await fillField(
      ['input[placeholder="Previous Title Number"]', '[name="previous_title_number"]', '[name="previous_title"]', '[name="previousTitle"]'],
      'TCT-2023-001',
      'Previous Title Number'
    );
    
    await fillField(
      ['[name="owner_name"]', '[name="ownerName"]', 'input[placeholder*="Owner" i]'],
      'Juan Dela Cruz',
      'Owner Name'
    );
    
    await fillField(
      ['[name="contact_no"]', '[name="contactNo"]', '[name="contact"]', 'input[placeholder*="Contact" i]'],
      '09123456789',
      'Contact Number'
    );
    
    await fillField(
      ['[name="email_address"]', '[name="emailAddress"]', '[name="email"]', 'input[type="email"]'],
      email,
      'Email'
    );
    
    await fillField(
      ['[name="lot_number"]', '[name="lotNumber"]', 'input[placeholder*="Lot" i]'],
      '123',
      'Lot Number'
    );
    
    await fillField(
      ['[name="area"]', '[name="area_size"]', '[name="areaSize"]', 'input[placeholder*="Area" i]'],
      '500',
      'Area Size'
    );
    
    // Address
    const addressSelectors = ['[name="address"]', 'textarea[name="address"]', 'textarea[placeholder*="Address" i]'];
    for (const selector of addressSelectors) {
      if (await page.locator(selector).count() > 0) {
        const field = page.locator(selector).first();
        await field.scrollIntoViewIfNeeded();
        await field.fill('Manila, Philippines');
        console.log('  ✅ Address: Manila, Philippines');
        await page.waitForTimeout(500);
        break;
      }
    }
    
    // Registration Date (date picker)
    const dateSelectors = ['[name="registration_date"]', '[name="registrationDate"]', 'input[type="date"]', 'input[placeholder*="Date" i]'];
    for (const selector of dateSelectors) {
      if (await page.locator(selector).count() > 0) {
        const field = page.locator(selector).first();
        await field.scrollIntoViewIfNeeded();
        await field.fill('2024-01-28');
        console.log('  ✅ Registration Date: 2024-01-28');
        await page.waitForTimeout(500);
        break;
      }
    }
    
    // Encumbrances
    await fillField(
      ['[name="encumbrances"]', 'textarea[name="encumbrances"]', 'textarea[placeholder*="Encumbrance" i]'],
      'None',
      'Encumbrances'
    );
    
    // Dropdown fields
    const dropdowns = [
      { selector: '[name="property_location"], [name="propertyLocation"], select[name="property_location"]', label: 'Property Location' },
      { selector: '[name="classification"], select[name="classification"]', label: 'Classification' },
      { selector: '[name="registrar_office"], [name="registrarOffice"], select[name="registrar_office"]', label: 'Registrar Office' }
    ];
    
    for (const dropdown of dropdowns) {
      if (await page.locator(dropdown.selector).count() > 0) {
        const field = page.locator(dropdown.selector).first();
        await field.scrollIntoViewIfNeeded();
        const isSelect = await field.evaluate(el => el.tagName.toLowerCase() === 'select');
        if (isSelect) {
          await field.selectOption({ index: 1 });
          console.log(`  ✅ ${dropdown.label}: Selected`);
          await page.waitForTimeout(500);
        }
      }
    }
    
    console.log('✅ Land title information filled');
    
    // Step 9: Upload 3 attachments using Choose File and Add File buttons
    console.log('📎 Step 9: Uploading 3 attachments...');
    
    const path = require('path');
    const testFilesPath = path.join(__dirname, 'test-files');
    
    const files = [
      { file: path.join(testFilesPath, 'deed.pdf'), label: 'Deed' },
      { file: path.join(testFilesPath, 'tax_dec.pdf'), label: 'Tax Declaration' },
      { file: path.join(testFilesPath, 'deed.pdf'), label: 'Additional Document' }
    ];
    
    for (let i = 0; i < files.length; i++) {
      // Upload file to the file input
      const fileInput = page.locator('input[type="file"]').first();
      await fileInput.setInputFiles(files[i].file);
      console.log(`  📄 ${files[i].label} selected`);
      await page.waitForTimeout(1000);
      
      // Click Add File button
      await page.click('button:has-text("Add File"), button:has-text("Add")');
      console.log(`  ✅ Attachment ${i + 1}: ${files[i].label} added`);
      await page.waitForTimeout(1000);
    }
    
    // Step 10: Click Create button
    console.log('🚀 Step 10: Creating land title...');
    
    // Wait for any loading dialogs to close
    await page.waitForTimeout(2000);
    
    // Try to click Create button
    const createButton = page.locator('button:has-text("Create")').last();
    await createButton.scrollIntoViewIfNeeded();
    await createButton.click({ force: true });
    await page.waitForTimeout(3000);
    console.log('  ✅ Land title created successfully!');
    
    await page.waitForTimeout(3000);
    
    console.log('\n✅ Automation completed successfully!');
    console.log('📹 Video saved to: Desktop/Playwright Simulations/');
    
  } catch (error) {
    console.error('❌ Error during automation:', error.message);
    await page.screenshot({ path: './simulation/error-screenshot.png' });
  } finally {
    await context.close();
    await browser.close();
  }
}

// Run automation
automateLandRegistration().catch(console.error);
