import { SiweMessage } from 'siwe';
import jwt, { SignOptions } from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { config } from '../config';
import { ethers } from 'ethers';

const prisma = new PrismaClient();

/**
 * Service for SIWE authentication and JWT token management
 */
export class AuthService {
  private readonly jwtSecret = config.jwtSecret;
  private readonly jwtExpiration = config.jwtExpiration;
  private readonly nonceExpirationMs = 10 * 60 * 1000; // 10 minutes

  /**
   * Generate a SIWE message for an admin to sign
   * Stores nonce in database for replay-protection
   * Returns the message string and nonce
   */
  async generateSiweMessage(address: string, chainId: number = 11155111): Promise<{ message: string; nonce: string }> {
    if (!ethers.isAddress(address)) {
      throw new Error('Invalid Ethereum address');
    }

    const checksummedAddress = ethers.getAddress(address);
    const nonce = this.generateNonce();
    const expiresAt = new Date(Date.now() + this.nonceExpirationMs);

    // Store nonce in database for replay-protection
    await prisma.siweNonce.create({
      data: {
        nonce,
        address: checksummedAddress,
        used: false,
        expiresAt,
      },
    });

    const message = new SiweMessage({
      domain: 'reputation-badges.local',
      address: checksummedAddress,
      statement: 'Sign in with Ethereum to access the Reputation Badge admin panel.',
      uri: 'http://localhost:3000',
      version: '1',
      chainId,
      nonce,
      issuedAt: new Date().toISOString(),
      expirationTime: expiresAt.toISOString(),
    });

    return {
      message: message.prepareMessage(),
      nonce,
    };
  }

  /**
   * Verify a SIWE signature and validate nonce
   * Marks nonce as used to prevent replay attacks
   * Returns a JWT token
   */
  async verifySiweSignature(message: string, signature: string): Promise<{ token: string; adminId: string; admin: any }> {
    try {
      // Parse and verify the message cryptographically
      const siweMessage = new SiweMessage(message);
      const recoveredAddress = await siweMessage.verify({ signature });
      const adminWalletAddress = ethers.getAddress(recoveredAddress.data.address);
      const nonce = siweMessage.nonce;

      // Validate nonce: must exist, not be used, and not be expired
      const siweNonceRecord = await prisma.siweNonce.findUnique({
        where: { nonce },
      });

      if (!siweNonceRecord) {
        throw new Error('Nonce not found. Request a new SIWE message.');
      }

      if (siweNonceRecord.used) {
        console.warn(`Replay attack detected: nonce ${nonce} was already used`);
        throw new Error('Nonce already used. Request a new SIWE message.');
      }

      if (siweNonceRecord.address !== adminWalletAddress) {
        console.warn(`Nonce address mismatch: nonce for ${siweNonceRecord.address} but signed by ${adminWalletAddress}`);
        throw new Error('Nonce address does not match signer address.');
      }

      if (new Date() > siweNonceRecord.expiresAt) {
        throw new Error('Nonce expired. Request a new SIWE message.');
      }

      // Mark nonce as used
      await prisma.siweNonce.update({
        where: { nonce },
        data: { used: true },
      });

      // Check if admin exists, otherwise create
      let admin = await prisma.admin.findUnique({
        where: { walletAddress: adminWalletAddress },
      });

      if (!admin) {
        console.log(`Creating new admin with wallet ${adminWalletAddress}`);
        admin = await prisma.admin.create({
          data: {
            walletAddress: adminWalletAddress,
          },
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          adminId: admin.id,
          walletAddress: admin.walletAddress,
        },
        this.jwtSecret,
        { expiresIn: this.jwtExpiration } as SignOptions
      );

      return {
        token,
        adminId: admin.id,
        admin,
      };
    } catch (error: any) {
      console.error('SIWE verification failed:', error);
      throw new Error(`SIWE verification failed: ${error.message}`);
    }
  }

  /**
   * Verify and decode a JWT token
   * Throws if invalid
   */
  verifyJwtToken(token: string): { adminId: string; walletAddress: string } {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as any;
      return {
        adminId: decoded.adminId,
        walletAddress: decoded.walletAddress,
      };
    } catch (error: any) {
      throw new Error(`Invalid or expired token: ${error.message}`);
    }
  }

  /**
   * Clean up expired nonces (can be called periodically)
   */
  async cleanupExpiredNonces(): Promise<number> {
    const result = await prisma.siweNonce.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
    console.log(`Cleaned up ${result.count} expired SIWE nonces`);
    return result.count;
  }

  /**
   * Generate a random nonce
   */
  private generateNonce(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}

export const authService = new AuthService();
