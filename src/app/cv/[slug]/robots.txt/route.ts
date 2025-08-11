import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../convex/_generated/api';
import { env } from '@/env';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  
  try {
    const client = new ConvexHttpClient(env.NEXT_PUBLIC_CONVEX_URL);
    
    // Get workspace to check privacy settings
    const workspace = await client.query(api.workspaces.getWorkspaceBySlug, { slug });
    
    if (!workspace) {
      return new NextResponse('User-agent: *\nDisallow: /', {
        headers: { 'Content-Type': 'text/plain' },
      });
    }
    
    // Generate robots.txt based on privacy settings
    let robotsContent = 'User-agent: *\n';
    
    if (workspace.privacy.level === 'public' && workspace.privacy.allowSearchEngines) {
      // Allow indexing for public CVs
      robotsContent += 'Allow: /\n';
      robotsContent += `Sitemap: ${new URL('/sitemap.xml', request.url).toString()}\n`;
    } else {
      // Disallow indexing for non-public or non-indexable CVs
      robotsContent += 'Disallow: /\n';
    }
    
    return new NextResponse(robotsContent, {
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      },
    });
  } catch (error) {
    console.error('Error generating robots.txt:', error);
    
    // Default to disallow on error
    return new NextResponse('User-agent: *\nDisallow: /', {
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}