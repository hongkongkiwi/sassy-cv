import { NextRequest } from 'next/server';
import DOMPurify from 'isomorphic-dompurify';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../convex/_generated/api';
import { env } from '@/env';

// Legacy in-memory rate limiting (fallback)
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const rateLimitStore: RateLimitStore = {};

export interface RateLimitOptions {
  windowMs?: number;
  maxRequests?: number;
  identifier?: (req: NextRequest) => string | Promise<string>;
  endpoint?: string;
  usePersistent?: boolean;
}

// Get Convex client for rate limiting
const getConvexClient = () => {
  if (!env.NEXT_PUBLIC_CONVEX_URL) {
    return null;
  }
  return new ConvexHttpClient(env.NEXT_PUBLIC_CONVEX_URL);
};

export function rateLimit(options: RateLimitOptions = {}) {
  const {
    windowMs = 60000, // 1 minute default
    maxRequests = 10,
    identifier = (req) => req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
    endpoint = 'default',
    // Only use persistent rate limiting in production to avoid test/dev flakiness
    usePersistent = env.NODE_ENV === 'production',
  } = options;

  return async (req: NextRequest): Promise<{ success: boolean; limit?: number; remaining?: number; reset?: number; retryAfter?: number }> => {
    const key = await Promise.resolve(identifier(req));
    
    // Try to use persistent rate limiting first
    if (usePersistent) {
      const client = getConvexClient();
      if (client) {
        try {
          const result = await client.mutation(api.rateLimiting.checkRateLimit, {
            identifier: key,
            endpoint,
            windowMs,
            maxRequests,
          });
          return result;
        } catch (error) {
          console.warn('Failed to use persistent rate limiting, falling back to in-memory:', error);
        }
      }
    }
    
    // Fallback to in-memory rate limiting
    const now = Date.now();
    const storeKey = `${key}:${endpoint}`;
    
    if (!rateLimitStore[storeKey] || rateLimitStore[storeKey].resetTime < now) {
      rateLimitStore[storeKey] = {
        count: 0,
        resetTime: now + windowMs,
      };
    }
    
    const limit = rateLimitStore[storeKey];
    
    if (limit.count >= maxRequests) {
      return {
        success: false,
        limit: maxRequests,
        remaining: 0,
        reset: limit.resetTime,
        retryAfter: Math.ceil((limit.resetTime - now) / 1000), // seconds until reset
      };
    }
    
    limit.count++;
    
    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests - limit.count,
      reset: limit.resetTime,
    };
  };
}

export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    // First remove script tags completely including content
    let cleaned = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    // Then sanitize any remaining HTML
    cleaned = DOMPurify.sanitize(cleaned, { 
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true,
      RETURN_DOM: false,
      RETURN_DOM_FRAGMENT: false,
      FORCE_BODY: true,
    });
    
    return cleaned;
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  
  if (input && typeof input === 'object') {
    const sanitized: any = {};
    for (const key in input) {
      if (Object.prototype.hasOwnProperty.call(input, key)) {
        // Sanitize the key as well to prevent prototype pollution
        const sanitizedKey = sanitizeInput(key);
        sanitized[sanitizedKey] = sanitizeInput(input[key]);
      }
    }
    return sanitized;
  }
  
  return input;
}

export function validateCVData(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data || typeof data !== 'object') {
    errors.push('Invalid CV data structure');
    return { valid: false, errors };
  }
  
  // Validate required fields
  if (data.contact) {
    if (data.contact.email && !isValidEmail(data.contact.email)) {
      errors.push('Invalid email format');
    }
    if (data.contact.phone && !isValidPhone(data.contact.phone)) {
      errors.push('Invalid phone format');
    }
  }
  
  // Validate data sizes to prevent DoS
  const maxFieldLength = 10000;
  const maxArrayLength = 100;
  
  if (data.summary && data.summary.length > maxFieldLength) {
    errors.push('Summary exceeds maximum length');
  }
  
  if (data.experience && data.experience.length > maxArrayLength) {
    errors.push('Too many experience entries');
  }
  
  if (data.projects && data.projects.length > maxArrayLength) {
    errors.push('Too many project entries');
  }
  
  if (data.skills && data.skills.length > maxArrayLength) {
    errors.push('Too many skill entries');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPhone(phone: string): boolean {
  // Basic phone validation - digits, spaces, dashes, parentheses, and plus sign
  const phoneRegex = /^[\d\s\-\(\)\+]+$/;
  return phoneRegex.test(phone) && phone.length >= 7 && phone.length <= 20;
}

export function sanitizeAIPrompt(prompt: string): string {
  // Remove potential prompt injection attempts
  const injectionPatterns = [
    /ignore.*previous.*instructions?/gi,
    /forget.*everything/gi,
    /new.*instructions?:/gi,
    /system.*prompt/gi,
    /act.*as/gi,
    /pretend.*you.*are/gi,
    /bypass.*restrictions?/gi,
  ];
  
  let sanitized = prompt;
  for (const pattern of injectionPatterns) {
    sanitized = sanitized.replace(pattern, '[REMOVED]');
  }
  
  // Limit prompt length to prevent token abuse
  const maxPromptLength = 5000;
  if (sanitized.length > maxPromptLength) {
    sanitized = sanitized.substring(0, maxPromptLength);
  }
  
  return sanitized;
}