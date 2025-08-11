import { headers } from 'next/headers';
import { useEffect, useState } from 'react';

// Server-side function to get nonce
export async function getCSPNonce(): Promise<string | undefined> {
  if (typeof window !== 'undefined') {
    throw new Error('getCSPNonce can only be called on the server side');
  }
  
  try {
    const headersList = await headers();
    return headersList.get('X-CSP-Nonce') || undefined;
  } catch (error) {
    console.warn('Failed to get CSP nonce:', error);
    return undefined;
  }
}

// Client-side hook to get nonce from meta tag (if needed)
export function useCSPNonce(): string | undefined {
  const [nonce, setNonce] = useState<string | undefined>();
  
  useEffect(() => {
    // Try to get nonce from meta tag if it was set by the server
    const metaTag = document.querySelector('meta[name="csp-nonce"]');
    if (metaTag) {
      setNonce(metaTag.getAttribute('content') || undefined);
    }
  }, []);
  
  return nonce;
}

// Utility to create script tag with nonce
export function createScriptWithNonce(src: string, nonce?: string): HTMLScriptElement {
  const script = document.createElement('script');
  script.src = src;
  
  if (nonce) {
    script.setAttribute('nonce', nonce);
  }
  
  return script;
}