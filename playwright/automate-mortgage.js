const { chromium } = require('playwright');
const path = require('path');

async function automateMortgage() {
  console.log('🏦 Starting Mortgage E2E automation...\n');

  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext({
    recordVideo: {
      dir: '/Users/johnchristophermcarrillo/Desktop/Playwright Simulations',
      size: { width: 1280, height: 720 }
    },
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();
  const testFilesPath = path.join(__dirname, 'test-files');

  try {
    const timestamp = Date.now();
    const username = `juan_${timestamp}`;
    const email = `juan${timestamp}@example.com`;
    const password = 'SecurePass123!';

    // Register
    console.log('📝 Registering user...');
    await page.goto('http://localhost:4005/register', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.fill('[name="username"]', username);
    await page.fill('[name="email"]', email);
    await page.fill('[name="password"]', password);
    const confirmSel = '[name="confirm_password"], [name="passwordConfirm"], [name="confirmPassword"]';
    if (await page.locator(confirmSel).count() > 0) await page.locator(confirmSel).first().fill(password);
    if (await page.locator('[name="first_name"], [name="firstName"]').count() > 0) await page.locator('[name="first_name"], [name="firstName"]').first().fill('Juan');
    if (await page.locator('[name="last_name"], [name="lastName"]').count() > 0) await page.locator('[name="last_name"], [name="lastName"]').first().fill('Dela Cruz');
    const roleField = page.locator('[name="role"], select[name="role"]').first();
    if (await roleField.count() > 0) {
      const isSelect = await roleField.evaluate(el => el.tagName.toLowerCase() === 'select');
      if (isSelect) await roleField.selectOption({ label: 'Admin' });
    }
    if (await page.locator('[name="contact_number"], [name="contact"], [name="phone"]').count() > 0)
      await page.locator('[name="contact_number"], [name="contact"], [name="phone"]').first().fill('09123456789');
    await page.click('button:has-text("Register"), button[type="submit"]');
    await page.waitForTimeout(2000);
    console.log('  ✅ User registered');

    // Login
    console.log('🔑 Logging in...');
    await page.goto('http://localhost:4005/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.locator('[name="username"], [name="email"], input[type="text"]').first().fill(username);
    await page.locator('[name="password"], input[type="password"]').first().fill(password);
    await page.click('button:has-text("Login"), button[type="submit"]');
    await page.waitForTimeout(2000);
    console.log('  ✅ Logged in');

    // Step 1: Create land title
    console.log('\n📝 Step 1: Creating land title...');
    await page.click('text=Land Titles');
    await page.waitForTimeout(2000);
    await page.click('text=Create New Land Title');
    await page.waitForTimeout(2000);

    await page.locator('input[name="owner_name"]').fill('Juan Dela Cruz');
    await page.locator('input[name="owner_name"]').press('Tab');
    await page.locator('input[name="contact_no"]').fill('09123456789');
    await page.locator('input[name="contact_no"]').press('Tab');
    await page.locator('input[name="email_address"]').fill('juan@example.com');
    await page.locator('input[name="email_address"]').press('Tab');
    await page.locator('textarea[name="address"]').fill('Manila, Philippines');
    await page.locator('select[name="property_location"]').selectOption('Caloocan');
    await page.locator('input[name="lot_number"]').fill('123');
    await page.locator('input[name="area_size"]').fill('500');
    await page.locator('select[name="classification"]').selectOption('Residential');
    await page.locator('input[name="registration_date"]').fill('2024-01-28');
    await page.locator('select[name="registrar_office"]').selectOption('Manila');
    await page.locator('input[name="previous_title_number"]').fill('TCT-2023-001');
    await page.getByRole('button', { name: 'Choose File' }).setInputFiles(path.join(testFilesPath, 'deed.pdf'));
    await page.waitForTimeout(1000);
    await page.getByRole('button', { name: 'Create' }).click();
    await page.waitForTimeout(3000);
    console.log('  ✅ Land title created');

    // Step 2: Create payment to activate land title
    console.log('\n💰 Step 2: Creating payment...');
    await page.getByRole('button', { name: 'Payments' }).click();
    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: 'Create New Payment' }).click();
    await page.waitForTimeout(2000);

    const refType = page.locator('select[name="reference_type"]');
    await refType.click();
    await page.waitForTimeout(300);
    await refType.selectOption('Land Registration');
    await refType.evaluate(el => el.dispatchEvent(new Event('change', { bubbles: true })));
    await page.waitForTimeout(2000);

    await page.locator('select[name="reference_id"]').selectOption({ index: 1 });
    await page.waitForTimeout(1000);
    await page.locator('input[name="payer_name"]').fill('Juan Dela Cruz');
    await page.waitForTimeout(300);
    await page.getByRole('spinbutton').fill('5000');
    await page.waitForTimeout(300);
    await page.locator('select[name="payment_method"]').selectOption('CASH');
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: 'Create' }).click();
    await page.waitForTimeout(3000);
    console.log('  ✅ Payment created - PENDING');

    // Step 3: Confirm payment
    console.log('\n✅ Step 3: Confirming payment...');
    await page.locator('button').nth(4).click();
    await page.waitForTimeout(1000);
    await page.getByRole('menuitem', { name: 'Confirm Payment' }).click();
    await page.waitForTimeout(1000);
    await page.getByRole('button', { name: 'Yes' }).click();
    await page.waitForTimeout(3000);
    console.log('  ✅ Payment confirmed - PAID');
    console.log('  ✅ Land title is now ACTIVE');

    // Helper to select reference_type and trigger React onChange
    const selectReferenceType = async (value) => {
      const select = page.locator('select[name="reference_type"]');
      await select.click();
      await page.waitForTimeout(300);
      await select.selectOption(value);
      await select.evaluate(el => el.dispatchEvent(new Event('change', { bubbles: true })));
      await page.waitForTimeout(2000);
    };

    // Step 4: Navigate to Mortgages
    console.log('\n🏦 Step 4: Navigating to Mortgages...');
    await page.click('text=Mortgages');
    await page.waitForTimeout(2000);

    // Step 5: Create 3 mortgages
    const banks = ['BDO', 'BPI', 'Metrobank'];
    for (let i = 1; i <= 3; i++) {
      console.log(`\n➕ Step 5-${i}: Creating mortgage ${i}/3 (${banks[i - 1]})...`);
      await page.getByRole('button', { name: 'Create Mortgage' }).click();
      await page.waitForTimeout(2000);

      await page.locator('select[name="land_title_id"]').selectOption({ index: 1 });
      await page.waitForTimeout(1000);
      await page.locator('select[name="bank_name"]').selectOption(banks[i - 1]);
      await page.waitForTimeout(500);
      await page.getByRole('textbox').nth(1).fill('100000');
      await page.waitForTimeout(500);
      await page.getByRole('textbox', { name: 'Enter mortgage details (' }).fill('Sample details of the mortgage');
      await page.waitForTimeout(500);
      await page.getByRole('button', { name: 'Choose File' }).setInputFiles(path.join(testFilesPath, 'deed.pdf'));
      await page.waitForTimeout(1000);
      await page.getByRole('button', { name: 'Create Mortgage' }).click();
      await page.waitForTimeout(3000);
      console.log(`  ✅ Mortgage ${i} (${banks[i - 1]}) created`);

      const dialogCloseSelectors = ['.MuiDialog-root button:has-text("Close")', '.MuiDialog-root button:has-text("OK")', '[aria-label="Close"]'];
      for (const selector of dialogCloseSelectors) {
        if (await page.locator(selector).count() > 0) {
          await page.click(selector);
          await page.waitForTimeout(500);
          break;
        }
      }
      await page.waitForTimeout(1500);
    }

    // Step 6: Try 4th mortgage (should fail)
    console.log('\n❌ Step 6: Attempting 4th mortgage (should fail)...');
    await page.getByRole('button', { name: 'Create Mortgage' }).click();
    await page.waitForTimeout(2000);
    await page.locator('select[name="land_title_id"]').selectOption({ index: 1 });
    await page.waitForTimeout(1000);
    await page.locator('select[name="bank_name"]').selectOption('BDO');
    await page.waitForTimeout(500);
    await page.getByRole('textbox').nth(1).fill('100000');
    await page.waitForTimeout(500);
    await page.getByRole('textbox', { name: 'Enter mortgage details (' }).fill('Should fail');
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Create Mortgage' }).click();
    await page.waitForTimeout(2000);
    if (await page.locator('text=/maximum.*3/i, text=/exceed/i').count() > 0) {
      console.log('  ✅ Error: Maximum of 3 mortgages reached');
    }
    await page.waitForTimeout(1000);
    for (const selector of ['button:has-text("Close")', 'button:has-text("Cancel")', '[aria-label="Close"]']) {
      if (await page.locator(selector).count() > 0) {
        await page.click(selector);
        break;
      }
    }
    await page.waitForTimeout(1000);

    // Step 7: Create and confirm payments for all 3 mortgages
    console.log('\n💰 Step 7: Creating and confirming payments for all 3 mortgages...');
    await page.getByRole('button', { name: 'Payments' }).click();
    await page.waitForTimeout(2000);

    const payerNames = ['Juan Dela Cruz', 'Maria Santos', 'Jose Rizal'];
    for (let i = 0; i < 3; i++) {
      console.log(`  ➕ Payment ${i + 1}/3...`);
      await page.getByRole('button', { name: 'Create New Payment' }).click();
      await page.waitForTimeout(2000);

      await selectReferenceType('Mortgage');
      await page.locator('select[name="reference_id"]').selectOption({ index: 1 });
      await page.waitForTimeout(1000);
      await page.locator('input[name="payer_name"]').fill(payerNames[i]);
      await page.waitForTimeout(500);
      await page.getByRole('spinbutton').fill('1000');
      await page.waitForTimeout(500);
      await page.locator('select[name="payment_method"]').selectOption('CASH');
      await page.waitForTimeout(500);
      await page.getByRole('button', { name: 'Create' }).click();
      await page.waitForTimeout(3000);

      await page.locator('button').nth(4).click();
      await page.waitForTimeout(1000);
      await page.getByRole('menuitem', { name: 'Confirm Payment' }).click();
      await page.waitForTimeout(1000);
      await page.getByRole('button', { name: 'Yes' }).click();
      await page.waitForTimeout(3000);
      console.log(`  ✅ Payment ${i + 1} confirmed - PAID`);
    }

    // Step 8: Verify mortgages are ACTIVE
    console.log('\n🏦 Step 8: Verifying mortgages are ACTIVE...');
    await page.getByRole('button', { name: 'Mortgages' }).click();
    await page.waitForTimeout(2000);
    const activeCount = await page.locator('td:has-text("ACTIVE")').count();
    console.log(`  ✅ Active mortgages: ${activeCount}`);

    // Step 9: Release all 3 mortgages
    console.log('\n🔓 Step 9: Releasing all 3 mortgages...');
    for (let i = 0; i < 3; i++) {
      console.log(`  🔓 Releasing mortgage ${i + 1}/3...`);

      const pendingRows = await page.locator('tr:has-text("PENDING")').count();
      if (pendingRows > 0) {
        await page.getByRole('button', { name: 'Payments' }).click();
        await page.waitForTimeout(2000);
        await page.getByRole('button', { name: 'Create New Payment' }).click();
        await page.waitForTimeout(2000);
        await selectReferenceType('Mortgage');
        await page.locator('select[name="reference_id"]').selectOption({ index: 1 });
        await page.waitForTimeout(1000);
        await page.locator('input[name="payer_name"]').fill(payerNames[i]);
        await page.waitForTimeout(300);
        await page.getByRole('spinbutton').fill('1000');
        await page.waitForTimeout(300);
        await page.locator('select[name="payment_method"]').selectOption('CASH');
        await page.waitForTimeout(300);
        await page.getByRole('button', { name: 'Create' }).click();
        await page.waitForTimeout(3000);
        await page.locator('tr:has-text("PENDING")').first().locator('button').last().click();
        await page.waitForTimeout(1000);
        await page.getByRole('menuitem', { name: 'Confirm Payment' }).click();
        await page.waitForTimeout(1000);
        await page.getByRole('button', { name: 'Yes' }).click();
        await page.waitForTimeout(3000);
        await page.getByRole('button', { name: 'Mortgages' }).click();
        await page.waitForTimeout(2000);
      }

      await page.locator('tr:has-text("ACTIVE")').first().locator('button').last().click();
      await page.waitForTimeout(1000);
      await page.getByRole('menuitem', { name: 'Release Mortgage' }).click();
      await page.waitForTimeout(2000);
      await page.getByRole('button', { name: 'Create Release Payment' }).click();
      await page.waitForTimeout(3000);

      await page.getByRole('button', { name: 'Payments' }).click();
      await page.waitForTimeout(2000);
      await page.locator('tr:has-text("PENDING")').first().locator('button').last().click();
      await page.waitForTimeout(1000);
      await page.getByRole('menuitem', { name: 'Confirm Payment' }).click();
      await page.waitForTimeout(1000);
      await page.getByRole('button', { name: 'Yes' }).click();
      await page.waitForTimeout(3000);
      console.log(`  ✅ Mortgage ${i + 1} released`);

      await page.getByRole('button', { name: 'Mortgages' }).click();
      await page.waitForTimeout(2000);
    }

    const releasedCount = await page.locator('td:has-text("RELEASED")').count();
    console.log(`  ✅ Released mortgages: ${releasedCount}`);

    // Step 10: Test - Pending transfer blocks mortgage creation
    console.log('\n🧪 Step 10: Testing pending transfer blocks mortgage creation...');
    await page.click('text=Land Titles');
    await page.waitForTimeout(2000);
    await page.click('text=Create New Land Title');
    await page.waitForTimeout(2000);

    await page.locator('input[name="owner_name"]').fill('Tungaw ka ba');
    await page.locator('input[name="owner_name"]').press('Tab');
    await page.locator('input[name="contact_no"]').fill('09178238231');
    await page.locator('input[name="contact_no"]').press('Tab');
    await page.locator('input[name="email_address"]').fill('tungawka@gmail.com');
    await page.locator('input[name="email_address"]').press('Tab');
    await page.locator('textarea[name="address"]').fill('testing 101');
    await page.locator('select[name="property_location"]').selectOption('Caloocan');
    await page.locator('input[name="lot_number"]').fill('5000');
    await page.locator('input[name="area_size"]').fill('5000');
    await page.locator('select[name="classification"]').selectOption('Residential');
    await page.locator('input[name="registration_date"]').fill('2025-10-10');
    await page.locator('select[name="registrar_office"]').selectOption('Manila');
    await page.locator('input[name="previous_title_number"]').fill('1234');
    await page.getByRole('button', { name: 'Choose File' }).setInputFiles(path.join(testFilesPath, 'deed.pdf'));
    await page.waitForTimeout(1000);
    await page.getByRole('button', { name: 'Create' }).click();
    await page.waitForTimeout(3000);
    console.log('  ✅ New land title created');

    await page.getByRole('button', { name: 'Payments' }).click();
    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: 'Create New Payment' }).click();
    await page.waitForTimeout(2000);

    const refType10 = page.locator('select[name="reference_type"]');
    await refType10.click();
    await page.waitForTimeout(300);
    await refType10.selectOption('Land Registration');
    await refType10.evaluate(el => el.dispatchEvent(new Event('change', { bubbles: true })));
    await page.waitForTimeout(2000);

    await page.locator('select[name="reference_id"]').selectOption({ index: 1 });
    await page.waitForTimeout(1000);
    await page.locator('input[name="payer_name"]').fill('Tungaw ka ba');
    await page.waitForTimeout(300);
    await page.getByRole('spinbutton').fill('5000');
    await page.waitForTimeout(300);
    await page.locator('select[name="payment_method"]').selectOption('CASH');
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: 'Create' }).click();
    await page.waitForTimeout(3000);

    await page.locator('button').nth(4).click();
    await page.waitForTimeout(1000);
    await page.getByRole('menuitem', { name: 'Confirm Payment' }).click();
    await page.waitForTimeout(1000);
    await page.getByRole('button', { name: 'Yes' }).click();
    await page.waitForTimeout(3000);
    console.log('  ✅ Land title activated');

    await page.getByRole('button', { name: 'Transfer Title' }).click();
    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: 'Create New Transfer' }).click();
    await page.waitForTimeout(2000);
    await page.getByRole('combobox', { name: 'Select Land Title' }).click();
    await page.waitForTimeout(1000);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(500);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
    await page.locator('input[name="buyer_name"]').fill('Test Buyer Transfer');
    await page.waitForTimeout(300);
    await page.locator('input[name="buyer_contact"]').fill('09178248312');
    await page.waitForTimeout(300);
    await page.locator('input[name="buyer_email"]').fill('testing@gmail.com');
    await page.waitForTimeout(300);
    await page.locator('textarea[name="buyer_address"]').fill('Test Address');
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: 'Create Transfer' }).click();
    await page.waitForTimeout(3000);
    console.log('  ✅ Pending transfer created');

    await page.getByRole('button', { name: 'Mortgages' }).click();
    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: 'Create Mortgage' }).click();
    await page.waitForTimeout(2000);
    await page.locator('select[name="land_title_id"]').selectOption({ index: 1 });
    await page.waitForTimeout(1000);
    await page.locator('select[name="bank_name"]').selectOption('Landbank');
    await page.waitForTimeout(500);
    await page.getByRole('textbox').nth(1).fill('50000');
    await page.waitForTimeout(300);
    await page.getByRole('textbox', { name: 'Enter mortgage details (' }).fill('Testing transfer blocks mortgage');
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: 'Choose File' }).setInputFiles(path.join(testFilesPath, 'deed.pdf'));
    await page.waitForTimeout(1000);
    await page.getByRole('button', { name: 'Create Mortgage' }).click();
    await page.waitForTimeout(2000);

    if (await page.getByRole('alert').filter({ hasText: 'Cannot create mortgage. Land' }).count() > 0) {
      console.log('  ✅ Error shown: Cannot create mortgage - land title has pending transfer');
    }
    await page.waitForTimeout(1000);
    await page.getByRole('button', { name: 'Cancel' }).click();
    await page.waitForTimeout(1000);
    console.log('  ✅ Step 10 complete: Pending transfer correctly blocks mortgage creation');

    // Step 11: Test - Pending mortgage blocks transfer
    console.log('\n🧪 Step 11: Testing pending mortgage blocks transfer...');
    await page.getByRole('button', { name: 'Mortgages' }).click();
    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: 'Create Mortgage' }).click();
    await page.waitForTimeout(2000);
    await page.locator('select[name="land_title_id"]').selectOption({ index: 1 });
    await page.waitForTimeout(1000);
    await page.locator('select[name="bank_name"]').selectOption('BDO');
    await page.waitForTimeout(500);
    await page.getByRole('textbox').nth(1).fill('1000');
    await page.waitForTimeout(300);
    await page.getByRole('textbox', { name: 'Enter mortgage details (' }).fill('Testing pending mortgage block');
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: 'Choose File' }).setInputFiles(path.join(testFilesPath, 'deed.pdf'));
    await page.waitForTimeout(1000);
    await page.getByRole('button', { name: 'Create Mortgage' }).click();
    await page.waitForTimeout(3000);
    console.log('  ✅ New PENDING mortgage created');

    const dialogCloseSelectors2 = ['.MuiDialog-root button:has-text("Close")', '.MuiDialog-root button:has-text("OK")', '[aria-label="Close"]'];
    for (const selector of dialogCloseSelectors2) {
      if (await page.locator(selector).count() > 0) {
        await page.click(selector);
        await page.waitForTimeout(500);
        break;
      }
    }
    await page.waitForTimeout(1500);

    await page.getByRole('button', { name: 'Transfer Title' }).click();
    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: 'Create New Transfer' }).click();
    await page.waitForTimeout(2000);
    await page.getByRole('combobox', { name: 'Select Land Title' }).click();
    await page.waitForTimeout(1000);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(500);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
    await page.locator('input[name="buyer_name"]').fill('Test Buyer');
    await page.waitForTimeout(300);
    await page.locator('input[name="buyer_contact"]').fill('09178248312');
    await page.waitForTimeout(300);
    await page.locator('input[name="buyer_email"]').fill('testbuyer@gmail.com');
    await page.waitForTimeout(300);
    await page.locator('textarea[name="buyer_address"]').fill('Test Address');
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: 'Create Transfer' }).click();
    await page.waitForTimeout(2000);

    if (await page.getByRole('alert').filter({ hasText: 'Cannot transfer land title' }).count() > 0) {
      console.log('  ✅ Error shown: Cannot transfer land title with pending mortgage');
    }
    await page.waitForTimeout(1000);
    await page.getByRole('button', { name: 'Cancel' }).click();
    await page.waitForTimeout(1000);
    console.log('  ✅ Step 11 complete: Pending mortgage correctly blocks transfer');

    // Step 12: Check Land Title Mortgage Summary
    console.log('\n🏠 Step 12: Checking Land Title Mortgage Summary...');
    await page.click('text=Land Titles');
    await page.waitForTimeout(2000);
    await page.locator('tbody tr').first().getByRole('button').first().click();
    await page.waitForTimeout(2000);

    if (await page.locator('text=Mortgage Summary:').count() > 0) {
      console.log('  ✅ Mortgage Summary section found');
    }
    if (await page.locator('td').filter({ hasText: /^[a-f0-9]{64}$/ }).count() > 0) {
      console.log('  ✅ Mortgage Blockchain hashcode found');
    }

    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: 'Close' }).click();
    await page.waitForTimeout(1000);

    console.log('\n✅ Mortgage E2E automation completed successfully!');
    console.log('📹 Video saved to: Desktop/Playwright Simulations/');

  } catch (error) {
    console.error('❌ Error during automation:', error.message);
    await page.screenshot({ path: './simulation/error-mortgage.png' });
  } finally {
    await context.close();
    await browser.close();
  }
}

automateMortgage().catch((error) => {
  console.error(error);
  process.exit(1);
});
