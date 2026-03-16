jest.mock('fabric-network', () => ({
  Gateway: jest.fn().mockImplementation(() => ({ disconnect: jest.fn() })),
  Wallets: { newFileSystemWallet: jest.fn().mockResolvedValue({}) }
}));
jest.mock('fabric-ca-client', () => jest.fn());

const mockBindAsync = jest.fn();
const mockStart = jest.fn();
const mockTryShutdown = jest.fn();
const mockAddService = jest.fn();

jest.mock('@grpc/grpc-js', () => ({
  Server: jest.fn().mockImplementation(() => ({
    addService: mockAddService,
    bindAsync: mockBindAsync,
    start: mockStart,
    tryShutdown: mockTryShutdown
  })),
  ServerCredentials: { createInsecure: jest.fn().mockReturnValue('insecure') },
  status: { INTERNAL: 13 },
  loadPackageDefinition: jest.fn().mockReturnValue({
    blockchain: { BlockchainService: { service: 'mockService' } }
  })
}));

jest.mock('@grpc/proto-loader', () => ({
  loadSync: jest.fn().mockReturnValue('packageDef')
}));

jest.mock('../../services/chaincode-service');

const ChaincodeService = require('../../services/chaincode-service');
const GrpcServer = require('../../services/grpc-server');

