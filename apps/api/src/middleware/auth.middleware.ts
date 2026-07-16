import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';

export interface AuthenticatedRequest extends Request {
  adminId?: string;
  walletAddress?: string;
}

/**
 * Middleware to verify JWT token from Authorization header
 * Expects: "Authorization: Bearer <token>"
 */
export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const token = authHeader.slice(7); // Remove "Bearer " prefix
    const decoded = authService.verifyJwtToken(token);

    req.adminId = decoded.adminId;
    req.walletAddress = decoded.walletAddress;

    next();
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
}

/**
 * Helper to check ownership: admin can only access their own resources
 */
export function checkOwnership(resourceAdminId: string, authenticatedAdminId: string): boolean {
  return resourceAdminId === authenticatedAdminId;
}
