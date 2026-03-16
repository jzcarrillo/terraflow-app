const rabbitmqService = require('../publisher');

jest.mock('amqplib');
const amqp = require('amqplib');

describe('RabbitMQ Publisher Service', () => {
  let mockChannel, mockConnection;

  beforeEach(() => {
    mockChannel = {
      assertQueue: jest.fn().mockResolvedValue({}),
      sendToQueue: jest.fn().mockResolvedValue(true),
      close: jest.fn().mockResolvedValue(true)
    };
    
    mockConnection = {
      createChannel: jest.fn().mockResolvedValue(mockChannel),
      on: jest.fn(),
      close: jest.fn().mockResolvedValue(true),
      connection: { destroyed: false }
    };
    
    amqp.connect = jest.fn().mockResolvedValue(mockConnection);
    rabbitmqService.connection = null;
    rabbitmqService.channel = null;
  });

  describe('connect', () => {
    it('should connect successfully', async () => {
      const result = await rabbitmqService.connect();
      expect(result).toBe(true);
      expect(amqp.connect).toHaveBeenCalled();
    });

    it('should reuse existing connection', async () => {
      await rabbitmqService.connect();
      amqp.connect.mockClear();
      
      await rabbitmqService.connect();
      expect(amqp.connect).not.toHaveBeenCalled();
    });

    it('should reconnect if connection destroyed', async () => {
      await rabbitmqService.connect();
      rabbitmqService.connection.connection.destroyed = true;
      amqp.connect.mockClear();
      
      await rabbitmqService.connect();
      expect(amqp.connect).toHaveBeenCalled();
    });

    it('should handle connection error event', async () => {
      await rabbitmqService.connect();
      const errorHandler = mockConnection.on.mock.calls.find(call => call[0] === 'error')[1];
      
      errorHandler(new Error('Connection error'));
      expect(rabbitmqService.connection).toBeNull();
      expect(rabbitmqService.channel).toBeNull();
    });

    it('should handle connection error', async () => {
      amqp.connect.mockRejectedValue(new Error('Connection failed'));
      const result = await rabbitmqService.connect();
      expect(result).toBe(false);
    });
  });

  describe('publishToQueue', () => {
    it('should publish message successfully', async () => {
      const message = { test: 'data' };
      const result = await rabbitmqService.publishToQueue('test_queue', message);
      
      expect(result).toBe(true);
      expect(mockChannel.assertQueue).toHaveBeenCalledWith('test_queue', { durable: true });
      expect(mockChannel.sendToQueue).toHaveBeenCalled();
    });

    it('should handle publish error', async () => {
      amqp.connect.mockRejectedValue(new Error('Failed'));
      
      await expect(rabbitmqService.publishToQueue('test', {})).rejects.toThrow();
    });
  });

  describe('publishLandRegistryStatusUpdate', () => {
    it('should publish status update and log', async () => {
      const paymentData = { payment_id: 1, reference_id: 'REF-001' };
      const result = await rabbitmqService.publishLandRegistryStatusUpdate(paymentData);
      
      expect(result).toBe(true);
      expect(mockChannel.sendToQueue).toHaveBeenCalled();
    });

    it('should not log when result is falsy', async () => {
      const spy = jest.spyOn(rabbitmqService, 'publishToQueue').mockResolvedValue(false);
      const paymentData = { payment_id: 1, reference_id: 'REF-001' };
      const result = await rabbitmqService.publishLandRegistryStatusUpdate(paymentData);
      
      expect(result).toBe(false);
      spy.mockRestore();
    });

    it('should handle publish failure', async () => {
      mockChannel.sendToQueue.mockRejectedValue(new Error('Publish failed'));
      const paymentData = { payment_id: 1, reference_id: 'REF-001' };
      
      await expect(rabbitmqService.publishLandRegistryStatusUpdate(paymentData)).rejects.toThrow();
    });
  });

  describe('publishLandRegistryRevertUpdate', () => {
    it('should publish revert update and log', async () => {
      const paymentData = { payment_id: 1, reference_id: 'REF-001' };
      const result = await rabbitmqService.publishLandRegistryRevertUpdate(paymentData);
      
      expect(result).toBe(true);
      expect(mockChannel.sendToQueue).toHaveBeenCalled();
    });

    it('should not log when result is falsy', async () => {
      const spy = jest.spyOn(rabbitmqService, 'publishToQueue').mockResolvedValue(false);
      const paymentData = { payment_id: 1, reference_id: 'REF-001' };
      const result = await rabbitmqService.publishLandRegistryRevertUpdate(paymentData);
      
      expect(result).toBe(false);
      spy.mockRestore();
    });

    it('should handle publish failure', async () => {
      mockChannel.sendToQueue.mockRejectedValue(new Error('Publish failed'));
      const paymentData = { payment_id: 1, reference_id: 'REF-001' };
      
      await expect(rabbitmqService.publishLandRegistryRevertUpdate(paymentData)).rejects.toThrow();
    });
  });

  describe('close', () => {
    it('should close connections', async () => {
      rabbitmqService.channel = mockChannel;
      rabbitmqService.connection = mockConnection;
      
      await rabbitmqService.close();
      
      expect(mockChannel.close).toHaveBeenCalled();
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('should handle close errors gracefully', async () => {
      mockChannel.close.mockRejectedValue(new Error('Close error'));
      rabbitmqService.channel = mockChannel;
      rabbitmqService.connection = mockConnection;
      
      await expect(rabbitmqService.close()).resolves.not.toThrow();
    });
  });

  describe('initialize', () => {
    it('should initialize connection', async () => {
      await rabbitmqService.initialize();
      expect(amqp.connect).toHaveBeenCalled();
    });
  });
});
