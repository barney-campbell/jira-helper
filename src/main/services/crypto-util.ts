import { randomBytes, createCipheriv, createDecipheriv, scryptSync } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const KEY_LENGTH = 32;
const SALT = 'jira-helper-settings';

function getKey(): Buffer {
  // Derive a key from the user's home directory path (user-specific, not app-specific)
  const userPath = process.env.HOME || process.env.USERPROFILE || 'default';
  return scryptSync(userPath, SALT, KEY_LENGTH);
}

export function encrypt(text: string): string {
  const iv = randomBytes(IV_LENGTH);
  const key = getKey();
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

export function decrypt(data: string): string {
  const raw = Buffer.from(data, 'base64');
  const iv = raw.slice(0, IV_LENGTH);
  const tag = raw.slice(IV_LENGTH, IV_LENGTH + 16);
  const encrypted = raw.slice(IV_LENGTH + 16);
  const key = getKey();
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted, undefined, 'utf8') + decipher.final('utf8');
}
