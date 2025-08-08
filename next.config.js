/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
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