describe('services/grpc-server', () => {
  let server;
  let mockChaincodeService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockChaincodeService = {
      recordLandTitle: jest.fn().mockResolvedValue({ success: true }),
      recordCancellation: jest.fn().mockResolvedValue({ success: true }),
      recordReactivation: jest.fn().mockResolvedValue({ success: true }),
      recordTransfer: jest.fn().mockResolvedValue({ success: true }),
      getLandTitleHistory: jest.fn().mockResolvedValue({ success: true }),
      queryLandTitle: jest.fn().mockResolvedValue({ success: true }),
      getTransactionHistory: jest.fn().mockResolvedValue([]),
      recordMortgage: jest.fn().mockResolvedValue({ success: true }),
      recordMortgageRelease: jest.fn().mockResolvedValue({ success: true }),
      disconnect: jest.fn().mockResolvedValue()
    };
    ChaincodeService.mockImplementation(() => mockChaincodeService);
    server = new GrpcServer();
  });

  describe('initialize', () => {
    it('should load proto and add service', async () => {
      await server.initialize();
      expect(mockAddService).toHaveBeenCalledWith('mockService', expect.any(Object));
    });
  });

  describe('start', () => {
    it('should initialize and bind server', async () => {
      mockBindAsync.mockImplementation((addr, creds, cb) => cb(null, 50051));
      await server.start();
      expect(mockBindAsync).toHaveBeenCalledWith('0.0.0.0:50051', 'insecure', expect.any(Function));
      expect(mockStart).toHaveBeenCalled();
    });

    it('should handle bind error', async () => {
      mockBindAsync.mockImplementation((addr, creds, cb) => cb(new Error('bind fail')));
      const mockExit = jest.spyOn(process, 'exit').mockImplementation();
      jest.spyOn(console, 'error').mockImplementation();
      await server.start();
      expect(mockExit).toHaveBeenCalledWith(1);
      mockExit.mockRestore();
      jest.restoreAllMocks();
    });
  });

  describe('stop', () => {
    it('should disconnect and shutdown gracefully', async () => {
      mockTryShutdown.mockImplementation((cb) => cb(null));
      jest.spyOn(console, 'log').mockImplementation();
      await server.stop();
      expect(mockChaincodeService.disconnect).toHaveBeenCalled();
      expect(mockTryShutdown).toHaveBeenCalled();
      jest.restoreAllMocks();
    });

    it('should handle shutdown error', async () => {
      mockTryShutdown.mockImplementation((cb) => cb(new Error('shutdown err')));
      jest.spyOn(console, 'error').mockImplementation();
      await server.stop();
      jest.restoreAllMocks();
    });
  });

  describe('_createHandler', () => {
    it('should handle successful gRPC call', async () => {
      await server.initialize();
      const handlers = mockAddService.mock.calls[0][1];
      const call = { request: { title_number: 'TCT-001' } };
      const callback = jest.fn();
      await handlers.RecordLandTitle(call, callback);
      expect(callback).toHaveBeenCalledWith(null, { success: true });
    });

    it('should handle gRPC call error', async () => {
      mockChaincodeService.recordLandTitle.mockRejectedValue(new Error('service error'));
      await server.initialize();
      const handlers = mockAddService.mock.calls[0][1];
      const call = { request: { title_number: 'TCT-001' } };
      const callback = jest.fn();
      jest.spyOn(console, 'error').mockImplementation();
      await handlers.RecordLandTitle(call, callback);
      expect(callback).toHaveBeenCalledWith({ code: 13, message: 'service error' });
      jest.restoreAllMocks();
    });

    it('should handle GetTransactionHistory', async () => {
      mockChaincodeService.getTransactionHistory.mockResolvedValue([{ tx: '1' }]);
      await server.initialize();
      const handlers = mockAddService.mock.calls[0][1];
      const call = { request: { title_number: 'TCT-001' } };
      const callback = jest.fn();
      await handlers.GetTransactionHistory(call, callback);
      expect(callback).toHaveBeenCalledWith(null, { transactions: [{ tx: '1' }] });
    });

    it('should handle RecordCancellation', async () => {
      await server.initialize();
      const handlers = mockAddService.mock.calls[0][1];
      const callback = jest.fn();
      await handlers.RecordCancellation({ request: { title_number: 'T1' } }, callback);
      expect(callback).toHaveBeenCalledWith(null, { success: true });
    });

    it('should handle RecordReactivation', async () => {
      await server.initialize();
      const handlers = mockAddService.mock.calls[0][1];
      const callback = jest.fn();
      await handlers.RecordReactivation({ request: { title_number: 'T1' } }, callback);
      expect(callback).toHaveBeenCalledWith(null, { success: true });
    });

    it('should handle RecordTransfer', async () => {
      await server.initialize();
      const handlers = mockAddService.mock.calls[0][1];
      const callback = jest.fn();
      await handlers.RecordTransfer({ request: { title_number: 'T1' } }, callback);
      expect(callback).toHaveBeenCalledWith(null, { success: true });
    });

    it('should handle GetLandTitleHistory', async () => {
      await server.initialize();
      const handlers = mockAddService.mock.calls[0][1];
      const callback = jest.fn();
      await handlers.GetLandTitleHistory({ request: { title_number: 'T1' } }, callback);
      expect(callback).toHaveBeenCalledWith(null, { success: true });
    });

    it('should handle QueryLandTitle', async () => {
      await server.initialize();
      const handlers = mockAddService.mock.calls[0][1];
      const callback = jest.fn();
      await handlers.QueryLandTitle({ request: { title_number: 'T1' } }, callback);
      expect(callback).toHaveBeenCalledWith(null, { success: true });
    });

    it('should handle RecordMortgage', async () => {
      await server.initialize();
      const handlers = mockAddService.mock.calls[0][1];
      const callback = jest.fn();
      await handlers.RecordMortgage({ request: { mortgage_id: 1 } }, callback);
      expect(callback).toHaveBeenCalledWith(null, { success: true });
    });

    it('should handle RecordMortgageRelease', async () => {
      await server.initialize();
      const handlers = mockAddService.mock.calls[0][1];
      const callback = jest.fn();
      await handlers.RecordMortgageRelease({ request: { mortgage_id: 1 } }, callback);
      expect(callback).toHaveBeenCalledWith(null, { success: true });
    });
  });

  describe('error paths', () => {
    it('should handle initialize failure', async () => {
      const protoLoader = require('@grpc/proto-loader');
      protoLoader.loadSync.mockImplementationOnce(() => { throw new Error('proto fail'); });
      jest.spyOn(console, 'error').mockImplementation();
      await expect(server.initialize()).rejects.toThrow('proto fail');
      jest.restoreAllMocks();
    });

    it('should handle start failure when initialize throws', async () => {
      const protoLoader = require('@grpc/proto-loader');
      protoLoader.loadSync.mockImplementationOnce(() => { throw new Error('init fail'); });
      jest.spyOn(console, 'error').mockImplementation();
      await expect(server.start()).rejects.toThrow('init fail');
      jest.restoreAllMocks();
    });

    it('should handle stop error when disconnect throws', async () => {
      mockChaincodeService.disconnect.mockRejectedValue(new Error('disc fail'));
      jest.spyOn(console, 'error').mockImplementation();
      await server.stop();
      jest.restoreAllMocks();
    });
  });
});
