/**
 * Brazilian Random PIX Key (Chave PIX Aleatória / EVP) Validator & Utilities
 */

/**
 * Validates if the given string is a valid Random PIX Key (EVP/UUID format).
 * Accepts:
 * - Standard UUID with hyphens (e.g. 123e4567-e89b-12d3-a456-426614174000) - 36 chars
 * - 32 Hexadecimal characters without hyphens
 */
export function isValidRandomPixKey(key: string): boolean {
  if (!key) return false;
  const cleanKey = key.trim();

  // UUID Pattern: 8-4-4-4-12 hex digits
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  // 32 hex digits pattern
  const hex32Regex = /^[0-9a-fA-F]{32}$/;

  return uuidRegex.test(cleanKey) || hex32Regex.test(cleanKey);
}

/**
 * Generates a mock standard Random PIX Key (UUID v4 format)
 */
export function generateSamplePixKey(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
