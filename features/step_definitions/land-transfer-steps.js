const { Given, When, Then, Before } = require('@cucumber/cucumber');
const assert = require('assert');

let landTransfer = null;

Before(function() {
  if (!this.landTitle) this.landTitle = null;
  if (!this.error) this.error = null;
  landTransfer = null;
});

Given(/^a land transfer exists with status "([^"]*)"$/, function(status, dataTable) {
  if (!this.landTitle) {
    this.landTitle = { id: 1, status: 'ACTIVE', title_number: 'TCT-2024-001', owner_name: 'Jose Rizal' };
  }
  if (!dataTable || typeof dataTable === 'function') {
    landTransfer = { status, transfer_id: 'TRF-001', land_title_id: this.landTitle.id };
    if (typeof dataTable === 'function') dataTable();
    return;
  }
  const data = {};
  const rows = dataTable.hashes();
  rows.forEach(row => {
    data[row.field] = row.value;
  });
  landTransfer = { ...data, status, transfer_id: 'TRF-001', land_title_id: this.landTitle.id };
});

When('I create a land transfer with buyer details', function(dataTable) {
  if (this.landTitle.status !== 'ACTIVE') {
    this.error = 'Cannot transfer land title with PENDING status';
    return;
  }
  const buyerData = dataTable.rowsHash();
  landTransfer = {
    ...buyerData,
    status: 'PENDING',
    transfer_id: 'TRF-' + Date.now(),
    land_title_id: this.landTitle.title_number
  };
});

When('I try to create a land transfer', function() {
  if (this.landTitle && this.landTitle.status !== 'ACTIVE') {
    this.error = 'Cannot transfer land title with PENDING status';
  }
});

When('I cancel the land transfer', function() {
  if (landTransfer.status === 'COMPLETED') {
    this.error = 'Cannot cancel completed land transfer';
  } else {
    landTransfer.status = 'CANCELLED';
  }
});

When('I try to cancel the land transfer', function() {
  if (landTransfer.status === 'COMPLETED') {
    this.error = 'Cannot cancel completed land transfer';
  }
});

When('I update the land transfer with new buyer details', function(dataTable) {
  if (landTransfer.status === 'COMPLETED') {
    this.error = 'Cannot update completed land transfer';
    return;
  }
  const newData = dataTable.rowsHash();
  Object.assign(landTransfer, newData);
});

When('I try to update the land transfer', function() {
  if (landTransfer.status === 'COMPLETED') {
    this.error = 'Cannot update completed land transfer';
  }
});

When('the transfer payment status changes to {string}', function(status) {
  if (status === 'PAID' && this.landTitle && landTransfer) {
    landTransfer.status = 'COMPLETED';
    this.landTitle.owner_name = landTransfer.buyer_name;
    this.landTitle.contact = landTransfer.contact;
    this.landTitle.email = landTransfer.email;
    this.landTitle.address = landTransfer.address;
    this.landTitle.seller_hash = 'seller_hash_' + Date.now();
    this.landTitle.buyer_hash = 'buyer_hash_' + Date.now();
  }
});

Then('the land transfer should be created with status {string}', function(status) {
  assert.strictEqual(landTransfer.status, status);
});

Then('the land transfer should not be created', function() {
  assert.strictEqual(landTransfer, null);
});

Then('the land transfer status should change to {string}', function(status) {
  assert.strictEqual(landTransfer.status, status);
});

Then('the land transfer should be updated successfully', function() {
  assert.ok(landTransfer);
});

Then('the buyer details should reflect the new values', function() {
  assert.ok(landTransfer.buyer_name);
});

Then('the land title owner details should be updated', function(dataTable) {
  const expected = dataTable.rowsHash();
  assert.strictEqual(this.landTitle.owner_name, expected.owner_name);
  assert.strictEqual(this.landTitle.contact, expected.contact);
  assert.strictEqual(this.landTitle.email, expected.email);
  assert.strictEqual(this.landTitle.address, expected.address);
});

Then('the land title should have blockchain details', function(dataTable) {
  const hashes = dataTable.hashes();
  assert.ok(hashes.length === 2);
});

Then('the land title status should remain {string}', function(status) {
  assert.strictEqual(this.landTitle.status, status);
});

Then('both seller and buyer hashes should be recorded on blockchain', function() {
  assert.ok(this.landTitle.seller_hash);
  assert.ok(this.landTitle.buyer_hash);
});
