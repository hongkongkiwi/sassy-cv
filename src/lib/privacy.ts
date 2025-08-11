import crypto from 'crypto';

export type PrivacyLevel = 'public' | 'secret_link' | 'password' | 'private';

export interface PrivacySettings {
  level: PrivacyLevel;
  secretToken?: string;
  password?: string; // Hashed password
  allowSearchEngines: boolean;
}

// Generate a secure random token for secret links
export function generateSecretToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Hash password for storage (using Node.js built-in crypto)
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

// Verify password against stored hash
export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) return false;
  
  const verifyHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}

// Generate privacy-aware URL for CV
export function generateCVUrl(
  baseUrl: string, 
  slug: string, 
  privacy: PrivacySettings,
  includeSecret: boolean = false
): string {
  const url = new URL(`/cv/${slug}`, baseUrl);
  
  if (privacy.level === 'secret_link' && includeSecret && privacy.secretToken) {
    url.searchParams.set('token', privacy.secretToken);
  }
  
  return url.toString();
}

// Validate access to CV based on privacy settings
export interface CVAccessContext {
  isAuthenticated: boolean;
  userId?: string;
  isCollaborator: boolean;
  hasViewerPermission: boolean;
  providedToken?: string;
  providedPassword?: string;
}

export interface CVAccessResult {
  canAccess: boolean;
  requiresPassword: boolean;
  requiresAuth: boolean;
  reason?: string;
}

export function checkCVAccess(
  privacy: PrivacySettings,
  context: CVAccessContext
): CVAccessResult {
  switch (privacy.level) {
    case 'public':
      return { canAccess: true, requiresPassword: false, requiresAuth: false };
    
    case 'secret_link':
      if (context.providedToken === privacy.secretToken) {
        return { canAccess: true, requiresPassword: false, requiresAuth: false };
      }
      // Allow collaborators to access without token
      if (context.isAuthenticated && context.hasViewerPermission) {
        return { canAccess: true, requiresPassword: false, requiresAuth: false };
      }
      return {
        canAccess: false,
        requiresPassword: false,
        requiresAuth: false,
        reason: 'Invalid or missing secret token'
      };
    
    case 'password':
      // Collaborators bypass password
      if (context.isAuthenticated && context.hasViewerPermission) {
        return { canAccess: true, requiresPassword: false, requiresAuth: false };
      }
      
      if (!context.providedPassword) {
        return { canAccess: false, requiresPassword: true, requiresAuth: false };
      }
      
      if (privacy.password && verifyPassword(context.providedPassword, privacy.password)) {
        return { canAccess: true, requiresPassword: false, requiresAuth: false };
      }
      
      return {
        canAccess: false,
        requiresPassword: true,
        requiresAuth: false,
        reason: 'Incorrect password'
      };
    
    case 'private':
      if (!context.isAuthenticated) {
        return {
          canAccess: false,
          requiresPassword: false,
          requiresAuth: true,
          reason: 'Authentication required'
        };
      }
      
      if (!context.hasViewerPermission) {
        return {
          canAccess: false,
          requiresPassword: false,
          requiresAuth: false,
          reason: 'Access denied - insufficient permissions'
        };
      }
      
      return { canAccess: true, requiresPassword: false, requiresAuth: false };
    
    default:
      return {
        canAccess: false,
        requiresPassword: false,
        requiresAuth: false,
        reason: 'Invalid privacy level'
      };
  }
}

// Get human-readable privacy level description
export function getPrivacyLevelDescription(level: PrivacyLevel): string {
  switch (level) {
    case 'public':
      return 'Anyone can view this CV';
    case 'secret_link':
      return 'Only people with the secret link can view this CV';
    case 'password':
      return 'Anyone with the password can view this CV';
    case 'private':
      return 'Only invited collaborators can view this CV';
    default:
      return 'Unknown privacy level';
  }
}

// Get privacy level icon/emoji
export function getPrivacyLevelIcon(level: PrivacyLevel): string {
  switch (level) {
    case 'public':
      return '🌐';
    case 'secret_link':
      return '🔗';
    case 'password':
      return '🔐';
    case 'private':
      return '🔒';
    default:
      return '❓';
  }
}

// Validate privacy settings
export function validatePrivacySettings(settings: Partial<PrivacySettings>): string[] {
  const errors: string[] = [];
  
  if (!settings.level) {
    errors.push('Privacy level is required');
  } else if (!['public', 'secret_link', 'password', 'private'].includes(settings.level)) {
    errors.push('Invalid privacy level');
  }
  
  if (settings.level === 'secret_link' && !settings.secretToken) {
    errors.push('Secret token is required for secret link privacy');
  }
  
  if (settings.level === 'password' && !settings.password) {
    errors.push('Password is required for password privacy');
  }
  
  return errors;
}