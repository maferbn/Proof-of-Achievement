import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest, authMiddleware, checkOwnership } from '../middleware/auth.middleware';
import { relayerService } from '../services/relayer.service';
import { ethers } from 'ethers';
import { config } from '../config';

const router = Router();
const prisma = new PrismaClient();
const provider = new ethers.JsonRpcProvider(config.sepoliaRpcUrl);

/**
 * POST /badge-definitions
 * Create a badge template for an admin's group
 */
router.post('/badge-definitions', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const adminId = req.adminId!;
    const { groupId, name, description, imageURI } = req.body;

    if (!groupId || !name) {
      return res.status(400).json({ error: 'Missing "groupId" or "name"' });
    }

    // Check group ownership
    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group || !checkOwnership(group.adminId, adminId)) {
      return res.status(403).json({ error: 'Not authorized to create badges for this group' });
    }

    const badgeDef = await prisma.badgeDefinition.create({
      data: {
        adminId,
        groupId,
        name,
        description: description || null,
        imageURI: imageURI || null,
      },
    });

    res.status(201).json(badgeDef);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Badge name already exists for this group' });
    }
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /badge-definitions/:id
 * Get badge definition details (public)
 */
router.get('/badge-definitions/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const badgeDef = await prisma.badgeDefinition.findUnique({
      where: { id },
      include: {
        _count: { select: { badgeAwards: true } },
      },
    });

    if (!badgeDef) {
      return res.status(404).json({ error: 'Badge definition not found' });
    }

    res.json(badgeDef);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /badge-definitions/:id/award
 * CRITICAL ENDPOINT: Award a badge to a member
 *
 * Validation flow:
 * 1. Admin owns this badge definition's group
 * 2. Member belongs to that group
 * 3. Relayer wallet is active (MINTER_ROLE granted)
 * 4. Member hasn't already received this exact badge
 * 5. If all pass: mint on-chain, then save BadgeAward to DB
 */
