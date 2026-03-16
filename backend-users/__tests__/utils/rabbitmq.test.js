const mockChannel = {
  assertQueue: jest.fn(),
  consume: jest.fn(),
  ack: jest.fn(),
  nack: jest.fn(),
  close: jest.fn()
};
const mockConnection = {
  createChannel: jest.fn().mockResolvedValue(mockChannel),
  close: jest.fn()
};

jest.mock('amqplib', () => ({
  connect: jest.fn().mockResolvedValue(mockConnection)
}));

let rabbitmqService;

beforeEach(() => {
  jest.clearAllMocks();
  jest.resetModules();
  rabbitmqService = require('../../utils/rabbitmq');
  rabbitmqService.connection = null;
  rabbitmqService.channel = null;
});

describe('utils/rabbitmq', () => {
  describe('initialize', () => {
    it('should connect and create channel', async () => {
      await rabbitmqService.initialize();
      expect(rabbitmqService.connection).toBe(mockConnection);
      expect(rabbitmqService.channel).toBe(mockChannel);
    });

    it('should throw on connection failure', async () => {
      const amqp = require('amqplib');
      amqp.connect.mockRejectedValueOnce(new Error('Connection refused'));
      await expect(rabbitmqService.initialize()).rejects.toThrow('Connection refused');
    });
  });

  describe('consume', () => {
    it('should initialize if no channel and consume messages', async () => {
      await rabbitmqService.consume('test_queue', jest.fn());
      expect(mockChannel.assertQueue).toHaveBeenCalledWith('test_queue', { durable: true });
      expect(mockChannel.consume).toHaveBeenCalled();
    });

    it('should process message successfully', async () => {
      const handler = jest.fn();
      await rabbitmqService.consume('test_queue', handler);

      const callback = mockChannel.consume.mock.calls[0][1];
      const message = { content: Buffer.from(JSON.stringify({ test: true })) };
      await callback(message);

      expect(handler).toHaveBeenCalledWith({ test: true });
      expect(mockChannel.ack).toHaveBeenCalledWith(message);
    });

    it('should nack on handler error', async () => {
      const handler = jest.fn().mockRejectedValue(new Error('fail'));
      await rabbitmqService.consume('test_queue', handler);

      const callback = mockChannel.consume.mock.calls[0][1];
      const message = { content: Buffer.from('{"test":true}') };
      await callback(message);

      expect(mockChannel.nack).toHaveBeenCalledWith(message, false, true);
    });

    it('should skip null message', async () => {
      const handler = jest.fn();
      await rabbitmqService.consume('test_queue', handler);

      const callback = mockChannel.consume.mock.calls[0][1];
      await callback(null);

      expect(handler).not.toHaveBeenCalled();
    });

    it('should throw on consumer setup failure', async () => {
      rabbitmqService.channel = mockChannel;
      mockChannel.assertQueue.mockRejectedValueOnce(new Error('Queue error'));
      await expect(rabbitmqService.consume('bad_queue', jest.fn())).rejects.toThrow('Queue error');
    });
  });

  describe('close', () => {
    it('should close channel and connection', async () => {
      rabbitmqService.channel = mockChannel;
      rabbitmqService.connection = mockConnection;
      await rabbitmqService.close();
      expect(mockChannel.close).toHaveBeenCalled();
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('should handle close errors gracefully', async () => {
      rabbitmqService.channel = { close: jest.fn().mockRejectedValue(new Error('err')) };
      rabbitmqService.connection = null;
      await rabbitmqService.close(); // should not throw
    });

    it('should handle no channel/connection', async () => {
      await rabbitmqService.close(); // should not throw
    });
  });
});
