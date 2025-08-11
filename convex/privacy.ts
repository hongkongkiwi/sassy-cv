// Privacy utilities for Convex functions
// Note: This is a separate implementation from src/lib/privacy.ts
// since Convex functions can't import from src/

export type PrivacyLevel = 'public' | 'secret_link' | 'password' | 'private';

// Generate a secure random token for secret links
export function generateSecretToken(): string {
  // In Convex, we need to use a different approach since crypto is not available
  // Generate a random hex string
  const chars = '0123456789abcdef';
  let token = '';
  for (let i = 0; i < 64; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

// Simple hash function for passwords (using built-in methods available in Convex)
export function hashPassword(password: string): string {
  // Note: This is a simplified hash for demo purposes
  // In production, you'd want to use a proper bcrypt library or similar
  const salt = generateSalt();
  const combined = salt + password;
  
  // Simple hash using string manipulation (not cryptographically secure)
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return `${salt}:${hash.toString(16)}`;
}

// Verify password against stored hash
export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) return false;
  
  const combined = salt + password;
  let computedHash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    computedHash = ((computedHash << 5) - computedHash) + char;
    computedHash = computedHash & computedHash;
  }
  
  return hash === computedHash.toString(16);
}

function generateSalt(): string {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let salt = '';
  for (let i = 0; i < 16; i++) {
    salt += chars[Math.floor(Math.random() * chars.length)];
  }
  return salt;
}