router.post('/badge-definitions/:id/award', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const adminId = req.adminId!;
    const { id: badgeDefId } = req.params;
    const { memberId } = req.body;

    if (!memberId) {
      return res.status(400).json({ error: 'Missing "memberId"' });
    }

    // 1. Get badge definition and check admin ownership
    const badgeDef = await prisma.badgeDefinition.findUnique({
      where: { id: badgeDefId },
      include: { group: true },
    });

    if (!badgeDef) {
      return res.status(404).json({ error: 'Badge definition not found' });
    }

    if (!checkOwnership(badgeDef.adminId, adminId)) {
      return res.status(403).json({ error: 'Not authorized to award this badge' });
    }

    // 2. Check member belongs to the group
    const member = await prisma.member.findUnique({
      where: { id: memberId },
    });

    if (!member || member.groupId !== badgeDef.groupId) {
      return res.status(403).json({ error: 'Member does not belong to the required group' });
    }

    // 3. Check relayer wallet is active
    const relayerWallet = await prisma.relayerWallet.findUnique({
      where: { adminId },
    });

    if (!relayerWallet || !relayerWallet.isActive) {
      return res.status(400).json({
        error: 'Relayer wallet not active. Initialize MINTER_ROLE first.',
      });
    }

    // 4. Check member hasn't already received this badge
    const existingAward = await prisma.badgeAward.findUnique({
      where: {
        memberId_badgeDefinitionId: {
          memberId,
          badgeDefinitionId: badgeDefId,
        },
      },
    });

    if (existingAward) {
      return res.status(409).json({ error: 'Member has already received this badge' });
    }

    // 5. Mint on-chain
    let transactionHash: string;
    let expectedTokenId: bigint;

    try {
      const metadataURI = badgeDef.imageURI || 'ipfs://default-metadata'; // Use badge's imageURI or default
      const result = await relayerService.mintBadge(adminId, member.walletAddress, metadataURI);
      transactionHash = result.transactionHash;
      expectedTokenId = result.expectedTokenId;
    } catch (blockchainError: any) {
      console.error('Blockchain minting failed:', blockchainError);
      return res.status(400).json({
        error: 'Failed to mint badge on-chain',
        details: blockchainError.message,
      });
    }

    // 6. Save BadgeAward to database (optimistic: assume tx succeeds)
    const badgeAward = await prisma.badgeAward.create({
      data: {
        badgeDefinitionId: badgeDefId,
        memberId,
        onChainTokenId: expectedTokenId || null,
        transactionHash,
        status: 'pending', // Will be confirmed once tx is mined
      },
    });

    res.status(201).json({
      badgeAward,
      message: 'Badge awarded successfully (pending on-chain confirmation)',
    });
  } catch (error: any) {
    console.error('Unexpected error in award endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /groups/:groupId/badges
 * List all badges (definitions + awards) for a group (public)
 */
router.get('/groups/:groupId/badges', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { groupId } = req.params;

    const badges = await prisma.badgeDefinition.findMany({
      where: { groupId },
      include: {
        badgeAwards: {
          include: { member: true },
        },
        _count: { select: { badgeAwards: true } },
      },
    });

    res.json(badges);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /members/:memberId/badges
 * List all badges awarded to a specific member (public)
 */
router.get('/members/:memberId/badges', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { memberId } = req.params;

    const member = await prisma.member.findUnique({
      where: { id: memberId },
      include: {
        badgeAwards: {
          include: {
            badgeDefinition: {
              include: { group: true },
            },
          },
        },
      },
    });

    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    res.json({
      member: {
        id: member.id,
        walletAddress: member.walletAddress,
        displayName: member.displayName,
      },
      badges: member.badgeAwards,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /badge-awards/:id/verify-receipt
 * MANUAL VERIFICATION: Check if a pending badge tx was confirmed on-chain
 * If confirmed: update status to 'confirmed', set confirmedAt
 * If reverted: update status to 'failed', delete from badgeAwards (allows re-award)
 * If still pending: no change (still waiting for confirmation)
 *
 * Only admin who owns the badge can verify
 */
router.post('/badge-awards/:id/verify-receipt', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const adminId = req.adminId!;
    const { id: badgeAwardId } = req.params;

    // Get the badge award
    const badgeAward = await prisma.badgeAward.findUnique({
      where: { id: badgeAwardId },
      include: {
        badgeDefinition: { include: { group: true } },
        member: true,
      },
    });

    if (!badgeAward) {
      return res.status(404).json({ error: 'Badge award not found' });
    }

    // Check admin ownership
    if (!checkOwnership(badgeAward.badgeDefinition.adminId, adminId)) {
      return res.status(403).json({ error: 'Not authorized to verify this badge' });
    }

    // Only verify if status is pending
    if (badgeAward.status !== 'pending') {
      return res.status(400).json({
        error: `Cannot verify badge with status '${badgeAward.status}'. Only pending badges can be verified.`,
      });
    }

    // Must have a transaction hash
    if (!badgeAward.transactionHash) {
      return res.status(400).json({ error: 'Badge award has no transaction hash' });
    }

    // Query blockchain for receipt
    let receipt: ethers.TransactionReceipt | null;
    try {
      receipt = await provider.getTransactionReceipt(badgeAward.transactionHash);
    } catch (error: any) {
      console.error(`Failed to fetch receipt for tx ${badgeAward.transactionHash}:`, error);
      return res.status(400).json({
        error: 'Failed to query blockchain for transaction receipt',
        details: error.message,
      });
    }

    // Receipt not found = tx not mined yet
    if (!receipt) {
      return res.json({
        status: 'pending',
        message: 'Transaction not yet mined. Please try again later.',
        badgeAward,
      });
    }

    // Receipt found: check if successful or reverted
    if (receipt.status === 1) {
      // Success: update to confirmed
      const updated = await prisma.badgeAward.update({
        where: { id: badgeAwardId },
        data: {
          status: 'confirmed',
          confirmedAt: new Date(),
          onChainTokenId: badgeAward.onChainTokenId || undefined, // Keep existing if set
        },
      });

      return res.json({
        status: 'confirmed',
        message: 'Transaction confirmed on-chain',
        badgeAward: updated,
      });
    } else {
      // Reverted: update to failed and delete to allow re-award
      console.warn(
        `Badge award tx reverted: ${badgeAward.transactionHash} (member: ${badgeAward.member.walletAddress}, badge: ${badgeAward.badgeDefinitionId})`
      );

      const updated = await prisma.badgeAward.update({
        where: { id: badgeAwardId },
        data: {
          status: 'failed',
          failureReason: 'Transaction reverted on-chain',
        },
      });

      return res.json({
        status: 'failed',
        message:
          'Transaction reverted on-chain. You can now re-award this badge to the member.',
        badgeAward: updated,
      });
    }
  } catch (error: any) {
    console.error('Unexpected error in verify-receipt:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /badge-awards/:id/revoke
 * Revoke a badge that was previously awarded.
 * Only the admin who owns the badge definition can revoke it.
 * Writes on-chain via deployer wallet, then updates local DB.
 */
router.post('/badge-awards/:id/revoke', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const adminId = req.adminId!;
    const { id: badgeAwardId } = req.params;

    // 1. Find the badge award with its badge definition
    const badgeAward = await prisma.badgeAward.findUnique({
      where: { id: badgeAwardId },
      include: {
        badgeDefinition: { include: { group: true } },
        member: true,
      },
    });

    if (!badgeAward) {
      return res.status(404).json({ error: 'Badge award not found' });
    }

    // 2. Check admin ownership
    if (!checkOwnership(badgeAward.badgeDefinition.adminId, adminId)) {
      return res.status(403).json({ error: 'Not authorized to revoke this badge' });
    }

    // 3. Must have an on-chain token id
    if (!badgeAward.onChainTokenId) {
      return res.status(400).json({ error: 'Badge has no on-chain token yet' });
    }

    // 4. Must not be already revoked
    if (badgeAward.status === 'revoked') {
      return res.status(409).json({ error: 'Badge is already revoked' });
    }

    // 5. Revoke on-chain via deployer wallet
    const { transactionHash } = await relayerService.revokeBadge(Number(badgeAward.onChainTokenId));

    // 6. Update database record
    const updated = await prisma.badgeAward.update({
      where: { id: badgeAwardId },
      data: {
        status: 'revoked',
        revokedAt: new Date(),
        failureReason: `Revoked by admin. Tx: ${transactionHash}`,
      },
    });

    res.json({
      message: 'Badge revoked successfully',
      transactionHash,
      badgeAward: updated,
    });
  } catch (error: any) {
    console.error('Unexpected error in revoke endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
