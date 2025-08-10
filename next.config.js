/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_DEPLOY_TARGET: process.env.DEPLOY_TARGET,
    NEXT_PUBLIC_PUBLIC_USER_ID: process.env.NEXT_PUBLIC_PUBLIC_USER_ID,
    NEXT_PUBLIC_DISABLE_AI: process.env.NEXT_PUBLIC_DISABLE_AI,
  },
  
  // Enable static exports for Cloudflare Pages deployment
  output: process.env.DEPLOY_TARGET === 'cloudflare' ? 'export' : undefined,
  
  // Disable image optimization for static export
  images: process.env.DEPLOY_TARGET === 'cloudflare' ? {
    unoptimized: true
  } : undefined,
  
  // Configure trailing slash for static export
  trailingSlash: process.env.DEPLOY_TARGET === 'cloudflare' ? true : false,
  
  // Disable server-side features for static export
  ...(process.env.DEPLOY_TARGET === 'cloudflare' && {
    experimental: {
      runtime: 'edge'
    }
  })
}

module.exports = nextConfig