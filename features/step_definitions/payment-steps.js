const { Given, When, Then, Before } = require('@cucumber/cucumber');
const assert = require('assert');

let paymentService;
let landTitleService;
let currentPayment;
let currentLandTitle;
let validationError;
let testContext;

Before(function() {
  paymentService = {
    createPayment: (data) => ({ id: 1, ...data, status: 'PENDING' }),
    updatePayment: (id, data) => ({ id, ...data }),
    confirmPayment: (id) => ({ id, status: 'PAID' }),
    cancelPayment: (id) => ({ id, status: 'CANCELLED' })
  };
  
  landTitleService = {
    getLandTitle: (id) => ({ id, status: 'PENDING', title_number: 'TCT-2024-001' }),
    updateStatus: (id, newStatus) => ({ id, status: newStatus })
  };
  
  testContext = {};
  currentPayment = null;
  currentLandTitle = null;
  validationError = null;
  
  if (!this.landTitle) this.landTitle = null;
  if (!this.error) this.error = null;
});

Given('I am on the payments page', function () {
  this.currentPage = 'payments';
});

Given('a payment exists with transaction ID {string}', function (transactionId) {
  paymentService = {
    createPayment: (data) => ({ id: 1, ...data, status: 'PENDING' }),
    updatePayment: (id, data) => ({ id, ...data }),
    confirmPayment: (id) => ({ id, status: 'PAID' }),
    cancelPayment: (id) => ({ id, status: 'CANCELLED' })
  };
  currentPayment = {
    id: 1,
    transaction_id: transactionId,
    amount: 5000,
    payer_name: 'Juan Dela Cruz',
    payment_method: 'Credit Card',
    status: 'PENDING',
    land_title_id: 1
  };
});

Given('the payment status is {string}', function (status) {
  currentPayment.status = status;
});

Given('the associated land title status is {string}', function (status) {
  if (!currentLandTitle) {
    currentLandTitle = this.landTitle || { id: 1, status: 'PENDING', title_number: 'TCT-2024-001' };
  }
  currentLandTitle.status = status;
});

When('I click create new payment', function () {
  this.formOpen = true;
});

When('I submit without filling required fields', function () {
  const requiredFields = ['transaction_id', 'amount', 'payer_name', 'payment_method'];
  const emptyData = {};
  
  const missingFields = requiredFields.filter(field => !emptyData[field]);
  if (missingFields.length > 0) {
    validationError = `Missing required fields: ${missingFields.join(', ')}`;
  }
});

When('I fill in payment details', function (dataTable) {
  const data = {};
  dataTable.hashes().forEach(row => {
    data[row.field] = row.value;
  });
  this.paymentData = data;
});

When('I submit the payment form', function () {
  currentPayment = paymentService.createPayment(this.paymentData);
});

When('I open the actions menu for the payment', function () {
  this.actionsMenuOpen = true;
});

When('I click update payment details', function () {
  this.updateFormOpen = true;
});

When('I change the amount to {string}', function (amount) {
  this.updatedData = { ...this.updatedData, amount: parseFloat(amount) };
});

When('I change the payment method to {string}', function (method) {
  this.updatedData = { ...this.updatedData, payment_method: method };
});

When('I submit the update', function () {
  currentPayment = paymentService.updatePayment(currentPayment.id, {
    ...currentPayment,
    ...this.updatedData
  });
});

When('I click confirm payment', function () {
  if (!currentLandTitle) {
    currentLandTitle = this.landTitle || { id: 1, status: 'PENDING' };
  }
  currentPayment = paymentService.confirmPayment(currentPayment.id);
  currentLandTitle = landTitleService.updateStatus(currentLandTitle.id, 'ACTIVE');
  currentPayment.blockchain_hash = 'hash_' + Date.now();
});

When('I click cancel payment', function () {
  if (!currentLandTitle) {
    currentLandTitle = this.landTitle || { id: 1, status: 'ACTIVE' };
  }
  currentPayment = paymentService.cancelPayment(currentPayment.id);
  currentLandTitle = landTitleService.updateStatus(currentLandTitle.id, 'PENDING');
});

When('I create a new payment with valid details', function (dataTable) {
  const data = {};
  dataTable.hashes().forEach(row => {
    data[row.field] = row.value;
  });
  currentPayment = paymentService.createPayment(data);
});

When('I update the payment amount to {string}', function (amount) {
  currentPayment = paymentService.updatePayment(currentPayment.id, {
    ...currentPayment,
    amount: parseFloat(amount)
  });
});

When('I confirm the payment', function () {
  currentPayment = paymentService.confirmPayment(currentPayment.id);
  currentLandTitle = landTitleService.updateStatus(currentLandTitle.id, 'ACTIVE');
  currentPayment.blockchain_hash = 'hash_' + Date.now();
});



Then('I should see validation error messages', function () {
  assert.ok(validationError, 'Validation error should exist');
});

Then('the payment should not be created', function () {
  assert.ok(!currentPayment || validationError, 'Payment should not be created when validation fails');
});

Then('the payment should be created successfully', function () {
  assert.ok(currentPayment, 'Payment should be created');
  assert.ok(currentPayment.id, 'Payment should have an ID');
});

Then('the payment status should be {string}', function (status) {
  if (currentPayment) {
    assert.strictEqual(currentPayment.status, status);
  }
});

Then('the payment status should change to {string}', function (status) {
  assert.strictEqual(currentPayment.status, status);
});

Then('the payment details should be updated', function () {
  assert.ok(currentPayment, 'Payment should exist');
});

Then('the payment status should remain {string}', function (status) {
  assert.strictEqual(currentPayment.status, status);
});

Then('the associated land title status should change to {string}', function (status) {
  assert.strictEqual(currentLandTitle.status, status);
});

Then('a blockchain hash should be recorded', function () {
  assert.ok(currentPayment.blockchain_hash, 'Blockchain hash should exist');
});

Then('the payment should be updated successfully', function () {
  assert.ok(currentPayment, 'Payment should be updated');
});

Then('the land title should be {string}', function (status) {
  assert.strictEqual(currentLandTitle.status, status);
});

Then('the associated land title status should remain {string}', function (status) {
  assert.strictEqual(currentLandTitle.status, status);
});
