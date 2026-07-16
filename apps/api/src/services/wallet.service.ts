import { PrismaClient } from '@prisma/client';
import { ethers } from 'ethers';
import { encryptPrivateKey } from '../utils/encryption';
import { relayerService } from './relayer.service';

const prisma = new PrismaClient();

/**
 * Service for managing relayer wallet lifecycle
 * - Generate new wallets for admins
 * - Encrypt/store private keys
 * - Track MINTER_ROLE status
 */
export class WalletService {
  /**
   * Create a new relayer wallet for an admin
   * Generates a new key pair and stores the encrypted private key
   */
  async createRelayerWallet(adminId: string): Promise<{ relayerAddress: string }> {
    // Check if relayer already exists
    const existing = await prisma.relayerWallet.findUnique({
      where: { adminId },
    });

    if (existing) {
      throw new Error(`Admin ${adminId} already has a relayer wallet`);
    }

    // Generate new wallet
    const newWallet = ethers.Wallet.createRandom();
    const publicAddress = newWallet.address;
    const privateKey = newWallet.privateKey;

    // Encrypt private key
    const encryptedKey = encryptPrivateKey(privateKey);

    // Store in database
    const relayerWallet = await prisma.relayerWallet.create({
      data: {
        adminId,
        relayerAddress: publicAddress,
        encryptedPrivateKey: encryptedKey,
        isActive: false, // Will be activated once MINTER_ROLE is granted on-chain
      },
    });

    console.log(`Created relayer wallet for admin ${adminId}: ${publicAddress}`);

    return {
      relayerAddress: publicAddress,
    };
  }

  /**
   * Initialize MINTER_ROLE for an admin's relayer wallet
   * This calls the on-chain grantMinter() function via the deployer wallet
   * and updates the database to mark the relayer as active
   */
  async initializeMinterRole(adminId: string): Promise<{ transactionHash: string; relayerAddress: string }> {
    // Get relayer wallet
    const relayerWallet = await prisma.relayerWallet.findUnique({
      where: { adminId },
    });

    if (!relayerWallet) {
      throw new Error(`No relayer wallet found for admin ${adminId}`);
    }

    if (relayerWallet.isActive) {
      throw new Error(`Relayer wallet for admin ${adminId} is already active`);
    }

    // Call grantMinter on-chain
    const transactionHash = await relayerService.grantMinterRole(relayerWallet.relayerAddress);

    // Update database to mark as active
    await prisma.relayerWallet.update({
      where: { adminId },
      data: {
        isActive: true,
        minterRoleGrantedAt: new Date(),
      },
    });

    console.log(`Activated MINTER_ROLE for admin ${adminId} at tx ${transactionHash}`);

    return {
      transactionHash,
      relayerAddress: relayerWallet.relayerAddress,
    };
  }

  /**
   * Revoke MINTER_ROLE for an admin's relayer wallet
   */
  async revokeMinterRole(adminId: string): Promise<{ transactionHash: string }> {
    const relayerWallet = await prisma.relayerWallet.findUnique({
      where: { adminId },
    });

    if (!relayerWallet) {
      throw new Error(`No relayer wallet found for admin ${adminId}`);
    }

    if (!relayerWallet.isActive) {
      throw new Error(`Relayer wallet for admin ${adminId} is not active`);
    }

    // Call revokeMinter on-chain
    const transactionHash = await relayerService.revokeMinterRole(relayerWallet.relayerAddress);

    // Update database
    await prisma.relayerWallet.update({
      where: { adminId },
      data: {
        isActive: false,
        minterRoleRevokedAt: new Date(),
      },
    });

    console.log(`Revoked MINTER_ROLE for admin ${adminId} at tx ${transactionHash}`);

    return { transactionHash };
  }

  /**
   * Get relayer wallet status for an admin
   */
  async getRelayerStatus(adminId: string) {
    const relayerWallet = await prisma.relayerWallet.findUnique({
      where: { adminId },
    });

    if (!relayerWallet) {
      return null;
    }

    // Check on-chain status
    const hasRoleOnChain = await relayerService.hasMinterRole(relayerWallet.relayerAddress);

    return {
      relayerAddress: relayerWallet.relayerAddress,
      isActive: relayerWallet.isActive,
      hasRoleOnChain,
      minterRoleGrantedAt: relayerWallet.minterRoleGrantedAt,
      minterRoleRevokedAt: relayerWallet.minterRoleRevokedAt,
      createdAt: relayerWallet.createdAt,
    };
  }
}

export const walletService = new WalletService();
