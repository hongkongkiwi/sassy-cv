import { Metadata } from 'next';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../convex/_generated/api';
import { env } from '@/env';

interface CVLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  
  try {
    const client = new ConvexHttpClient(env.NEXT_PUBLIC_CONVEX_URL);
    const workspace = await client.query(api.workspaces.getWorkspaceBySlug, { slug });
    
    if (!workspace) {
      return {
        title: 'CV Not Found',
        description: 'The requested CV could not be found.',
        robots: {
          index: false,
          follow: false,
        },
      };
    }
    
    // Check if CV should be indexed by search engines
    const shouldIndex = workspace.privacy.level === 'public' && workspace.privacy.allowSearchEngines;
    
    const title = `${workspace.name} - Professional CV`;
    const description = workspace.description || `Professional CV and resume for ${workspace.name}`;
    
    const metadata: Metadata = {
      title,
      description,
      robots: {
        index: shouldIndex,
        follow: shouldIndex,
        noarchive: !shouldIndex,
        nosnippet: !shouldIndex,
      },
      openGraph: shouldIndex ? {
        title,
        description,
        type: 'profile',
        url: `/cv/${slug}`,
      } : undefined,
      twitter: shouldIndex ? {
        card: 'summary',
        title,
        description,
      } : undefined,
    };
    
    // Add noindex for non-public CVs
    if (!shouldIndex) {
      metadata.other = {
        'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet',
      };
    }
    
    return metadata;
  } catch (error) {
    console.error('Error generating metadata:', error);
    
    return {
      title: 'Professional CV',
      description: 'Professional CV and resume',
      robots: {
        index: false,
        follow: false,
      },
    };
  }
}

export default function CVLayout({ children }: CVLayoutProps) {
  return <>{children}</>;
}