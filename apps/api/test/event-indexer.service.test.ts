// Define mock objects before jest.mock so they're in scope
const mockProvider = {
  getBlockNumber: jest.fn().mockResolvedValue(1000),
  getTransactionReceipt: jest.fn().mockResolvedValue(null),
};

const mockContract = {
  filters: {
    BadgeMinted: jest.fn().mockReturnValue({}),
    BadgeRevoked: jest.fn().mockReturnValue({}),
  },
  queryFilter: jest.fn().mockResolvedValue([]),
};

const mockBadgeAward = {
  findMany: jest.fn().mockResolvedValue([]),
  findFirst: jest.fn().mockResolvedValue(null),
  update: jest.fn().mockResolvedValue({}),
};

// Mock config before any imports
jest.mock('../src/config', () => ({
  config: {
    sepoliaRpcUrl: 'http://localhost:8545',
    reputationBadgeContractAddress: '0x1234567890123456789012345678901234567890',
    indexerPollingIntervalMs: 1000,
  },
}));

// Mock ethers
jest.mock('ethers', () => ({
  ethers: {
    JsonRpcProvider: jest.fn().mockImplementation(() => mockProvider),
    Contract: jest.fn().mockImplementation(() => mockContract),
    id: jest.fn().mockReturnValue('0xmockedtopic'),
  },
}));

// Mock PrismaClient
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    badgeAward: mockBadgeAward,
  })),
}));

import { EventIndexer } from '../src/services/event-indexer.service';

describe('EventIndexer', () => {
  let indexer: EventIndexer;

  beforeEach(() => {
    indexer = new EventIndexer();
    jest.clearAllMocks();
    mockProvider.getBlockNumber.mockResolvedValue(1000);
    mockProvider.getTransactionReceipt.mockResolvedValue(null);
    mockContract.queryFilter.mockResolvedValue([]);
    mockBadgeAward.findMany.mockResolvedValue([]);
  });

  afterEach(() => {
    indexer.stop();
  });

  describe('lifecycle', () => {
    it('should not be running initially', () => {
      expect(indexer.isRunning()).toBe(false);
    });

    it('should be running after start()', async () => {
      await indexer.start();
      expect(indexer.isRunning()).toBe(true);
    });

    it('should not be running after stop()', async () => {
      await indexer.start();
      indexer.stop();
      expect(indexer.isRunning()).toBe(false);
    });

    it('should not start twice', async () => {
      await indexer.start();
      await indexer.start();
      expect(indexer.isRunning()).toBe(true);
    });
  });

  describe('processPendingAwards', () => {
    it('should process pending awards with confirmed receipt', async () => {
      const pendingAward = {
        id: 'award-1',
        transactionHash: '0xabc123',
        status: 'pending',
        onChainTokenId: null,
      };

      mockBadgeAward.findMany.mockResolvedValue([pendingAward]);
      mockProvider.getTransactionReceipt.mockResolvedValue({
        status: 1,
        logs: [
          {
            topics: [
              '0xmockedtopic',
              '0x000000000000000000000000recipient',
              '0x0000000000000000000000000000000000000000000000000000000000000001',
            ],
          },
        ],
      });

      await indexer.start();

      expect(mockBadgeAward.update).toHaveBeenCalledWith({
        where: { id: 'award-1' },
        data: expect.objectContaining({
          status: 'confirmed',
          confirmedAt: expect.any(Date),
        }),
      });
    });

    it('should process pending awards with reverted receipt', async () => {
      const pendingAward = {
        id: 'award-2',
        transactionHash: '0xdef456',
        status: 'pending',
      };

      mockBadgeAward.findMany.mockResolvedValue([pendingAward]);
      mockProvider.getTransactionReceipt.mockResolvedValue({
        status: 0,
        logs: [],
      });

      await indexer.start();

      expect(mockBadgeAward.update).toHaveBeenCalledWith({
        where: { id: 'award-2' },
        data: expect.objectContaining({
          status: 'failed',
          failureReason: 'Transaction reverted on-chain',
        }),
      });
    });

    it('should skip awards with no receipt yet', async () => {
      const pendingAward = {
        id: 'award-3',
        transactionHash: '0x789',
        status: 'pending',
      };

      mockBadgeAward.findMany.mockResolvedValue([pendingAward]);
      mockProvider.getTransactionReceipt.mockResolvedValue(null);

      await indexer.start();

      expect(mockBadgeAward.update).not.toHaveBeenCalled();
    });
  });
});
