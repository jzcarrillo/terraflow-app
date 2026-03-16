const constants = require('../../config/constants');

describe('config/constants', () => {
  it('should export QUEUES with USERS', () => {
    expect(constants.QUEUES.USERS).toBe('queue_users');
  });

  it('should export TABLES with USERS', () => {
    expect(constants.TABLES.USERS).toBe('users');
  });

  it('should export STATUS with ACTIVE and FAILED', () => {
    expect(constants.STATUS.ACTIVE).toBe('ACTIVE');
    expect(constants.STATUS.FAILED).toBe('FAILED');
  });
});
