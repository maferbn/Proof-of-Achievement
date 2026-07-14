import { ethers } from 'ethers';
import { config } from '../config';
import { decryptPrivateKey } from '../utils/encryption';
import { PrismaClient } from '@prisma/client';
import { REPUTATION_BADGE_ABI } from '@repo/shared-types';

const prisma = new PrismaClient();

/**
 * Service for managing blockchain interactions (minting badges, granting MINTER_ROLE)
 */
export class RelayerService {
  private provider: ethers.JsonRpcProvider;
  private deployerWallet: ethers.Wallet;
  private reputationBadgeContract: ethers.Contract;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(config.sepoliaRpcUrl);
    this.deployerWallet = new ethers.Wallet(config.deployerPrivateKey, this.provider);
    this.reputationBadgeContract = new ethers.Contract(
      config.reputationBadgeContractAddress,
      REPUTATION_BADGE_ABI,
      this.deployerWallet
    );
  }

  /**
   * Mint a badge to a recipient using the admin's relayer wallet
   * Returns the transaction hash and expected token ID
   */
  async mintBadge(
    adminId: string,
    recipientAddress: string,
    metadataURI: string
  ): Promise<{ transactionHash: string; expectedTokenId: bigint }> {
    // Get relayer wallet for this admin
    const relayerWallet = await prisma.relayerWallet.findUnique({
      where: { adminId },
    });

    if (!relayerWallet) {
      throw new Error(`No relayer wallet found for admin ${adminId}`);
    }

    if (!relayerWallet.isActive) {
      throw new Error(`Relayer wallet for admin ${adminId} is not active (MINTER_ROLE not granted)`);
    }

    // Decrypt relayer's private key
    let relayerPrivateKey: string;
    try {
      relayerPrivateKey = decryptPrivateKey(relayerWallet.encryptedPrivateKey);
    } catch (error) {
      console.error(`Failed to decrypt relayer private key for admin ${adminId}:`, error);
      throw new Error('Failed to decrypt relayer credentials');
    }

    // Create signer from relayer wallet
    const relayerSigner = new ethers.Wallet(relayerPrivateKey, this.provider);

    // Get the current nonce to predict token ID
    // (This is a simplified approach; in production, consider using events)
    const currentTokenIdBigInt = await this.getNextTokenId();

    // Create contract instance connected to relayer
    const contract = new ethers.Contract(
      config.reputationBadgeContractAddress,
      REPUTATION_BADGE_ABI,
      relayerSigner
    );

    // Validate recipient address
    if (!ethers.isAddress(recipientAddress)) {
      throw new Error('Invalid recipient address');
    }

    try {
      console.log(
        `Relayer ${relayerWallet.relayerAddress} minting badge to ${recipientAddress} with URI ${metadataURI}`
      );

      const tx = await contract.mint(recipientAddress, metadataURI);
      console.log(`Badge mint transaction sent: ${tx.hash}`);

      return {
        transactionHash: tx.hash,
        expectedTokenId: currentTokenIdBigInt,
      };
    } catch (error: any) {
      console.error('Failed to mint badge:', error);
      throw new Error(`Minting failed: ${error.message || error}`);
    }
  }

  /**
   * Get the next expected token ID (for predicting the ID before tx confirms)
   * This is a simplified approach; actual ID is confirmed when tx is mined
   */
  private async getNextTokenId(): Promise<bigint> {
    try {
      const contract = new ethers.Contract(
        config.reputationBadgeContractAddress,
        ['function _tokenIdCounter() public view returns (uint256)'],
        this.provider
      );
      const currentId = await contract._tokenIdCounter();
      return BigInt(currentId);
    } catch (error) {
      // If counter is not exposed, we can't predict it; caller must wait for tx receipt
      console.warn('Could not fetch next token ID:', error);
      return BigInt(0);
    }
  }

  /**
   * Grant MINTER_ROLE to a relayer wallet (called once per admin)
   * Only the deployer (superadmin) can call this
   */
  async grantMinterRole(relayerAddress: string): Promise<string> {
    if (!ethers.isAddress(relayerAddress)) {
      throw new Error('Invalid relayer address');
    }

    try {
      console.log(`Granting MINTER_ROLE to ${relayerAddress} via deployer wallet`);

      const tx = await this.reputationBadgeContract.grantMinter(relayerAddress);
      console.log(`MINTER_ROLE grant transaction sent: ${tx.hash}`);

      return tx.hash;
    } catch (error: any) {
      console.error('Failed to grant MINTER_ROLE:', error);
      throw new Error(`Granting MINTER_ROLE failed: ${error.message || error}`);
    }
  }

  /**
   * Revoke MINTER_ROLE from a relayer wallet
   */
  async revokeMinterRole(relayerAddress: string): Promise<string> {
    if (!ethers.isAddress(relayerAddress)) {
      throw new Error('Invalid relayer address');
    }

    try {
      console.log(`Revoking MINTER_ROLE from ${relayerAddress} via deployer wallet`);

      const tx = await this.reputationBadgeContract.revokeMinter(relayerAddress);
      console.log(`MINTER_ROLE revoke transaction sent: ${tx.hash}`);

      return tx.hash;
    } catch (error: any) {
      console.error('Failed to revoke MINTER_ROLE:', error);
      throw new Error(`Revoking MINTER_ROLE failed: ${error.message || error}`);
    }
  }

  /**
   * Check if a wallet has MINTER_ROLE on-chain
   */
  async hasMinterRole(address: string): Promise<boolean> {
    if (!ethers.isAddress(address)) {
      return false;
    }

    try {
      const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes('MINTER_ROLE'));
      return await this.reputationBadgeContract.hasRole(MINTER_ROLE, address);
    } catch (error) {
      console.error('Failed to check MINTER_ROLE:', error);
      return false;
    }
  }

  /**
   * Revoke a badge on-chain.
   * Uses the deployer wallet (DEFAULT_ADMIN_ROLE), not the relayer wallet.
   */
  async revokeBadge(tokenId: number): Promise<{ transactionHash: string }> {
    try {
      console.log(`Revoking badge tokenId=${tokenId} via deployer wallet`);
      const tx = await this.reputationBadgeContract.revokeBadge(tokenId);
      console.log(`Badge revoke transaction sent: ${tx.hash}`);
      return { transactionHash: tx.hash };
    } catch (error: any) {
      console.error('Failed to revoke badge:', error);
      throw new Error(`Badge revocation failed: ${error.message || error}`);
    }
  }

  /**
   * Check if a badge has been revoked on-chain.
   * Read-only operation, does not spend gas.
   */
  async isBadgeRevoked(tokenId: number): Promise<boolean> {
    try {
      return await this.reputationBadgeContract.isRevoked(tokenId);
    } catch (error) {
      console.error('Failed to check revocation status:', error);
      return false;
    }
  }
}

export const relayerService = new RelayerService();
