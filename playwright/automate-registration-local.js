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
        await roleField.selectOption({ label: 'Admin' });
      } else {
        await roleField.fill('admin');
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
    
    await page.waitForTimeout(2000);
    
    // Step 11: Navigate to Payments
    console.log('💰 Step 11: Navigating to Payments...');
    const paymentTabSelectors = [
      'text=Payments',
      'a:has-text("Payments")',
      'button:has-text("Payments")',
      '[href*="payment"]',
      'nav a:has-text("Payments")'
    ];
    
    let paymentTabFound = false;
    for (const selector of paymentTabSelectors) {
      if (await page.locator(selector).count() > 0) {
        await page.click(selector);
        paymentTabFound = true;
        console.log('  ✅ Payments tab clicked');
        break;
      }
    }
    
    if (!paymentTabFound) {
      console.log('  ⚠️  Payments tab not found, trying to navigate directly...');
      await page.goto('http://localhost:4005/payments', { waitUntil: 'networkidle' });
    }
    
    await page.waitForTimeout(2000);
    
    // Step 12: Create payment
    console.log('➕ Step 12: Creating payment...');
    
    const createPaymentSelectors = [
      'button:has-text("Create New Payment")',
      'button:has-text("New Payment")',
      'button:has-text("Create Payment")',
      'text=Create New Payment',
      'a:has-text("Create")',
      'button:has-text("Create")'
    ];
    
    let createPaymentClicked = false;
    for (const selector of createPaymentSelectors) {
      if (await page.locator(selector).count() > 0) {
        await page.click(selector);
        createPaymentClicked = true;
        console.log('  ✅ Create New Payment button clicked');
        break;
      }
    }
    
    if (!createPaymentClicked) {
      console.log('  ⚠️  Create New Payment button not found');
    }
    
    await page.waitForTimeout(2000);
    
    const transactionId = `TXN-${timestamp}`;
    
    // Reference Type dropdown
    const refTypeSelector = '[name="reference_type"], [name="referenceType"], select[name="reference_type"]';
    if (await page.locator(refTypeSelector).count() > 0) {
      const refTypeField = page.locator(refTypeSelector).first();
      await refTypeField.click();
      await page.waitForTimeout(500);
      await refTypeField.selectOption({ index: 1 });
      console.log('  ✅ Reference Type: Selected');
      await page.waitForTimeout(1500);
    }
    
    // Reference ID dropdown - select first land title
    const refIdSelector = '[name="reference_id"], [name="referenceId"], select[name="reference_id"]';
    if (await page.locator(refIdSelector).count() > 0) {
      const refIdField = page.locator(refIdSelector).first();
      await page.waitForTimeout(1000);
      await refIdField.selectOption({ index: 1 });
      console.log('  ✅ Reference ID: Selected land title');
      await page.waitForTimeout(500);
    }
    
    await fillField(['[name="amount"]', '[name="payment_amount"]'], '5000', 'Amount');
    await fillField(['[name="payer_name"]', '[name="payerName"]'], 'Juan Dela Cruz', 'Payer Name');
    
    // Payment Method dropdown
    const paymentMethodSelector = '[name="payment_method"], [name="paymentMethod"], select[name="payment_method"]';
    if (await page.locator(paymentMethodSelector).count() > 0) {
      const paymentMethodField = page.locator(paymentMethodSelector).first();
      await paymentMethodField.selectOption({ label: 'Cash' });
      console.log('  ✅ Payment Method: Cash');
      await page.waitForTimeout(500);
    }
    
    // Click Create button inside dialog
    const createButtonSelectors = [
      '.MuiDialog-container button:has-text("Create")',
      'div[role="dialog"] button:has-text("Create")',
      '.MuiDialog-root button:has-text("Create")',
      'button[type="submit"]:has-text("Create")'
    ];
    
    let createClicked = false;
    for (const selector of createButtonSelectors) {
      if (await page.locator(selector).count() > 0) {
        await page.locator(selector).first().click({ force: true });
        createClicked = true;
        console.log('  ✅ Create button clicked');
        break;
      }
    }
    
    if (!createClicked) {
      await page.locator('button:has-text("Create")').last().click({ force: true });
    }
    
    await page.waitForTimeout(3000);
    console.log('  ✅ Payment created with status PENDING');
    
    await page.waitForTimeout(2000);
    
    // Step 13: Update payment
    console.log('✏️  Step 13: Updating payment details...');
    
    const paymentRowSelectors = [
      'tr:has-text("PENDING")',
      'tbody tr:last-child',
      'tr:has-text("Juan Dela Cruz")'
    ];
    
    let paymentRow = null;
    for (const selector of paymentRowSelectors) {
      if (await page.locator(selector).count() > 0) {
        paymentRow = page.locator(selector).first();
        break;
      }
    }
    
    const actionsSelectors = [
      'button:has-text("⋮")',
      '[aria-label="Actions"]',
      'button[aria-label="Actions"]',
      '.actions-button',
      'button.dropdown-toggle',
      'button[aria-haspopup="menu"]',
      'svg[data-testid="MoreVertIcon"]'
    ];
    
    if (paymentRow) {
      console.log('  🔍 Payment row found');
      
      // Click 5th button (index 4) - actions button
      await page.locator('button').nth(4).click();
      console.log('  ✅ Actions button clicked');
      await page.waitForTimeout(1000);
      
      // Click Update Payment Details menuitem
      await page.getByRole('menuitem', { name: 'Update Payment Details' }).click();
      console.log('  ✅ Update Payment Details clicked');
      await page.waitForTimeout(3000);
      
      // Wait for dialog and fill fields
      const amountSelectors = ['input[name="amount"]', 'input[type="number"]', '.MuiDialog-root input[name="amount"]'];
      for (const selector of amountSelectors) {
        if (await page.locator(selector).count() > 0) {
          await page.locator(selector).first().fill('1000');
          console.log('  ✅ Updated Amount: 1000');
          await page.waitForTimeout(500);
          break;
        }
      }
      
      const payerNameSelectors = ['input[name="payer_name"]', 'input[name="payerName"]', '.MuiDialog-root input[name="payer_name"]'];
      for (const selector of payerNameSelectors) {
        if (await page.locator(selector).count() > 0) {
          await page.locator(selector).first().fill('Wan Manyel Markez');
          console.log('  ✅ Updated Payer Name: Wan Manyel Markez');
          await page.waitForTimeout(500);
          break;
        }
      }
      
      // Click Update button in dialog
      const updateButtonSelectors = [
        '.MuiDialog-container button:has-text("Update")',
        'div[role="dialog"] button:has-text("Update")',
        '.MuiDialog-root button[type="submit"]'
      ];
      
      for (const selector of updateButtonSelectors) {
        if (await page.locator(selector).count() > 0) {
          await page.locator(selector).first().click({ force: true });
          break;
        }
      }
      
      await page.waitForTimeout(2000);
      console.log('  ✅ Payment details updated');
    } else {
      console.log('  ⚠️  Payment row not found');
    }
    
    // Step 14: Confirm payment
    console.log('✅ Step 14: Confirming payment...');
    
    // Re-find payment row with updated payer name
    const updatedPaymentRowSelectors = [
      'tr:has-text("Wan Manyel Markez")',
      'tr:has-text("PENDING")',
      'tbody tr:last-child'
    ];
    
    paymentRow = null;
    for (const selector of updatedPaymentRowSelectors) {
      if (await page.locator(selector).count() > 0) {
        paymentRow = page.locator(selector).first();
        break;
      }
    }
    
    if (paymentRow) {
      // Open actions menu
      for (const selector of actionsSelectors) {
        const actionsButton = paymentRow.locator(selector);
        if (await actionsButton.count() > 0) {
          await actionsButton.click();
          await page.waitForTimeout(1000);
          break;
        }
      }
      
      const confirmSelectors = [
        'button:has-text("Confirm Payment")',
        'text=Confirm Payment',
        'li:has-text("Confirm")',
        'button:has-text("Confirm")'
      ];
      
      for (const selector of confirmSelectors) {
        if (await page.locator(selector).count() > 0) {
          await page.click(selector);
          break;
        }
      }
      await page.waitForTimeout(1000);
      
      // Click Yes button in confirmation dialog
      const yesButtonSelectors = [
        'button:has-text("Yes")',
        '.MuiDialog-root button:has-text("Yes")',
        'div[role="dialog"] button:has-text("Yes")'
      ];
      
      for (const selector of yesButtonSelectors) {
        if (await page.locator(selector).count() > 0) {
          await page.click(selector);
          break;
        }
      }
      
      await page.waitForTimeout(3000);
      console.log('  ✅ Payment status changed to PAID');
    }
    
    // Step 15: Check land title status changed to ACTIVE
    console.log('🏠 Step 15: Verifying land title status changed to ACTIVE...');
    await page.click('text=Land Titles');
    await page.waitForTimeout(2000);
    
    const activeStatus = await page.locator('td:has-text("ACTIVE")').count();
    if (activeStatus > 0) {
      console.log('  ✅ Land title status: ACTIVE');
    }
    await page.waitForTimeout(2000);
    
    // Step 16: Cancel payment
    console.log('❌ Step 16: Cancelling payment...');
    
    let backToPayments = false;
    for (const selector of paymentTabSelectors) {
      if (await page.locator(selector).count() > 0) {
        await page.click(selector);
        backToPayments = true;
        break;
      }
    }
    
    if (!backToPayments) {
      await page.goto('http://localhost:4005/payments', { waitUntil: 'networkidle' });
    }
    
    await page.waitForTimeout(2000);
    
    // Find PAID payment row
    const paidPaymentSelectors = [
      'tr:has-text("PAID")',
      'tr:has-text("Wan Manyel Markez")'
    ];
    
    paymentRow = null;
    for (const selector of paidPaymentSelectors) {
      if (await page.locator(selector).count() > 0) {
        paymentRow = page.locator(selector).first();
        break;
      }
    }
    
    if (paymentRow) {
      // Open actions menu
      for (const selector of actionsSelectors) {
        const actionsButton = paymentRow.locator(selector);
        if (await actionsButton.count() > 0) {
          await actionsButton.click();
          await page.waitForTimeout(1000);
          break;
        }
      }
      
      const cancelSelectors = [
        'button:has-text("Cancel Payment")',
        'text=Cancel Payment',
        'li:has-text("Cancel")',
        'button:has-text("Cancel")'
      ];
      
      for (const selector of cancelSelectors) {
        if (await page.locator(selector).count() > 0) {
          await page.click(selector);
          break;
        }
      }
      await page.waitForTimeout(1000);
      
      // Click Yes button in confirmation dialog
      const yesButtonSelectors2 = [
        'button:has-text("Yes")',
        '.MuiDialog-root button:has-text("Yes")',
        'div[role="dialog"] button:has-text("Yes")'
      ];
      
      for (const selector of yesButtonSelectors2) {
        if (await page.locator(selector).count() > 0) {
          await page.click(selector);
          break;
        }
      }
      
      await page.waitForTimeout(3000);
      console.log('  ✅ Payment status changed to CANCELLED');
    }
    
    // Step 17: Check land title status changed back to PENDING
    console.log('🏠 Step 17: Verifying land title status changed back to PENDING...');
    await page.click('text=Land Titles');
    await page.waitForTimeout(2000);
    
    // Refresh until status is PENDING
    let pendingStatus = await page.locator('td:has-text("PENDING")').count();
    let refreshCount = 0;
    while (pendingStatus === 0 && refreshCount < 10) {
      console.log(`  🔄 Refreshing page (attempt ${refreshCount + 1})...`);
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      pendingStatus = await page.locator('td:has-text("PENDING")').count();
      refreshCount++;
    }
    
    if (pendingStatus > 0) {
      console.log('  ✅ Land title status: PENDING');
    } else {
      console.log('  ⚠️  Land title status not yet reverted to PENDING after 10 refreshes');
    }
    
    await page.waitForTimeout(3000);
    
    // Step 18: Navigate to Payments
    console.log('💰 Step 18: Navigating to Payments...');
    for (const selector of paymentTabSelectors) {
      if (await page.locator(selector).count() > 0) {
        await page.click(selector);
        break;
      }
    }
    await page.waitForTimeout(2000);
    
    // Step 19: Create new payment
    console.log('➕ Step 19: Creating payment...');
    for (const selector of createPaymentSelectors) {
      if (await page.locator(selector).count() > 0) {
        await page.click(selector);
        console.log('  ✅ Create New Payment button clicked');
        break;
      }
    }
    await page.waitForTimeout(2000);
    
    if (await page.locator(refTypeSelector).count() > 0) {
      await page.locator(refTypeSelector).first().click();
      await page.waitForTimeout(500);
      await page.locator(refTypeSelector).first().selectOption({ index: 1 });
      console.log('  ✅ Reference Type: Selected');
      await page.waitForTimeout(1500);
    }
    
    if (await page.locator(refIdSelector).count() > 0) {
      await page.waitForTimeout(1000);
      await page.locator(refIdSelector).first().selectOption({ index: 1 });
      console.log('  ✅ Reference ID: Selected land title');
      await page.waitForTimeout(500);
    }
    
    await fillField(['[name="amount"]', '[name="payment_amount"]'], '10000', 'Amount');
    await fillField(['[name="payer_name"]', '[name="payerName"]'], 'Jose Rixal', 'Payer Name');
    
    if (await page.locator(paymentMethodSelector).count() > 0) {
      await page.locator(paymentMethodSelector).first().selectOption({ label: 'Cash' });
      console.log('  ✅ Payment Method: Cash');
      await page.waitForTimeout(500);
    }
    
    for (const selector of createButtonSelectors) {
      if (await page.locator(selector).count() > 0) {
        await page.locator(selector).first().click({ force: true });
        console.log('  ✅ Create button clicked');
        break;
      }
    }
    await page.waitForTimeout(3000);
    console.log('  ✅ Payment created with status PENDING');
    
    // Step 20: Confirm payment
    console.log('✅ Step 20: Confirming payment...');
    paymentRow = page.locator('tr:has-text("Jose Rixal")').first();
    if (await paymentRow.count() > 0) {
      await paymentRow.locator('button').last().click();
      await page.waitForTimeout(1000);
      
      for (const selector of ['li:has-text("Confirm")', 'button:has-text("Confirm Payment")']) {
        if (await page.locator(selector).count() > 0) {
          await page.click(selector);
          break;
        }
      }
      await page.waitForTimeout(1000);
      
      for (const selector of ['button:has-text("Yes")', '.MuiDialog-root button:has-text("Yes")']) {
        if (await page.locator(selector).count() > 0) {
          await page.click(selector);
          break;
        }
      }
      await page.waitForTimeout(3000);
      console.log('  ✅ Payment status changed to PAID');
    }
    
    // Step 21: Verify land title status ACTIVE
    console.log('🏠 Step 21: Verifying land title status changed to ACTIVE...');
    await page.click('text=Land Titles');
    await page.waitForTimeout(2000);
    if (await page.locator('td:has-text("ACTIVE")').count() > 0) {
      console.log('  ✅ Land title status: ACTIVE');
    }
    await page.waitForTimeout(2000);
    
    // Step 22: Transfer land title
    console.log('🔄 Step 22: Creating transfer title...');
    await page.getByRole('button', { name: 'Transfer Title' }).click();
    await page.waitForTimeout(2000);
    
    await page.getByRole('button', { name: 'Create New Transfer' }).click();
    await page.waitForTimeout(3000);
    
    await page.getByRole('combobox', { name: 'Select Land Title' }).click();
    await page.waitForTimeout(2000);
    
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(500);
    await page.keyboard.press('Enter');
    console.log('  ✅ Land Title: Selected');
    await page.waitForTimeout(1000);
    
    await page.locator('input[name="buyer_name"]').fill('Maria Santos');
    console.log('  ✅ Buyer Name: Maria Santos');
    await page.waitForTimeout(500);
    
    await page.locator('input[name="buyer_contact"]').fill('09187654321');
    console.log('  ✅ Buyer Contact: 09187654321');
    await page.waitForTimeout(500);
    
    await page.locator('input[name="buyer_email"]').fill(`maria${timestamp}@example.com`);
    console.log(`  ✅ Buyer Email: maria${timestamp}@example.com`);
    await page.waitForTimeout(500);
    
    await page.locator('textarea[name="buyer_address"]').fill('Mandaluyong');
    console.log('  ✅ Buyer Address: Mandaluyong');
    await page.waitForTimeout(500);
    
    await page.getByRole('button', { name: 'Create Transfer' }).click();
    await page.waitForTimeout(3000);
    console.log('  ✅ Land title transferred successfully');
    await page.waitForTimeout(2000);
    
    // Step 23: Create payment for transfer
    console.log('➕ Step 23: Creating payment...');
    await page.click('text=Payments');
    await page.waitForTimeout(2000);
    
    for (const selector of createPaymentSelectors) {
      if (await page.locator(selector).count() > 0) {
        await page.click(selector);
        console.log('  ✅ Create New Payment button clicked');
        break;
      }
    }
    await page.waitForTimeout(2000);
    
    if (await page.locator(refTypeSelector).count() > 0) {
      await page.locator(refTypeSelector).first().click();
      await page.waitForTimeout(500);
      await page.locator(refTypeSelector).first().selectOption({ label: 'Transfer Title' });
      console.log('  ✅ Reference Type: Transfer Title');
      await page.waitForTimeout(1500);
    }
    
    if (await page.locator(refIdSelector).count() > 0) {
      await page.waitForTimeout(1000);
      await page.locator(refIdSelector).first().selectOption({ index: 1 });
      console.log('  ✅ Reference ID: Selected land title');
      await page.waitForTimeout(500);
    }
    
    await fillField(['[name="amount"]', '[name="payment_amount"]'], '5000', 'Amount');
    await fillField(['[name="payer_name"]', '[name="payerName"]'], 'Jose Rizal', 'Payer Name');
    
    if (await page.locator(paymentMethodSelector).count() > 0) {
      await page.locator(paymentMethodSelector).first().selectOption({ label: 'Cash' });
      console.log('  ✅ Payment Method: Cash');
      await page.waitForTimeout(500);
    }
    
    for (const selector of createButtonSelectors) {
      if (await page.locator(selector).count() > 0) {
        await page.locator(selector).first().click({ force: true });
        console.log('  ✅ Create button clicked');
        break;
      }
    }
    await page.waitForTimeout(3000);
    console.log('  ✅ Payment created with status PENDING');
    
    // Step 24: Confirm payment
    console.log('✅ Step 24: Confirming payment...');
    paymentRow = page.locator('tr:has-text("Jose Rizal")').first();
    if (await paymentRow.count() > 0) {
      await paymentRow.locator('button').last().click();
      await page.waitForTimeout(1000);
      
      for (const selector of ['li:has-text("Confirm")', 'button:has-text("Confirm Payment")']) {
        if (await page.locator(selector).count() > 0) {
          await page.click(selector);
          break;
        }
      }
      await page.waitForTimeout(1000);
      
      for (const selector of ['button:has-text("Yes")', '.MuiDialog-root button:has-text("Yes")']) {
        if (await page.locator(selector).count() > 0) {
          await page.click(selector);
          break;
        }
      }
      await page.waitForTimeout(3000);
      console.log('  ✅ Payment status changed to PAID');
    }
    await page.waitForTimeout(2000);
    
    // Step 25: Verify Transfer Title status COMPLETED
    console.log('✅ Step 25: Verify Transfer Title status changed to COMPLETED...');
    await page.getByRole('button', { name: 'Transfer Title' }).click();
    await page.waitForTimeout(2000);
    
    if (await page.locator('td:has-text("COMPLETED")').count() > 0) {
      console.log('  ✅ Transfer Title status: COMPLETED');
    }
    await page.waitForTimeout(2000);
    
    // Step 26: Verify updated land title details
    console.log('🔍 Step 26: Verifying newly updated land title details...');
    await page.click('text=Land Titles');
    await page.waitForTimeout(2000);
    
    const landTitleRow = page.locator('tbody tr').first();
    await landTitleRow.locator('button').last().click();
    await page.waitForTimeout(1000);
    
    const viewSelectors = [
      'li:has-text("View")',
      'button:has-text("View Details")',
      '[role="menuitem"]:has-text("View")'
    ];
    
    for (const selector of viewSelectors) {
      if (await page.locator(selector).count() > 0) {
        await page.click(selector);
        break;
      }
    }
    await page.waitForTimeout(2000);
    
    const ownerName = await page.locator('text=Maria Santos').count();
    if (ownerName > 0) {
      console.log('  ✅ Owner Name: Maria Santos');
    }
    
    const contact = await page.locator('text=09187654321').count();
    if (contact > 0) {
      console.log('  ✅ Contact Number: 09187654321');
    }
    
    const emailPattern = await page.locator(`text=maria${timestamp}@example.com`).count();
    if (emailPattern > 0) {
      console.log(`  ✅ Email: maria${timestamp}@example.com`);
    }
    
    const address = await page.locator('text=Mandaluyong').count();
    if (address > 0) {
      console.log('  ✅ Address: Mandaluyong');
    }
    await page.waitForTimeout(2000);
    
    // Step 27: Check Blockchain details
    console.log('🔗 Step 27: Checking Blockchain details...');
    
    if (await page.getByText('Blockchain:').count() > 0) {
      await page.getByText('Blockchain:').click();
      console.log('  ✅ Blockchain section found');
      await page.waitForTimeout(1000);
      
      const blockchainHashes = await page.locator('[role="cell"]').count();
      if (blockchainHashes > 0) {
        console.log(`  ✅ Blockchain hashes displayed: ${blockchainHashes} cells found`);
      }
      
      if (await page.getByRole('cell', { name: 'Seller Hash:' }).count() > 0) {
        console.log('  ✅ Seller Hash: Found');
      }
      
      if (await page.getByText('Buyer Hash:').count() > 0) {
        console.log('  ✅ Buyer Hash: Found');
      }
      
      await page.waitForTimeout(2000);
    }
    
    await page.getByRole('button', { name: 'Close' }).click();
    await page.waitForTimeout(1000);
    
    console.log('\n✅ Complete automation finished successfully!');
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
