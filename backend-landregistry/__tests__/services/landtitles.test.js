const landTitleService = require('../../services/landtitles');
const { pool } = require('../../config/db');
const rabbitmq = require('../../utils/rabbitmq');
const blockchainClient = require('../../services/blockchain-client');
const transactionManager = require('../../services/transaction-manager');
const paymentService = require('../../services/payments');
const { checkTitleExists, validateWithSchema } = require('../../utils/validation');

jest.mock('../../config/db');
jest.mock('../../utils/rabbitmq');
jest.mock('../../services/blockchain-client');
jest.mock('../../services/transaction-manager');
jest.mock('../../utils/validation');
jest.mock('../../schemas/landtitles', () => ({ landTitleSchema: {} }));

describe('Land Title Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic CRUD Operations', () => {
    it('should create land title successfully', async () => {
      const messageData = {
        transaction_id: 'TXN-001',
        land_title_data: { title_number: 'TCT-2024-001', owner_name: 'Juan Dela Cruz', contact_no: '09123456789', email_address: 'juan@test.com', address: 'Manila', property_location: 'Quezon City', area_size: 100, classification: 'Residential' },
        user_id: 'user1'
      };

      validateWithSchema.mockReturnValue(messageData.land_title_data);
      checkTitleExists.mockResolvedValue(false);
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1, ...messageData.land_title_data, status: 'PENDING' }] });
      rabbitmq.publishToQueue.mockResolvedValue();

      const result = await landTitleService.landTitleCreation(messageData);

      expect(result.title_number).toBe('TCT-2024-001');
      expect(result.owner_name).toBe('Juan Dela Cruz');
    });

    it('should generate title_number in correct format', async () => {
      const messageData = { transaction_id: 'TXN-001', land_title_data: { title_number: 'TCT-2024-12345', owner_name: 'Test Owner' }, user_id: 'user1' };

      validateWithSchema.mockReturnValue(messageData.land_title_data);
      checkTitleExists.mockResolvedValue(false);
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1, ...messageData.land_title_data }] });
      rabbitmq.publishToQueue.mockResolvedValue();

      const result = await landTitleService.landTitleCreation(messageData);

      expect(result.title_number).toMatch(/^TCT-\d{4}-\d+$/);
    });

    it('should set default status to PENDING', async () => {
      const messageData = { transaction_id: 'TXN-001', land_title_data: { title_number: 'TCT-001', owner_name: 'Owner' }, user_id: 'user1' };

      validateWithSchema.mockReturnValue(messageData.land_title_data);
      checkTitleExists.mockResolvedValue(false);
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1, ...messageData.land_title_data, status: 'PENDING' }] });
      rabbitmq.publishToQueue.mockResolvedValue();

      const result = await landTitleService.landTitleCreation(messageData);

      expect(result.status).toBe('PENDING');
    });

    it('should save 3 attachments correctly', async () => {
      const messageData = {
        transaction_id: 'TXN-001',
        land_title_data: { title_number: 'TCT-001', owner_name: 'Owner' },
        attachments: [{ filename: 'deed.pdf' }, { filename: 'tax.pdf' }, { filename: 'survey.pdf' }],
        user_id: 'user1'
      };

      validateWithSchema.mockReturnValue(messageData.land_title_data);
      checkTitleExists.mockResolvedValue(false);
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1, ...messageData.land_title_data, status: 'PENDING' }] });
      rabbitmq.publishToQueue.mockResolvedValue();

      await landTitleService.landTitleCreation(messageData);

      expect(rabbitmq.publishToQueue).toHaveBeenCalledWith('queue_documents', expect.objectContaining({ attachments: expect.arrayContaining([expect.objectContaining({ filename: 'deed.pdf' })]) }));
    });
  });

  describe('Business Rules', () => {
    it('should reject duplicate title_number', async () => {
      validateWithSchema.mockReturnValue({ title_number: 'TCT-001' });
      checkTitleExists.mockResolvedValue(true);

      await expect(landTitleService.landTitleCreation({ transaction_id: 'TXN-001', land_title_data: { title_number: 'TCT-001' }, user_id: 'user1' }))
        .rejects.toThrow('already exists');
    });

    it('should reject if required fields missing', async () => {
      validateWithSchema.mockImplementation(() => { throw new Error('Validation failed'); });

      await expect(landTitleService.landTitleCreation({ transaction_id: 'TXN-001', land_title_data: { title_number: '' }, user_id: 'user1' }))
        .rejects.toThrow('Validation failed');
    });
  });

  describe('Blockchain Integration', () => {
    it('should record blockchain hash when status is ACTIVE', async () => {
      const mockLandTitle = { id: 1, title_number: 'TCT-001', owner_name: 'Owner', property_location: 'Location', status: 'PENDING', transaction_id: 'TXN-001', created_at: new Date() };

      pool.query.mockResolvedValue({ rows: [mockLandTitle] });
      transactionManager.executeWithTransaction.mockImplementation(async (ops) => {
        const mockClient = { query: jest.fn().mockResolvedValue({ rows: [{ ...mockLandTitle, status: 'ACTIVE' }] }) };
        return await Promise.all(ops.map(op => op(mockClient)));
      });
      blockchainClient.recordLandTitle.mockResolvedValue({ success: true, blockchainHash: 'hash123' });
      rabbitmq.publishToQueue.mockResolvedValue();

      await paymentService.paymentStatusUpdate({ reference_id: 'TCT-001', status: 'ACTIVE' });

      expect(blockchainClient.recordLandTitle).toHaveBeenCalled();
    });

    it('should store blockchain hash in land_titles table', async () => {
      const mockLandTitle = { id: 1, title_number: 'TCT-001', owner_name: 'Owner', property_location: 'Location', status: 'PENDING', transaction_id: 'TXN-001', created_at: new Date() };

      pool.query.mockResolvedValue({ rows: [mockLandTitle] });
      transactionManager.executeWithTransaction.mockImplementation(async (ops) => {
        const mockClient = { query: jest.fn().mockResolvedValue({ rows: [{ ...mockLandTitle, status: 'ACTIVE' }] }) };
        return await Promise.all(ops.map(op => op(mockClient)));
      });
      blockchainClient.recordLandTitle.mockResolvedValue({ success: true, blockchainHash: 'stored-hash-456' });
      rabbitmq.publishToQueue.mockResolvedValue();

      await paymentService.paymentStatusUpdate({ reference_id: 'TCT-001', status: 'ACTIVE' });

      expect(pool.query).toHaveBeenCalledWith('UPDATE land_titles SET blockchain_hash = $1 WHERE title_number = $2', ['stored-hash-456', 'TCT-001']);
    });

    it('should not record blockchain if status is PENDING', async () => {
      validateWithSchema.mockReturnValue({ title_number: 'TCT-001', owner_name: 'Owner' });
      checkTitleExists.mockResolvedValue(false);
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1, title_number: 'TCT-001', status: 'PENDING' }] });
      rabbitmq.publishToQueue.mockResolvedValue();

      await landTitleService.landTitleCreation({ transaction_id: 'TXN-001', land_title_data: { title_number: 'TCT-001', owner_name: 'Owner' }, user_id: 'user1' });

      expect(blockchainClient.recordLandTitle).not.toHaveBeenCalled();
    });

    it('should display blockchain hash in land title details', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1, title_number: 'TCT-001', blockchain_hash: 'display-hash-789', status: 'ACTIVE' }] });

      const result = await landTitleService.getLandTitleById(1);

      expect(result.blockchain_hash).toBe('display-hash-789');
    });
  });

  describe('Payment Cancellation', () => {
    it('should revert status to PENDING when payment is cancelled', async () => {
      const mockLandTitle = { id: 1, title_number: 'TCT-001', status: 'ACTIVE', blockchain_hash: 'original-hash', transaction_id: 'TXN-001' };

      pool.query.mockResolvedValue({ rows: [mockLandTitle] });
      transactionManager.executeWithTransaction.mockImplementation(async (ops) => {
        const mockClient = { query: jest.fn().mockResolvedValue({ rows: [{ ...mockLandTitle, status: 'PENDING' }] }) };
        return await Promise.all(ops.map(op => op(mockClient)));
      });
      blockchainClient.recordCancellation.mockResolvedValue({ success: true, blockchainHash: 'cancellation-hash' });
      rabbitmq.publishToQueue.mockResolvedValue();

      const result = await paymentService.paymentStatusUpdate({ reference_id: 'TCT-001', status: 'PENDING' });

      expect(result.status).toBe('PENDING');
    });

    it('should record cancellation hash when payment is cancelled', async () => {
      const mockLandTitle = { id: 1, title_number: 'TCT-001', status: 'ACTIVE', blockchain_hash: 'original-hash', transaction_id: 'TXN-001' };

      pool.query.mockResolvedValue({ rows: [mockLandTitle] });
      transactionManager.executeWithTransaction.mockImplementation(async (ops) => {
        const mockClient = { query: jest.fn().mockResolvedValue({ rows: [{ ...mockLandTitle, status: 'PENDING' }] }) };
        return await Promise.all(ops.map(op => op(mockClient)));
      });
      blockchainClient.recordCancellation.mockResolvedValue({ success: true, blockchainHash: 'cancel-hash-123' });
      rabbitmq.publishToQueue.mockResolvedValue();

      await paymentService.paymentStatusUpdate({ reference_id: 'TCT-001', status: 'PENDING' });

      expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE land_titles SET cancellation_hash'), expect.arrayContaining(['cancel-hash-123']));
    });

    it('should display cancellation in blockchain history', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1, title_number: 'TCT-001', blockchain_hash: 'original-hash', cancellation_hash: 'cancellation-display-hash', status: 'PENDING' }] });

      const result = await landTitleService.getLandTitleById(1);

      expect(result.cancellation_hash).toBe('cancellation-display-hash');
    });
  });

  describe('Reactivation', () => {
    it('should reactivate land title when payment confirmed after cancellation', async () => {
      const mockLandTitle = { id: 1, title_number: 'TCT-001', owner_name: 'Owner', property_location: 'Location', status: 'PENDING', blockchain_hash: 'original-hash', cancellation_hash: 'cancel-hash', transaction_id: 'TXN-001', created_at: new Date() };

      pool.query.mockResolvedValue({ rows: [mockLandTitle] });
      transactionManager.executeWithTransaction.mockImplementation(async (ops) => {
        const mockClient = { query: jest.fn().mockResolvedValue({ rows: [{ ...mockLandTitle, status: 'ACTIVE' }] }) };
        return await Promise.all(ops.map(op => op(mockClient)));
      });
      blockchainClient.recordReactivation.mockResolvedValue({ success: true, blockchainHash: 'reactivation-hash' });
      rabbitmq.publishToQueue.mockResolvedValue();

      const result = await paymentService.paymentStatusUpdate({ reference_id: 'TCT-001', status: 'ACTIVE' });

      expect(result.status).toBe('ACTIVE');
      expect(blockchainClient.recordReactivation).toHaveBeenCalled();
    });

    it('should record reactivation hash when reactivated', async () => {
      const mockLandTitle = { id: 1, title_number: 'TCT-001', owner_name: 'Owner', property_location: 'Location', status: 'PENDING', blockchain_hash: 'original-hash', cancellation_hash: 'cancel-hash', transaction_id: 'TXN-001', created_at: new Date() };

      pool.query.mockResolvedValue({ rows: [mockLandTitle] });
      transactionManager.executeWithTransaction.mockImplementation(async (ops) => {
        const mockClient = { query: jest.fn().mockResolvedValue({ rows: [{ ...mockLandTitle, status: 'ACTIVE' }] }) };
        return await Promise.all(ops.map(op => op(mockClient)));
      });
      blockchainClient.recordReactivation.mockResolvedValue({ success: true, blockchainHash: 'reactivate-hash-456' });
      rabbitmq.publishToQueue.mockResolvedValue();

      await paymentService.paymentStatusUpdate({ reference_id: 'TCT-001', status: 'ACTIVE' });

      expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE land_titles SET reactivation_hash'), expect.arrayContaining(['reactivate-hash-456']));
    });
  });
});
