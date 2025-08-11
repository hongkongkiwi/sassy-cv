import crypto from 'crypto';

export function generateCSPNonce(): string {
  return crypto.randomBytes(16).toString('base64');
}

export function generateCSPHeader(nonce?: string): string {
  const cspDirectives = [
    "default-src 'self'",
    nonce 
      ? `script-src 'self' 'nonce-${nonce}' https://clerk.com https://*.clerk.accounts.dev`
      : "script-src 'self' https://clerk.com https://*.clerk.accounts.dev",
    "style-src 'self' 'unsafe-inline'", // Keep unsafe-inline for Tailwind CSS
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.convex.dev https://*.convex.cloud https://clerk.com https://*.clerk.accounts.dev https://api.openai.com https://generativelanguage.googleapis.com",
    "frame-src 'self' https://clerk.com https://*.clerk.accounts.dev",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ];

  return cspDirectives.join('; ');
}

export function getSecurityHeaders(nonce?: string) {
  return {
    // Content Security Policy
    'Content-Security-Policy': generateCSPHeader(nonce),
    
    // Other security headers
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    
    // Strict Transport Security (HTTPS only)
    ...(process.env.NODE_ENV === 'production' && {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
    })
  };
}