import { NextResponse } from 'next/server';
import { env } from '@/env';

const allowedOrigins = env.NODE_ENV === 'production' 
  ? [
      env.NEXT_PUBLIC_SITE_URL || 'https://sassy-cv.pages.dev',
      'https://sassy-cv.vercel.app',
      ...(env.ALLOWED_ORIGINS ? env.ALLOWED_ORIGINS.split(',').map(o => o.trim()) : [])
    ].filter(Boolean)
  : ['http://localhost:3000', 'http://127.0.0.1:3000'];

export function corsHeaders(origin?: string | null) {
  const headers = new Headers();
  
  // Check if origin is allowed
  if (origin && allowedOrigins.includes(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
  } else if (env.NODE_ENV === 'development') {
    // In development, allow any localhost origin
    headers.set('Access-Control-Allow-Origin', '*');
  }
  
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  headers.set('Access-Control-Max-Age', '86400'); // 24 hours
  
  return headers;
}

export function handleCors(request: Request): NextResponse | null {
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    const origin = request.headers.get('origin');
    const headers = corsHeaders(origin);
    
    return new NextResponse(null, { 
      status: 200,
      headers 
    });
  }
  
  return null;
}

export function withCors(response: NextResponse, request: Request): NextResponse {
  const origin = request.headers.get('origin');
  const corsHeadersList = corsHeaders(origin);
  
  // Apply CORS headers to the response
  corsHeadersList.forEach((value, key) => {
    response.headers.set(key, value);
  });
  
  return response;
}