import { Router, Response } from 'express';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.middleware';
import { authService } from '../services/auth.service';
import { walletService } from '../services/wallet.service';

const router = Router();

/**
 * POST /auth/siwe-message
 * Request a SIWE message to be signed by the admin
 * Stores nonce server-side for replay-protection
 */
router.post('/auth/siwe-message', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { address } = req.body;

    if (!address || typeof address !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid "address" field' });
    }

    const { message, nonce } = await authService.generateSiweMessage(address);

    res.json({ message, nonce });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /auth/siwe-verify
 * Verify the signed SIWE message and issue a JWT token
 */
router.post('/auth/siwe-verify', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { message, signature } = req.body;

    if (!message || !signature) {
      return res.status(400).json({ error: 'Missing "message" or "signature"' });
    }

    const { token, adminId, admin } = await authService.verifySiweSignature(message, signature);

    // Auto-create relayer wallet on first login
    let relayerStatus = await walletService.getRelayerStatus(adminId);
    if (!relayerStatus) {
      console.log(`First login for admin ${adminId}; creating relayer wallet...`);
      const { relayerAddress } = await walletService.createRelayerWallet(adminId);
      relayerStatus = await walletService.getRelayerStatus(adminId);
    }

    res.json({
      token,
      admin: {
        id: admin.id,
        walletAddress: admin.walletAddress,
        displayName: admin.displayName,
      },
      relayerStatus,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /auth/initialize-minter-role
 * Grant MINTER_ROLE to the admin's relayer wallet (on-chain)
 * Protected: admin can only initialize their own relayer
 */
router.post('/auth/initialize-minter-role', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const adminId = req.adminId!;

    const result = await walletService.initializeMinterRole(adminId);

    res.json({
      message: 'MINTER_ROLE granted successfully',
      transactionHash: result.transactionHash,
      relayerAddress: result.relayerAddress,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /auth/relayer-status
 * Check the relayer wallet status for the authenticated admin
 */
router.get('/auth/relayer-status', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const adminId = req.adminId!;
    const status = await walletService.getRelayerStatus(adminId);

    if (!status) {
      return res.status(404).json({ error: 'Relayer wallet not found' });
    }

    res.json(status);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
