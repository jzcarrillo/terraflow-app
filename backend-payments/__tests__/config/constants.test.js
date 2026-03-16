const constants = require('../../config/constants');

describe('Constants', () => {
  it('should export TABLES', () => {
    expect(constants.TABLES.PAYMENTS).toBe('payments');
  });

  it('should export QUEUES', () => {
    expect(constants.QUEUES.PAYMENTS).toBe('queue_payments');
    expect(constants.QUEUES.LAND_REGISTRY).toBe('queue_landregistry');
    expect(constants.QUEUES.TRANSFERS).toBe('queue_transfers');
  });

  it('should export STATUS', () => {
    expect(constants.STATUS.PENDING).toBe('PENDING');
    expect(constants.STATUS.PAID).toBe('PAID');
    expect(constants.STATUS.CANCELLED).toBe('CANCELLED');
    expect(constants.STATUS.FAILED).toBe('FAILED');
  });

  it('should export PAYMENT_METHODS', () => {
    expect(constants.PAYMENT_METHODS.GCASH).toBe('GCASH');
    expect(constants.PAYMENT_METHODS.CREDIT_CARD).toBe('CREDIT_CARD');
  });
});
