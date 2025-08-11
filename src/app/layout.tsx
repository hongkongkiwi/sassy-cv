import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { ConvexClientProvider } from '@/providers/ConvexClientProvider'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { env } from '@/env'
import './globals.css'

export const metadata: Metadata = {
  title: 'CV - Principal Software Engineer',
  description: 'Professional CV and resume for Principal Software Engineer with 14 years experience',
}

export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const hasClerk = Boolean(env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  const app = (
    <html lang="en">
      <body className="antialiased">
        <ErrorBoundary>
          <ConvexClientProvider>
            <ThemeProvider>
              {children}
            </ThemeProvider>
          </ConvexClientProvider>
        </ErrorBoundary>
      </body>
    </html>
  );

  return hasClerk ? (
    <ClerkProvider publishableKey={env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      {app}
    </ClerkProvider>
  ) : (
    app
  );
}