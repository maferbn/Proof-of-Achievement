import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest, authMiddleware, checkOwnership } from '../middleware/auth.middleware';
import { ethers } from 'ethers';

const router = Router();
const prisma = new PrismaClient();

/**
 * POST /groups
 * Create a new group (admin autenticado)
 */
router.post('/groups', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const adminId = req.adminId!;
    const { name, description } = req.body;

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid "name"' });
    }

    const group = await prisma.group.create({
      data: {
        adminId,
        name,
        description: description || null,
      },
    });

    res.status(201).json(group);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Group name already exists for this admin' });
    }
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /groups
 * List all groups for the authenticated admin
 */
router.get('/groups', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const adminId = req.adminId!;

    const groups = await prisma.group.findMany({
      where: { adminId },
      include: {
        _count: {
          select: { members: true, badgeDefinitions: true },
        },
      },
    });

    res.json(groups);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /groups/:id
 * Get a specific group (owner or public?)
 */
router.get('/groups/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        members: true,
        badgeDefinitions: true,
        _count: {
          select: { members: true, badgeDefinitions: true },
        },
      },
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    res.json(group);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /groups/:id
 * Update a group (owner only)
 */
router.put('/groups/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const adminId = req.adminId!;
    const { id } = req.params;
    const { name, description } = req.body;

    // Check ownership
    const group = await prisma.group.findUnique({ where: { id } });
    if (!group || !checkOwnership(group.adminId, adminId)) {
      return res.status(403).json({ error: 'Not authorized to modify this group' });
    }

    const updated = await prisma.group.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
      },
    });

    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * DELETE /groups/:id
 * Delete a group (owner only, cascade deletes members & badges)
 */
router.delete('/groups/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const adminId = req.adminId!;
    const { id } = req.params;

    // Check ownership
    const group = await prisma.group.findUnique({ where: { id } });
    if (!group || !checkOwnership(group.adminId, adminId)) {
      return res.status(403).json({ error: 'Not authorized to delete this group' });
    }

    await prisma.group.delete({ where: { id } });

    res.json({ message: 'Group deleted' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /groups/:id/members
 * Add a member to a group
 */
router.post('/groups/:id/members', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const adminId = req.adminId!;
    const { id: groupId } = req.params;
    const { walletAddress, displayName } = req.body;

    if (!walletAddress || typeof walletAddress !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid "walletAddress"' });
    }

    // Validate address
    if (!ethers.isAddress(walletAddress)) {
      return res.status(400).json({ error: 'Invalid Ethereum address' });
    }

    // Check group ownership
    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group || !checkOwnership(group.adminId, adminId)) {
      return res.status(403).json({ error: 'Not authorized to add members to this group' });
    }

    const member = await prisma.member.create({
      data: {
        groupId,
        walletAddress: ethers.getAddress(walletAddress), // Checksum
        displayName: displayName || null,
      },
    });

    res.status(201).json(member);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Member already exists in this group' });
    }
    res.status(400).json({ error: error.message });
  }
});

/**
 * DELETE /groups/:id/members/:memberId
 * Remove a member from a group (off-chain only, badges remain soulbound)
 */
router.delete('/groups/:id/members/:memberId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const adminId = req.adminId!;
    const { id: groupId, memberId } = req.params;

    // Check group ownership
    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group || !checkOwnership(group.adminId, adminId)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Check member exists in group
    const member = await prisma.member.findUnique({ where: { id: memberId } });
    if (!member || member.groupId !== groupId) {
      return res.status(404).json({ error: 'Member not found in this group' });
    }

    await prisma.member.delete({ where: { id: memberId } });

    res.json({ message: 'Member removed from group' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
