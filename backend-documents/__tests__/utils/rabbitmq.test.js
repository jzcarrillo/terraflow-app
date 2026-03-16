let mockChannel, mockConnection;

jest.mock('amqplib', () => ({
  connect: jest.fn()
}));

const amqp = require('amqplib');

beforeEach(() => {
  mockChannel = {
    assertQueue: jest.fn().mockResolvedValue({}),
    sendToQueue: jest.fn().mockReturnValue(true),
    consume: jest.fn().mockResolvedValue({}),
    ack: jest.fn(),
    nack: jest.fn(),
    close: jest.fn().mockResolvedValue(true)
  };
  mockConnection = {
    createChannel: jest.fn().mockResolvedValue(mockChannel),
    close: jest.fn().mockResolvedValue(true)
  };
  amqp.connect.mockResolvedValue(mockConnection);

  const rabbitmq = require('../../utils/rabbitmq');
  rabbitmq.connection = null;
  rabbitmq.channel = null;
});

describe('RabbitMQ Service', () => {
  describe('initialize', () => {
    it('should connect and create channel', async () => {
      const rabbitmq = require('../../utils/rabbitmq');
      await rabbitmq.initialize();
      expect(amqp.connect).toHaveBeenCalled();
      expect(rabbitmq.channel).toBe(mockChannel);
    });

    it('should handle connection error', async () => {
      amqp.connect.mockRejectedValueOnce(new Error('Connection failed'));
      const rabbitmq = require('../../utils/rabbitmq');
      await expect(rabbitmq.initialize()).rejects.toThrow('Connection failed');
    });
  });

  describe('publishToQueue', () => {
    it('should publish message to queue', async () => {
      const rabbitmq = require('../../utils/rabbitmq');
      await rabbitmq.publishToQueue('test_queue', { test: 'data' });
      expect(mockChannel.assertQueue).toHaveBeenCalledWith('test_queue', { durable: true });
      expect(mockChannel.sendToQueue).toHaveBeenCalled();
    });

    it('should auto-initialize if no channel', async () => {
      const rabbitmq = require('../../utils/rabbitmq');
      await rabbitmq.publishToQueue('test_queue', { data: 1 });
      expect(amqp.connect).toHaveBeenCalled();
    });

    it('should handle publish error', async () => {
      amqp.connect.mockRejectedValueOnce(new Error('Failed'));
      const rabbitmq = require('../../utils/rabbitmq');
      await expect(rabbitmq.publishToQueue('test', {})).rejects.toThrow();
    });
  });

  describe('consume', () => {
    it('should set up consumer', async () => {
      const rabbitmq = require('../../utils/rabbitmq');
      await rabbitmq.consume('test_queue', jest.fn());
      expect(mockChannel.assertQueue).toHaveBeenCalledWith('test_queue', { durable: true });
      expect(mockChannel.consume).toHaveBeenCalled();
    });

    it('should process message and ack', async () => {
      const rabbitmq = require('../../utils/rabbitmq');
      const handler = jest.fn().mockResolvedValue(true);

      mockChannel.consume.mockImplementation(async (queue, cb) => {
        await cb({ content: Buffer.from(JSON.stringify({ test: 1 })) });
      });

      await rabbitmq.consume('test_queue', handler);
      expect(handler).toHaveBeenCalledWith({ test: 1 });
      expect(mockChannel.ack).toHaveBeenCalled();
    });

    it('should nack on handler error', async () => {
      const rabbitmq = require('../../utils/rabbitmq');
      const handler = jest.fn().mockRejectedValue(new Error('Handler error'));

      mockChannel.consume.mockImplementation(async (queue, cb) => {
        await cb({ content: Buffer.from(JSON.stringify({ test: 1 })) });
      });

      await rabbitmq.consume('test_queue', handler);
      expect(mockChannel.nack).toHaveBeenCalled();
    });

    it('should skip null messages', async () => {
      const rabbitmq = require('../../utils/rabbitmq');
      const handler = jest.fn();

      mockChannel.consume.mockImplementation(async (queue, cb) => {
        await cb(null);
      });

      await rabbitmq.consume('test_queue', handler);
      expect(handler).not.toHaveBeenCalled();
    });

    it('should handle consumer setup error', async () => {
      amqp.connect.mockRejectedValueOnce(new Error('Setup failed'));
      const rabbitmq = require('../../utils/rabbitmq');
      await expect(rabbitmq.consume('test', jest.fn())).rejects.toThrow();
    });
  });

  describe('close', () => {
    it('should close channel and connection', async () => {
      const rabbitmq = require('../../utils/rabbitmq');
      rabbitmq.channel = mockChannel;
      rabbitmq.connection = mockConnection;
      await rabbitmq.close();
      expect(mockChannel.close).toHaveBeenCalled();
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('should handle close error gracefully', async () => {
      mockChannel.close.mockRejectedValue(new Error('Close error'));
      const rabbitmq = require('../../utils/rabbitmq');
      rabbitmq.channel = mockChannel;
      rabbitmq.connection = mockConnection;
      await expect(rabbitmq.close()).resolves.not.toThrow();
    });

    it('should handle close when no channel/connection', async () => {
      const rabbitmq = require('../../utils/rabbitmq');
      await expect(rabbitmq.close()).resolves.not.toThrow();
    });
  });
});
