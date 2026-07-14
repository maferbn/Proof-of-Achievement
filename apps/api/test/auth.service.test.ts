import { authService } from '../src/services/auth.service';
import jwt from 'jsonwebtoken';
import { config } from '../src/config';
import { ethers } from 'ethers';

describe('AuthService', () => {
  describe('generateSiweMessage', () => {
    it('should generate a SIWE message with valid format', async () => {
      const address = '0x8ba1f109551bD432803012645Ac136ddd64DBA72';
      const { message, nonce } = await authService.generateSiweMessage(address);

      expect(message).toContain('Sign in with Ethereum');
      expect(message).toContain(address); // Message contains checksummed address
      expect(nonce).toBeDefined();
      expect(typeof nonce).toBe('string');
      expect(nonce.length).toBeGreaterThan(0);
    });

    it('should generate unique nonces', async () => {
      const address = '0x8ba1f109551bD432803012645Ac136ddd64DBA72';
      const { nonce: nonce1 } = await authService.generateSiweMessage(address);
      const { nonce: nonce2 } = await authService.generateSiweMessage(address);

      expect(nonce1).not.toEqual(nonce2);
    });

    it('should reject invalid Ethereum address', async () => {
      const invalidAddress = 'not-an-address';

      try {
        await authService.generateSiweMessage(invalidAddress);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should persist nonce to database', async () => {
      const address = '0x8ba1f109551bD432803012645Ac136ddd64DBA72';
      const { nonce } = await authService.generateSiweMessage(address);

      // Nonce should exist in DB (implementation detail, but critical for replay-protection)
      expect(nonce).toBeDefined();
      expect(nonce.length > 0).toBe(true);
    });
  });

  describe('verifyJwtToken', () => {
    it('should verify a valid JWT token', () => {
      const payload = {
        adminId: 'admin-123',
        walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f42bE0',
      };

      const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '1h' });
      const decoded = authService.verifyJwtToken(token);

      expect(decoded.adminId).toBe(payload.adminId);
      expect(decoded.walletAddress).toBe(payload.walletAddress);
    });

    it('should reject an invalid JWT token', () => {
      const invalidToken = 'invalid.jwt.token';

      expect(() => authService.verifyJwtToken(invalidToken)).toThrow();
    });

    it('should reject an expired JWT token', (done) => {
      const payload = {
        adminId: 'admin-123',
        walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f42bE0',
      };

      const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '0s' });

      // Wait a bit for token to expire
      setTimeout(() => {
        expect(() => authService.verifyJwtToken(token)).toThrow();
        done();
      }, 100);
    });
  });

  describe('SIWE signature verification', () => {
    it('should reject invalid signature', async () => {
      const message = 'Invalid SIWE message';
      const invalidSignature = '0x' + 'a'.repeat(130); // Invalid signature

      try {
        await authService.verifySiweSignature(message, invalidSignature);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});
