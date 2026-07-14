import crypto from 'crypto';
import { config } from '../config';

// AES-256-GCM encryption/decryption for relayer private keys
const ALGORITHM = 'aes-256-gcm';
const SALT_LENGTH = 16;
const TAG_LENGTH = 16;

/**
 * Derives a 32-byte encryption key from the master key using PBKDF2
 */
function deriveKey(masterKey: string, salt: Buffer): Buffer {
  const keyBuffer = Buffer.from(masterKey.slice(2), 'hex'); // Remove '0x' prefix
  return crypto.pbkdf2Sync(keyBuffer, salt, 100000, 32, 'sha256');
}

/**
 * Encrypts a private key (plaintext hex string) and returns a base64 ciphertext
 * Format: "salt(16 bytes) + iv(12 bytes) + ciphertext + tag(16 bytes)"
 */
export function encryptPrivateKey(privateKeyHex: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = deriveKey(config.encryptionMasterKey, salt);
  const iv = crypto.randomBytes(12); // 96-bit IV for GCM

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(privateKeyHex, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();

  // Combine: salt + iv + encrypted + tag
  const combined = Buffer.concat([salt, iv, Buffer.from(encrypted, 'hex'), tag]);
  return combined.toString('base64');
}

/**
 * Decrypts a base64 ciphertext and returns the plaintext private key (hex string)
 */
export function decryptPrivateKey(encryptedBase64: string): string {
  const combined = Buffer.from(encryptedBase64, 'base64');

  const salt = combined.slice(0, SALT_LENGTH);
  const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + 12);
  const tagStart = combined.length - TAG_LENGTH;
  const ciphertext = combined.slice(SALT_LENGTH + 12, tagStart);
  const tag = combined.slice(tagStart);

  const key = deriveKey(config.encryptionMasterKey, salt);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(ciphertext.toString('hex'), 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
