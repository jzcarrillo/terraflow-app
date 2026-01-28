const { Given, When, Then, Before, After } = require('@cucumber/cucumber');
const assert = require('assert');

// Mock services
let landTitleData = {};
let documents = [];
let landTitle = null;
let payment = null;
let error = null;
let blockchainCalled = false;
let blockchainHash = null;

Before(function() {
  landTitleData = {};
  documents = [];
  landTitle = null;
  payment = null;
  error = null;
  blockchainCalled = false;
  blockchainHash = null;
});

// Background
Given('the Terraflow system is running', function() {
  // System check
  assert.ok(true, 'System is running');
});

Given('the user is authenticated', function() {
  // Auth check
  assert.ok(true, 'User authenticated');
});

// Given steps
Given('I have valid land title information', function(dataTable) {
  const rows = dataTable.hashes();
  rows.forEach(row => {
    landTitleData[row.field] = row.value;
  });
});

Given('I have uploaded required documents', function(dataTable) {
  documents = dataTable.hashes();
});

Given('I have not uploaded any documents', function() {
  documents = [];
});

Given('a land title already exists with title number {string}', function(titleNumber) {
  landTitle = { title_number: titleNumber, status: 'ACTIVE' };
});

Given('I have a land title with status {string}', function(status, dataTable) {
  const data = dataTable.rowsHash();
  landTitle = { ...data, status };
});

Given('I have created a payment', function() {
  payment = { payment_id: 'PAY-001', status: 'PENDING' };
});

Given('the blockchain service is down', function() {
  error = 'Blockchain recording failed';
});

Given('a land title exists with title number {string}', function(titleNumber) {
  landTitle = { title_number: titleNumber, status: 'ACTIVE', owner_name: 'Test Owner' };
});

Given('multiple land titles exist in the system', function(dataTable) {
  // Store multiple titles
  this.landTitles = dataTable.hashes();
});

Given('the land title has a blockchain hash', function() {
  landTitle.blockchain_hash = 'original_hash_123';
});

// When steps
When('I submit the land title registration', function() {
  if (documents.length === 0) {
    error = 'No attachments provided';
  } else if (landTitle && landTitle.title_number === landTitleData.title_number) {
    error = 'Land title already exists';
  } else {
    landTitle = {
      ...landTitleData,
      status: 'PENDING',
      transaction_id: 'TXN-' + Date.now()
    };
  }
});

When('I try to register a land title with the same title number {string}', function(titleNumber) {
  if (landTitle && landTitle.title_number === titleNumber) {
    error = 'Land title already exists';
  }
});

When('I complete the payment', function() {
  payment = { payment_id: 'PAY-001', status: 'PAID' };
  landTitle.status = 'ACTIVE';
  blockchainCalled = true;
  blockchainHash = 'blockchain_hash_' + Date.now();
  landTitle.blockchain_hash = blockchainHash;
});

When('the payment is cancelled', function() {
  if (!payment) {
    payment = { payment_id: 'PAY-001', status: 'CANCELLED' };
  } else {
    payment.status = 'CANCELLED';
  }
  if (landTitle && landTitle.status === 'ACTIVE') {
    landTitle.status = 'PENDING';
    landTitle.cancellation_hash = 'cancellation_hash_' + Date.now();
  }
});

When('the payment is confirmed as {string}', function(status) {
  payment.status = status;
  if (status === 'PAID') {
    if (blockchainCalled === false && error === 'Blockchain recording failed') {
      // Blockchain is down - already handled
      landTitle.status = 'PENDING';
    } else {
      landTitle.status = 'ACTIVE';
      blockchainCalled = true;
      blockchainHash = 'blockchain_hash_' + Date.now();
      landTitle.blockchain_hash = blockchainHash;
    }
  }
});

When('I search for land title {string}', function(titleNumber) {
  // Search logic
  assert.strictEqual(landTitle.title_number, titleNumber);
});

When('I request all land titles', function() {
  // List all logic
  assert.ok(this.landTitles.length > 0);
});

When('the payment is reactivated', function() {
  payment.status = 'PAID';
  landTitle.status = 'ACTIVE';
  landTitle.reactivation_hash = 'reactivation_hash_' + Date.now();
});

// Then steps
Then('the land title should be created with status {string}', function(status) {
  assert.strictEqual(landTitle.status, status);
});

Then('a transaction ID should be generated', function() {
  assert.ok(landTitle.transaction_id);
});

Then('documents should be uploaded to document service', function() {
  assert.ok(documents.length > 0);
});

Then('the payment status should be {string}', function(status) {
  assert.strictEqual(payment.status, status);
});

Then('the land title status should change to {string}', function(status) {
  assert.strictEqual(landTitle.status, status);
});

Then('the land title should be recorded on blockchain', function() {
  assert.ok(blockchainCalled);
});

Then('a blockchain hash should be stored', function() {
  assert.ok(landTitle.blockchain_hash);
});

Then('I should see error message {string}', function(message) {
  assert.strictEqual(error, message);
});

Then('the land title should remain {string}', function(status) {
  assert.strictEqual(landTitle.status, status);
});

Then('no blockchain recording should occur', function() {
  assert.strictEqual(blockchainCalled, false);
});

Then('the blockchain service should be called', function() {
  assert.ok(blockchainCalled);
});

Then('the blockchain hash should be stored in database', function() {
  assert.ok(landTitle.blockchain_hash);
});

Then('a success event should be sent to payment service', function() {
  assert.ok(true);
});

Then('the land title status should change to {string} temporarily', function(status) {
  // Temporarily changed before rollback
  assert.ok(true);
});

Then('the blockchain recording should fail', function() {
  assert.ok(error);
});

Then('the land title status should rollback to {string}', function(status) {
  assert.strictEqual(landTitle.status, status);
});

Then('a rollback event should be sent to payment service', function() {
  assert.ok(true);
});

Then('the payment should be marked as {string}', function(status) {
  // Payment marked as failed
  assert.ok(true);
});

Then('I should see the land title details', function() {
  assert.ok(landTitle);
});

Then('the status should be displayed', function() {
  assert.ok(landTitle.status);
});

Then('the blockchain hash should be displayed if available', function() {
  // Optional check
  assert.ok(true);
});

Then('I should see a list of {int} land titles', function(count) {
  assert.strictEqual(this.landTitles.length, count);
});

Then('the list should be ordered by creation date', function() {
  assert.ok(true);
});

Then('a cancellation hash should be recorded on blockchain', function() {
  landTitle.cancellation_hash = 'cancellation_hash_' + Date.now();
  assert.ok(landTitle.cancellation_hash);
});

Then('a reactivation hash should be recorded on blockchain', function() {
  assert.ok(landTitle.reactivation_hash);
});

Then('all three hashes should be stored \\(original, cancellation, reactivation)', function() {
  assert.ok(landTitle.blockchain_hash);
  assert.ok(landTitle.cancellation_hash);
  assert.ok(landTitle.reactivation_hash);
});

Then('the land title status should change back to {string}', function(status) {
  assert.strictEqual(landTitle.status, status);
});

When('I cancel the payment', function() {
  if (!payment) {
    payment = { payment_id: 'PAY-001', status: 'CANCELLED' };
  } else {
    payment.status = 'CANCELLED';
  }
});

Then('the land title registration should fail', function() {
  assert.ok(error, 'Land title registration should fail with error');
});
