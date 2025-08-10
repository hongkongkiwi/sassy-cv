import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { ConvexClientProvider } from '@/providers/ConvexClientProvider'
import { ThemeProvider } from '@/contexts/ThemeContext'
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
  return (
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      <html lang="en">
        <body className="antialiased">
          <ConvexClientProvider>
            <ThemeProvider>
              {children}
            </ThemeProvider>
          </ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}