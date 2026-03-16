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
    it('should publish message', async () => {
      const rabbitmq = require('../../utils/rabbitmq');
      await rabbitmq.publishToQueue('test_queue', { test: 'data' });
      expect(mockChannel.assertQueue).toHaveBeenCalledWith('test_queue', { durable: true });
      expect(mockChannel.sendToQueue).toHaveBeenCalled();
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
        const msg = { content: Buffer.from(JSON.stringify({ test: 1 })) };
        await cb(msg);
      });

      await rabbitmq.consume('test_queue', handler);
      expect(handler).toHaveBeenCalledWith({ test: 1 });
      expect(mockChannel.ack).toHaveBeenCalled();
    });

    it('should nack on handler error', async () => {
      const rabbitmq = require('../../utils/rabbitmq');
      const handler = jest.fn().mockRejectedValue(new Error('Handler error'));

      mockChannel.consume.mockImplementation(async (queue, cb) => {
        const msg = { content: Buffer.from(JSON.stringify({ test: 1 })) };
        await cb(msg);
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

    it('should handle close error', async () => {
      mockChannel.close.mockRejectedValue(new Error('Close error'));
      const rabbitmq = require('../../utils/rabbitmq');
      rabbitmq.channel = mockChannel;
      rabbitmq.connection = mockConnection;
      await expect(rabbitmq.close()).resolves.not.toThrow();
    });
  });

  describe('processMessage', () => {
    it('should handle unknown event type', async () => {
      const rabbitmq = require('../../utils/rabbitmq');
      const result = await rabbitmq.processMessage({ event_type: 'UNKNOWN' });
      expect(result).toBeNull();
    });

    it('should route TRANSFER_CREATE', async () => {
      jest.mock('../../services/transfers', () => ({
        submitTransfer: jest.fn().mockResolvedValue({ transfer_id: 'TRF-001' }),
        getAllTransfers: jest.fn().mockResolvedValue([]),
        getTransferById: jest.fn().mockResolvedValue({ transfer_id: 'TRF-001' }),
        getTransferByTitleNumber: jest.fn().mockResolvedValue({ transfer_id: 'TRF-001' }),
        updateTransferStatus: jest.fn().mockResolvedValue({}),
        processPaymentConfirmed: jest.fn().mockResolvedValue({})
      }));

      const rabbitmq = require('../../utils/rabbitmq');
      const result = await rabbitmq.processMessage({ event_type: 'TRANSFER_CREATE', transfer_data: { title_number: 'TCT-001' } });
      expect(result).toBeDefined();
    });

    it('should route TRANSFER_GET_ALL', async () => {
      const rabbitmq = require('../../utils/rabbitmq');
      const result = await rabbitmq.processMessage({ event_type: 'TRANSFER_GET_ALL' });
      expect(result).toBeDefined();
    });

    it('should route TRANSFER_GET_BY_ID', async () => {
      const rabbitmq = require('../../utils/rabbitmq');
      const result = await rabbitmq.processMessage({ event_type: 'TRANSFER_GET_BY_ID', transfer_id: 'TRF-001' });
      expect(result).toBeDefined();
    });

    it('should route TRANSFER_COMPLETE', async () => {
      const rabbitmq = require('../../utils/rabbitmq');
      const result = await rabbitmq.processMessage({ event_type: 'TRANSFER_COMPLETE', transfer_id: 'TRF-001' });
      expect(result).toBeDefined();
    });

    it('should route PAYMENT_CONFIRMED', async () => {
      jest.resetModules();

      const mockPool = { query: jest.fn().mockResolvedValue({ rows: [] }) };

      jest.doMock('amqplib', () => ({
        connect: jest.fn().mockResolvedValue(mockConnection)
      }));
      jest.doMock('../../config/db', () => ({ pool: mockPool }));
      jest.doMock('../../services/blockchain-client', () => ({
        recordLandTitle: jest.fn()
      }));

      const rabbitmq = require('../../utils/rabbitmq');
      await rabbitmq.processMessage({ event_type: 'PAYMENT_CONFIRMED', title_number: 'TCT-001', payment_id: 'PAY-001' });
      expect(mockPool.query).toHaveBeenCalled();
    });
  });

  describe('processPaymentConfirmed', () => {
    it('should activate land title and record blockchain', async () => {
      jest.mock('../../config/db', () => ({
        pool: { query: jest.fn().mockResolvedValue({ rows: [{ id: 1, title_number: 'TCT-001', owner_name: 'Owner', property_location: 'Loc', transaction_id: 'TXN-001' }] }) }
      }));
      jest.mock('../../services/blockchain-client', () => ({
        recordLandTitle: jest.fn().mockResolvedValue({ success: true, blockchainHash: 'hash123' })
      }));

      const rabbitmq = require('../../utils/rabbitmq');
      await rabbitmq.initialize();

      await rabbitmq.processPaymentConfirmed({ title_number: 'TCT-001', payment_id: 'PAY-001' });

      const { pool } = require('../../config/db');
      expect(pool.query).toHaveBeenCalled();
    });

    it('should rollback on blockchain failure', async () => {
      jest.resetModules();

      const mockPool = { query: jest.fn() };
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: 1, title_number: 'TCT-001', owner_name: 'Owner', property_location: 'Loc', transaction_id: 'TXN-001' }] })
        .mockResolvedValueOnce({})
        .mockResolvedValue({});

      jest.doMock('amqplib', () => ({
        connect: jest.fn().mockResolvedValue(mockConnection)
      }));
      jest.doMock('../../config/db', () => ({ pool: mockPool }));
      jest.doMock('../../services/blockchain-client', () => ({
        recordLandTitle: jest.fn().mockRejectedValue(new Error('Blockchain down'))
      }));

      const rabbitmq = require('../../utils/rabbitmq');
      await rabbitmq.initialize();

      await expect(rabbitmq.processPaymentConfirmed({ title_number: 'TCT-001', payment_id: 'PAY-001' })).rejects.toThrow();
    });

    it('should throw when blockchain returns success without hash', async () => {
      jest.resetModules();

      const mockPool = { query: jest.fn() };
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: 1, title_number: 'TCT-001', owner_name: 'Owner', property_location: 'Loc', transaction_id: 'TXN-001' }] })
        .mockResolvedValue({});

      jest.doMock('amqplib', () => ({
        connect: jest.fn().mockResolvedValue(mockConnection)
      }));
      jest.doMock('../../config/db', () => ({ pool: mockPool }));
      jest.doMock('../../services/blockchain-client', () => ({
        recordLandTitle: jest.fn().mockResolvedValue({ success: true, blockchainHash: null })
      }));

      const rabbitmq = require('../../utils/rabbitmq');
      await rabbitmq.initialize();

      await expect(rabbitmq.processPaymentConfirmed({ title_number: 'TCT-001', payment_id: 'PAY-001' })).rejects.toThrow('Blockchain recording failed');
    });
  });

  describe('processTransferPaymentConfirmed', () => {
    it('should process transfer payment when PAID', async () => {
      jest.mock('../../services/transfers', () => ({
        getTransferById: jest.fn().mockResolvedValue({ transfer_id: 'TRF-001' }),
        getTransferByTitleNumber: jest.fn().mockResolvedValue(null),
        processPaymentConfirmed: jest.fn().mockResolvedValue({}),
        submitTransfer: jest.fn(),
        getAllTransfers: jest.fn().mockResolvedValue([]),
        updateTransferStatus: jest.fn()
      }));

      const rabbitmq = require('../../utils/rabbitmq');
      await rabbitmq.processMessage({
        event_type: 'TRANSFER_PAYMENT_CONFIRMED',
        transfer_id: 'TRF-001',
        title_number: 'TCT-001',
        payment_status: 'PAID'
      });

      const transfers = require('../../services/transfers');
      expect(transfers.processPaymentConfirmed).toHaveBeenCalled();
    });

    it('should skip if payment_status is not PAID', async () => {
      const rabbitmq = require('../../utils/rabbitmq');
      await rabbitmq.processMessage({
        event_type: 'TRANSFER_PAYMENT_CONFIRMED',
        transfer_id: 'TRF-001',
        title_number: 'TCT-001',
        payment_status: 'PENDING'
      });
    });

    it('should fallback to title_number lookup when transfer_id not found', async () => {
      jest.resetModules();

      jest.doMock('amqplib', () => ({
        connect: jest.fn().mockResolvedValue(mockConnection)
      }));
      jest.doMock('../../services/transfers', () => ({
        getTransferById: jest.fn().mockRejectedValue(new Error('Not found')),
        getTransferByTitleNumber: jest.fn().mockResolvedValue({ transfer_id: 'TRF-001' }),
        processPaymentConfirmed: jest.fn().mockResolvedValue({}),
        submitTransfer: jest.fn(),
        getAllTransfers: jest.fn(),
        updateTransferStatus: jest.fn()
      }));

      const rabbitmq = require('../../utils/rabbitmq');
      await rabbitmq.processMessage({
        event_type: 'TRANSFER_PAYMENT_CONFIRMED',
        transfer_id: 'TRF-001',
        title_number: 'TCT-001',
        payment_status: 'PAID'
      });

      const transfers = require('../../services/transfers');
      expect(transfers.getTransferByTitleNumber).toHaveBeenCalledWith('TCT-001');
      expect(transfers.processPaymentConfirmed).toHaveBeenCalled();
    });

    it('should throw when transfer not found by ID or title_number', async () => {
      jest.resetModules();

      jest.doMock('amqplib', () => ({
        connect: jest.fn().mockResolvedValue(mockConnection)
      }));
      jest.doMock('../../services/transfers', () => ({
        getTransferById: jest.fn().mockRejectedValue(new Error('Not found')),
        getTransferByTitleNumber: jest.fn().mockRejectedValue(new Error('Not found')),
        processPaymentConfirmed: jest.fn(),
        submitTransfer: jest.fn(),
        getAllTransfers: jest.fn(),
        updateTransferStatus: jest.fn()
      }));

      const rabbitmq = require('../../utils/rabbitmq');
      await expect(rabbitmq.processMessage({
        event_type: 'TRANSFER_PAYMENT_CONFIRMED',
        transfer_id: 'TRF-999',
        title_number: 'TCT-999',
        payment_status: 'PAID'
      })).rejects.toThrow('Transfer not found');
    });
  });

  describe('processMessage error handling', () => {
    it('should handle TRANSFER_CREATE error', async () => {
      jest.resetModules();

      jest.doMock('amqplib', () => ({
        connect: jest.fn().mockResolvedValue(mockConnection)
      }));
      jest.doMock('../../services/transfers', () => ({
        submitTransfer: jest.fn().mockRejectedValue(new Error('Create failed')),
        getAllTransfers: jest.fn(),
        getTransferById: jest.fn(),
        getTransferByTitleNumber: jest.fn(),
        updateTransferStatus: jest.fn(),
        processPaymentConfirmed: jest.fn()
      }));

      const rabbitmq = require('../../utils/rabbitmq');
      await expect(rabbitmq.processMessage({ event_type: 'TRANSFER_CREATE', transfer_data: {} })).rejects.toThrow('Create failed');
    });

    it('should handle TRANSFER_GET_ALL error', async () => {
      jest.resetModules();

      jest.doMock('amqplib', () => ({
        connect: jest.fn().mockResolvedValue(mockConnection)
      }));
      jest.doMock('../../services/transfers', () => ({
        submitTransfer: jest.fn(),
        getAllTransfers: jest.fn().mockRejectedValue(new Error('Get all failed')),
        getTransferById: jest.fn(),
        getTransferByTitleNumber: jest.fn(),
        updateTransferStatus: jest.fn(),
        processPaymentConfirmed: jest.fn()
      }));

      const rabbitmq = require('../../utils/rabbitmq');
      await expect(rabbitmq.processMessage({ event_type: 'TRANSFER_GET_ALL' })).rejects.toThrow('Get all failed');
    });

    it('should handle TRANSFER_GET_BY_ID error', async () => {
      jest.resetModules();

      jest.doMock('amqplib', () => ({
        connect: jest.fn().mockResolvedValue(mockConnection)
      }));
      jest.doMock('../../services/transfers', () => ({
        submitTransfer: jest.fn(),
        getAllTransfers: jest.fn(),
        getTransferById: jest.fn().mockRejectedValue(new Error('Get by ID failed')),
        getTransferByTitleNumber: jest.fn(),
        updateTransferStatus: jest.fn(),
        processPaymentConfirmed: jest.fn()
      }));

      const rabbitmq = require('../../utils/rabbitmq');
      await expect(rabbitmq.processMessage({ event_type: 'TRANSFER_GET_BY_ID', transfer_id: 'TRF-001' })).rejects.toThrow('Get by ID failed');
    });

    it('should handle TRANSFER_COMPLETE error', async () => {
      jest.resetModules();

      jest.doMock('amqplib', () => ({
        connect: jest.fn().mockResolvedValue(mockConnection)
      }));
      jest.doMock('../../services/transfers', () => ({
        submitTransfer: jest.fn(),
        getAllTransfers: jest.fn(),
        getTransferById: jest.fn(),
        getTransferByTitleNumber: jest.fn(),
        updateTransferStatus: jest.fn().mockRejectedValue(new Error('Complete failed')),
        processPaymentConfirmed: jest.fn()
      }));

      const rabbitmq = require('../../utils/rabbitmq');
      await expect(rabbitmq.processMessage({ event_type: 'TRANSFER_COMPLETE', transfer_id: 'TRF-001' })).rejects.toThrow('Complete failed');
    });
  });
});
