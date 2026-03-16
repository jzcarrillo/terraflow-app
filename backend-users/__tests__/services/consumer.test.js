jest.mock('../../utils/rabbitmq', () => ({
  consume: jest.fn()
}));
jest.mock('../../services/users', () => ({
  createUser: jest.fn()
}));
jest.mock('../../utils/validation', () => ({
  checkEmailExists: jest.fn()
}));
jest.mock('../../config/constants', () => ({
  QUEUES: { USERS: 'queue_users' }
}));

const rabbitmq = require('../../utils/rabbitmq');
const userService = require('../../services/users');
const { checkEmailExists } = require('../../utils/validation');

describe('services/consumer', () => {
  let startConsumer, messageHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    rabbitmq.consume.mockImplementation(async (queue, handler) => {
      messageHandler = handler;
    });
    const consumer = require('../../services/consumer');
    startConsumer = consumer.startConsumer;
  });

  describe('startConsumer', () => {
    it('should start consuming from USERS queue', async () => {
      await startConsumer();
      expect(rabbitmq.consume).toHaveBeenCalledWith('queue_users', expect.any(Function));
    });

    it('should retry on failure', async () => {
      jest.useFakeTimers();
      rabbitmq.consume.mockRejectedValueOnce(new Error('Connection failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await startConsumer();

      expect(consoleSpy).toHaveBeenCalledWith('❌ Consumer start failed:', 'Connection failed');
      consoleSpy.mockRestore();
      jest.useRealTimers();
    });
  });

  describe('messageHandler', () => {
    beforeEach(async () => {
      await startConsumer();
    });

    it('should create user when user_data is present and email is new', async () => {
      checkEmailExists.mockResolvedValue(false);
      userService.createUser.mockResolvedValue({});

      await messageHandler({
        transaction_id: 'TXN-001',
        user_data: {
          email_address: 'test@example.com',
          username: 'testuser'
        }
      });

      expect(checkEmailExists).toHaveBeenCalledWith('test@example.com');
      expect(userService.createUser).toHaveBeenCalledWith({
        email_address: 'test@example.com',
        username: 'testuser',
        transaction_id: 'TXN-001',
        status: 'ACTIVE'
      });
    });

    it('should throw error if email already exists', async () => {
      checkEmailExists.mockResolvedValue(true);

      await expect(messageHandler({
        transaction_id: 'TXN-001',
        user_data: { email_address: 'existing@example.com', username: 'user' }
      })).rejects.toThrow('Email address existing@example.com already exists in database');

      expect(userService.createUser).not.toHaveBeenCalled();
    });

    it('should do nothing if no user_data', async () => {
      await messageHandler({ transaction_id: 'TXN-001' });

      expect(checkEmailExists).not.toHaveBeenCalled();
      expect(userService.createUser).not.toHaveBeenCalled();
    });
  });
});
