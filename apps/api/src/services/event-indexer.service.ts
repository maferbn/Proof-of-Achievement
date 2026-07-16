import { ethers } from 'ethers';
import { PrismaClient } from '@prisma/client';
import { REPUTATION_BADGE_ABI } from '@repo/shared-types';
import { config } from '../config';

const prisma = new PrismaClient();

/**
 * Background service that polls blockchain events and synchronizes
 * BadgeAward status in the database automatically.
 *
 * Replaces the manual `/badge-awards/:id/verify-receipt` flow.
 *
 * Listens for:
 * - BadgeMinted(to, tokenId, tokenURI) → updates pending awards to confirmed
 * - BadgeRevoked(tokenId, owner) → updates confirmed awards to revoked
 */
export class EventIndexer {
  private provider: ethers.JsonRpcProvider;
  private contract: ethers.Contract;
  private pollingTimer: ReturnType<typeof setInterval> | null = null;
  private running = false;
  private lastProcessedBlock = 0;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(config.sepoliaRpcUrl);
    this.contract = new ethers.Contract(
      config.reputationBadgeContractAddress,
      REPUTATION_BADGE_ABI,
      this.provider
    );
  }

  /**
   * Start the indexer: process pending awards, then poll for new events.
   */
  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;

    console.log('[EventIndexer] Starting...');

    // 1. Process any awards that are still 'pending' from before the server started
    await this.processPendingAwards();

    // 2. Record the current block so we only look forward from here
    try {
      this.lastProcessedBlock = await this.provider.getBlockNumber();
      console.log(`[EventIndexer] Starting from block ${this.lastProcessedBlock}`);
    } catch (error) {
      console.error('[EventIndexer] Failed to get current block:', error);
      this.lastProcessedBlock = 0;
    }

    // 3. Start polling for new events
    this.pollingTimer = setInterval(
      () => this.pollNewEvents(),
      config.indexerPollingIntervalMs
    );

    console.log(
      `[EventIndexer] Polling every ${config.indexerPollingIntervalMs / 1000}s`
    );
  }

  /**
   * Stop the indexer gracefully.
   */
  stop(): void {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
    this.running = false;
    console.log('[EventIndexer] Stopped');
  }

  isRunning(): boolean {
    return this.running;
  }

  // ==================== Pending Awards ====================

  /**
   * On startup, check all pending BadgeAwards to see if their tx
   * has been confirmed or reverted while the server was offline.
   */
  private async processPendingAwards(): Promise<void> {
    const pendingAwards = await prisma.badgeAward.findMany({
      where: { status: 'pending', transactionHash: { not: null } },
    });

    if (pendingAwards.length === 0) {
      console.log('[EventIndexer] No pending awards to process');
      return;
    }

    console.log(
      `[EventIndexer] Processing ${pendingAwards.length} pending award(s)...`
    );

    for (const award of pendingAwards) {
      try {
        const receipt = await this.provider.getTransactionReceipt(
          award.transactionHash!
        );

        if (!receipt) continue; // tx not mined yet

        if (receipt.status === 1) {
          // Tx confirmed — try to extract tokenId from logs
          const tokenId = this.extractTokenIdFromReceipt(receipt);

          await prisma.badgeAward.update({
            where: { id: award.id },
            data: {
              status: 'confirmed',
              confirmedAt: new Date(),
              ...(tokenId !== null ? { onChainTokenId: tokenId } : {}),
            },
          });
          console.log(
            `[EventIndexer] Award ${award.id} confirmed (tokenId=${tokenId})`
          );
        } else {
          // Tx reverted
          await prisma.badgeAward.update({
            where: { id: award.id },
            data: {
              status: 'failed',
              failureReason: 'Transaction reverted on-chain',
            },
          });
          console.log(`[EventIndexer] Award ${award.id} reverted`);
        }
      } catch (error: any) {
        console.error(
          `[EventIndexer] Error processing award ${award.id}:`,
          error.message
        );
      }
    }
  }

  // ==================== Event Polling ====================

  /**
   * Poll for new BadgeMinted and BadgeRevoked events since the last processed block.
   */
  private async pollNewEvents(): Promise<void> {
    try {
      const currentBlock = await this.provider.getBlockNumber();

      if (currentBlock <= this.lastProcessedBlock) return;

      // Query BadgeMinted events from lastProcessedBlock+1 to currentBlock
      await this.processMintedEvents(this.lastProcessedBlock + 1, currentBlock);

      // Query BadgeRevoked events from lastProcessedBlock+1 to currentBlock
      await this.processRevokedEvents(this.lastProcessedBlock + 1, currentBlock);

      this.lastProcessedBlock = currentBlock;
    } catch (error: any) {
      console.error('[EventIndexer] Polling error:', error.message);
    }
  }

  /**
   * Process BadgeMinted events in a block range.
   * Matches events to pending BadgeAwards by transactionHash.
   */
  private async processMintedEvents(
    fromBlock: number,
    toBlock: number
  ): Promise<void> {
    try {
      const filter = this.contract.filters.BadgeMinted();
      const events = await this.contract.queryFilter(filter, fromBlock, toBlock);

      for (const event of events) {
        const args = (event as any).args;
        if (!args) continue;

        const to = args[0] as string;
        const tokenId = args[1] as bigint;
        const txHash = event.transactionHash;

        // Find the pending award for this tx
        const award = await prisma.badgeAward.findFirst({
          where: { transactionHash: txHash, status: 'pending' },
        });

        if (award) {
          await prisma.badgeAward.update({
            where: { id: award.id },
            data: {
              status: 'confirmed',
              confirmedAt: new Date(),
              onChainTokenId: tokenId,
            },
          });
          console.log(
            `[EventIndexer] BadgeMinted: award ${award.id} confirmed (tokenId=${tokenId}, to=${to})`
          );
        }
      }
    } catch (error: any) {
      console.error('[EventIndexer] Error processing minted events:', error.message);
    }
  }

  /**
   * Process BadgeRevoked events in a block range.
   * Matches events to BadgeAwards by onChainTokenId.
   */
  private async processRevokedEvents(
    fromBlock: number,
    toBlock: number
  ): Promise<void> {
    try {
      const filter = this.contract.filters.BadgeRevoked();
      const events = await this.contract.queryFilter(filter, fromBlock, toBlock);

      for (const event of events) {
        const args = (event as any).args;
        if (!args) continue;

        const tokenId = args[0] as bigint;

        // Find the award by tokenId
        const award = await prisma.badgeAward.findFirst({
          where: {
            onChainTokenId: tokenId,
            status: { not: 'revoked' },
          },
        });

        if (award) {
          await prisma.badgeAward.update({
            where: { id: award.id },
            data: {
              status: 'revoked',
              revokedAt: new Date(),
              failureReason: `Revoked on-chain. Tx: ${event.transactionHash}`,
            },
          });
          console.log(
            `[EventIndexer] BadgeRevoked: award ${award.id} revoked (tokenId=${tokenId})`
          );
        }
      }
    } catch (error: any) {
      console.error('[EventIndexer] Error processing revoked events:', error.message);
    }
  }

  // ==================== Helpers ====================

  /**
   * Extract tokenId from a BadgeMinted event in a transaction receipt.
   * Returns null if not found.
   */
  private extractTokenIdFromReceipt(
    receipt: ethers.TransactionReceipt
  ): bigint | null {
    try {
      const badgeMintedTopic = ethers.id(
        'BadgeMinted(address,uint256,string)'
      );

      for (const log of receipt.logs) {
        if (log.topics[0] === badgeMintedTopic) {
          // tokenId is the second indexed parameter (topics[2])
          return BigInt(log.topics[2]);
        }
      }
    } catch {
      // Could not parse logs
    }
    return null;
  }
}

export const eventIndexer = new EventIndexer();
