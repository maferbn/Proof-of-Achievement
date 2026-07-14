import { encryptPrivateKey, decryptPrivateKey } from '../src/utils/encryption';
import { ethers } from 'ethers';

describe('Encryption Utilities', () => {
  describe('encryptPrivateKey and decryptPrivateKey', () => {
    it('should encrypt and decrypt a private key correctly', () => {
      const wallet = ethers.Wallet.createRandom();
      const originalPrivateKey = wallet.privateKey;

      const encrypted = encryptPrivateKey(originalPrivateKey);
      const decrypted = decryptPrivateKey(encrypted);

      expect(decrypted).toBe(originalPrivateKey);
    });

    it('should produce different ciphertexts for the same key', () => {
      const privateKey = ethers.Wallet.createRandom().privateKey;

      const encrypted1 = encryptPrivateKey(privateKey);
      const encrypted2 = encryptPrivateKey(privateKey);

      // Due to random IV and salt, ciphertexts should be different
      expect(encrypted1).not.toBe(encrypted2);

      // But both should decrypt to the same key
      expect(decryptPrivateKey(encrypted1)).toBe(privateKey);
      expect(decryptPrivateKey(encrypted2)).toBe(privateKey);
    });

    it('should not expose plaintext private key in ciphertext', () => {
      const privateKey = ethers.Wallet.createRandom().privateKey;
      const encrypted = encryptPrivateKey(privateKey);

      // Decrypt the base64 to check it's not storing plaintext
      const buffer = Buffer.from(encrypted, 'base64');
      const bufferHex = buffer.toString('hex');

      // The plaintext should not appear in the ciphertext
      const privateKeyHex = privateKey.toLowerCase().slice(2);
      expect(bufferHex).not.toContain(privateKeyHex);
    });

    it('should fail to decrypt with wrong encrypted data', () => {
      const validWallet = ethers.Wallet.createRandom();
      const validEncrypted = encryptPrivateKey(validWallet.privateKey);

      // Corrupt the ciphertext
      const corruptedBuffer = Buffer.from(validEncrypted, 'base64');
      const tampered = Buffer.alloc(corruptedBuffer.length);
      corruptedBuffer.copy(tampered);
      tampered[tampered.length - 1] ^= 0xFF; // Flip bits at the end (affects the tag)

      const tamperedEncrypted = tampered.toString('base64');

      expect(() => decryptPrivateKey(tamperedEncrypted)).toThrow();
    });
  });
});
