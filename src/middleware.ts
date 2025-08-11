import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { env } from '@/env';
import { generateCSPNonce, getSecurityHeaders } from '@/lib/csp';
import { enforce } from '@/lib/arcjet';

const isProtectedRoute = createRouteMatcher([
  '/admin(.*)',
  '/api/ai(.*)',
  '/api/generate-cover-letter'
]);

const hasClerk = Boolean(env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && env.CLERK_SECRET_KEY);

function addSecurityHeaders(response: NextResponse, request: NextRequest): NextResponse {
  // Generate CSP nonce for this request
  const nonce = generateCSPNonce();
  
  // Add nonce to response headers so it can be accessed by components
  response.headers.set('X-CSP-Nonce', nonce);
  
  // Apply all security headers including nonce-based CSP
  const securityHeaders = getSecurityHeaders(nonce);
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}

export default hasClerk
  ? clerkMiddleware(async (auth, req) => {
      // Arcjet protection (bots, shield, etc.)
      const protection = await enforce(req);
      if (!protection.ok) {
        return NextResponse.json({ error: 'Request blocked' }, { status: 403 });
      }

      if (isProtectedRoute(req)) {
        await auth.protect();
      }

      // Add security headers to the response
      const response = NextResponse.next();
      return addSecurityHeaders(response, req);
    })
  : async function middleware(request: NextRequest) {
      // Arcjet protection when Clerk is disabled
      const protection = await enforce(request);
      if (!protection.ok) {
        return NextResponse.json({ error: 'Request blocked' }, { status: 403 });
      }

      const response = NextResponse.next();
      return addSecurityHeaders(response, request);
    };

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};