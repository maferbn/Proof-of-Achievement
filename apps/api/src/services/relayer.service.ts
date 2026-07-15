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
   * Mint a badge to a recipient using the admin's relayer wallet.
   * Returns the transaction hash. The real on-chain tokenId is recovered later
   * from the BadgeMinted event via extractMintedTokenId(receipt), once the
   * transaction has been mined (see the verify-receipt endpoint).
   */
  async mintBadge(
    adminId: string,
    recipientAddress: string,
    metadataURI: string
  ): Promise<{ transactionHash: string }> {
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
      };
    } catch (error: any) {
      console.error('Failed to mint badge:', error);
      throw new Error(`Minting failed: ${error.message || error}`);
    }
  }

  /**
   * Recover the real on-chain tokenId from a mint transaction receipt by
   * parsing the ReputationBadge `BadgeMinted(address,uint256,string)` event.
   *
   * Only logs emitted by the configured contract are considered, and — when a
   * recipient is provided — the event's `to` must match it. Returns null if the
   * event is not present, so the caller can decide how to handle its absence
   * (we never fabricate a tokenId).
   */
  extractMintedTokenId(
    receipt: ethers.TransactionReceipt,
    expectedRecipient?: string
  ): bigint | null {
    const contractAddress = config.reputationBadgeContractAddress.toLowerCase();

    for (const log of receipt.logs) {
      // Ignore logs emitted by other contracts.
      if (log.address.toLowerCase() !== contractAddress) continue;

      let parsed;
      try {
        parsed = this.reputationBadgeContract.interface.parseLog({
          topics: [...log.topics],
          data: log.data,
        });
      } catch {
        // Log doesn't match this ABI (e.g. Transfer / Locked) — skip it.
        continue;
      }

      if (!parsed || parsed.name !== 'BadgeMinted') continue;

      // When known, make sure the event targets the expected recipient.
      if (
        expectedRecipient &&
        String(parsed.args.to).toLowerCase() !== expectedRecipient.toLowerCase()
      ) {
        continue;
      }

      return BigInt(parsed.args.tokenId);
    }

    return null;
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
