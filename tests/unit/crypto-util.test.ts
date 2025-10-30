import { encrypt, decrypt } from '../../src/main/services/crypto-util';

describe('Crypto Utilities', () => {
  describe('encrypt and decrypt', () => {
    it('should encrypt and decrypt text correctly', () => {
      const originalText = 'my-secret-api-token';
      
      const encrypted = encrypt(originalText);
      const decrypted = decrypt(encrypted);
      
      expect(decrypted).toBe(originalText);
    });

    it('should produce different encrypted values for same input', () => {
      const text = 'test-secret';
      
      const encrypted1 = encrypt(text);
      const encrypted2 = encrypt(text);
      
      // Should be different due to random IV
      expect(encrypted1).not.toBe(encrypted2);
      
      // But both should decrypt to the same value
      expect(decrypt(encrypted1)).toBe(text);
      expect(decrypt(encrypted2)).toBe(text);
    });

    it('should handle empty strings', () => {
      const text = '';
      
      const encrypted = encrypt(text);
      const decrypted = decrypt(encrypted);
      
      expect(decrypted).toBe(text);
    });

    it('should handle special characters', () => {
      const text = 'Special!@#$%^&*()_+-={}[]|:";\'<>,.?/~`';
      
      const encrypted = encrypt(text);
      const decrypted = decrypt(encrypted);
      
      expect(decrypted).toBe(text);
    });

    it('should handle unicode characters', () => {
      const text = 'Hello 世界 🌍';
      
      const encrypted = encrypt(text);
      const decrypted = decrypt(encrypted);
      
      expect(decrypted).toBe(text);
    });

    it('should handle long strings', () => {
      const text = 'a'.repeat(10000);
      
      const encrypted = encrypt(text);
      const decrypted = decrypt(encrypted);
      
      expect(decrypted).toBe(text);
    });

    it('should produce base64 encoded output', () => {
      const text = 'test';
      const encrypted = encrypt(text);
      
      // Base64 should only contain valid characters
      expect(encrypted).toMatch(/^[A-Za-z0-9+/=]+$/);
    });

    it('should throw error when decrypting invalid data', () => {
      expect(() => decrypt('invalid-base64-data!!!')).toThrow();
    });

    it('should throw error when decrypting corrupted data', () => {
      const text = 'test';
      const encrypted = encrypt(text);
      
      // Corrupt the encrypted data
      const corrupted = encrypted.slice(0, -5) + 'XXXXX';
      
      expect(() => decrypt(corrupted)).toThrow();
    });
  });
});
