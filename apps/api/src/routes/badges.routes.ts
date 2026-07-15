import { Router, Response } from 'express';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest, authMiddleware, checkOwnership } from '../middleware/auth.middleware';
import { relayerService } from '../services/relayer.service';
import { validationService } from '../services/validation.service';
import { ipfsService, BadgeMetadata } from '../services/ipfs.service';
import { ethers } from 'ethers';
import { config } from '../config';

const router = Router();
const prisma = new PrismaClient();
const provider = new ethers.JsonRpcProvider(config.sepoliaRpcUrl);
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

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
 * POST /badges/metadata
 * Upload badge metadata (and optional image) to IPFS via Pinata.
 * Returns the ipfs:// URI that can be stored in a BadgeDefinition.
 *
 * Requires PINATA_JWT to be configured. If not set, returns 503.
 *
 * Accepts:
 * - JSON body: { name, description, attributes }
 * - Multipart form: image file + name, description, attributes fields
 */
router.post('/badges/metadata', authMiddleware, upload.single('image'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!ipfsService.isConfigured()) {
      return res.status(503).json({
        error: 'IPFS is not configured. Set PINATA_JWT in your environment.',
      });
    }

    const { name, description, attributes } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Missing "name"' });
    }

    // 1. Upload image if provided
    let imageUri: string | undefined;
    if (req.file) {
      imageUri = await ipfsService.uploadFile(req.file.buffer, req.file.originalname);
    }

    // 2. Build metadata object
    let parsedAttributes: Array<{ trait_type: string; value: string }> | undefined;
    if (attributes) {
      try {
        parsedAttributes = typeof attributes === 'string' ? JSON.parse(attributes) : attributes;
      } catch {
        return res.status(400).json({ error: 'Invalid "attributes" format (must be JSON array)' });
      }
    }

    const metadata: BadgeMetadata = {
      name,
      description: description || undefined,
      image: imageUri,
      attributes: parsedAttributes,
    };

    // 3. Upload metadata JSON to IPFS
    const metadataUri = await ipfsService.uploadJSON(metadata);

    res.json({
      metadataUri,
      gatewayUrl: ipfsService.toGatewayUrl(metadataUri),
      imageUri,
    });
  } catch (error: any) {
    console.error('Error uploading metadata to IPFS:', error);
    res.status(500).json({ error: error.message });
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
 * 3. Evidence passes oracle validation (if provided)
 * 4. Relayer wallet is active (MINTER_ROLE granted)
 * 5. Member hasn't already received this exact badge
 * 6. If all pass: mint on-chain, then save BadgeAward to DB
 */
router.post('/badge-definitions/:id/award', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const adminId = req.adminId!;
    const { id: badgeDefId } = req.params;
    const { memberId, evidence } = req.body;

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

    // 3. Oracle validation: validate evidence if provided
    if (evidence) {
      const validationResult = await validationService.validateAchievement(
        memberId,
        badgeDefId,
        evidence
      );

      if (!validationResult.valid) {
        return res.status(400).json({
          error: 'Evidence validation failed',
          reason: validationResult.reason,
        });
      }
    }

    // 4. Check relayer wallet is active
    const relayerWallet = await prisma.relayerWallet.findUnique({
      where: { adminId },
    });

    if (!relayerWallet || !relayerWallet.isActive) {
      return res.status(400).json({
        error: 'Relayer wallet not active. Initialize MINTER_ROLE first.',
      });
    }

    // 5. Check member hasn't already received this badge
    const existingAward = await prisma.badgeAward.findUnique({
      where: {
        memberId_badgeDefinitionId: {
          memberId,
          badgeDefinitionId: badgeDefId,
        },
      },
    });

    const isReassignable = existingAward && (existingAward.status === 'revoked' || existingAward.status === 'failed');

    if (existingAward && !isReassignable) {
      return res.status(409).json({ error: 'Member has already received this badge' });
    }

    // 6. Mint on-chain
    let transactionHash: string;

    try {
      const metadataURI = badgeDef.imageURI || 'ipfs://default-metadata'; // Use badge's imageURI or default
      const result = await relayerService.mintBadge(adminId, member.walletAddress, metadataURI);
      transactionHash = result.transactionHash;
    } catch (blockchainError: any) {
      console.error('Blockchain minting failed:', blockchainError);
      return res.status(400).json({
        error: 'Failed to mint badge on-chain',
        details: blockchainError.message,
      });
    }

    // 7. Save BadgeAward to database (optimistic: assume tx succeeds)
    // If the member previously had this badge revoked or failed, reuse the same row
    const badgeAward = isReassignable
      ? await prisma.badgeAward.update({
          where: { id: existingAward!.id },
          data: {
            onChainTokenId: null,
            transactionHash,
            status: 'pending',
            failureReason: null,
            revokedAt: null,
            confirmedAt: null,
            awardedAt: new Date(),
          },
        })
      : await prisma.badgeAward.create({
          data: {
            badgeDefinitionId: badgeDefId,
            memberId,
            // Unknown until the tx is mined; the real tokenId is recovered from the
            // BadgeMinted event in POST /badge-awards/:id/verify-receipt.
            onChainTokenId: null,
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
 * POST /badge-definitions/:id/validate
 * Simulated Oracle: Validates whether a member is eligible to receive a badge.
 * Checks: member existence, group membership, badge uniqueness, and evidence.
 * Does NOT mint on-chain — call /award afterwards to mint.
 */
router.post('/badge-definitions/:id/validate', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const adminId = req.adminId!;
    const { id: badgeDefId } = req.params;
    const { memberId, evidence } = req.body;

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
      return res.status(403).json({ error: 'Not authorized to validate this badge' });
    }

    // 2. Run oracle validation
    const validationResult = await validationService.validateAchievement(
      memberId,
      badgeDefId,
      evidence
    );

    res.json({
      valid: validationResult.valid,
      reason: validationResult.reason,
      validatedAt: validationResult.validatedAt,
      memberId,
      badgeDefinitionId: badgeDefId,
      message: validationResult.valid
        ? 'Member is eligible to receive this badge'
        : `Validation failed: ${validationResult.reason}`,
    });
  } catch (error: any) {
    console.error('Unexpected error in validate endpoint:', error);
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
      // Recover the real tokenId from the BadgeMinted event in the receipt.
      const tokenId = relayerService.extractMintedTokenId(receipt, badgeAward.member.walletAddress);

      if (tokenId === null) {
        // Tx succeeded but the mint event wasn't found: never fabricate an id.
        // Leave the record as pending so it can be retried / diagnosed.
        return res.status(500).json({
          error: 'Transaction confirmed but BadgeMinted event was not found',
        });
      }

      // Success: update to confirmed with the real on-chain tokenId.
      const updated = await prisma.badgeAward.update({
        where: { id: badgeAwardId },
        data: {
          status: 'confirmed',
          confirmedAt: new Date(),
          onChainTokenId: tokenId,
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
