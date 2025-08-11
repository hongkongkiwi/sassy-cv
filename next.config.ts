import type { NextConfig } from 'next';

// Import env to validate at build time
import './src/env';

// Bundle analyzer configuration
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
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
  }),
  
  // Bundle optimization
  experimental: {
    optimizePackageImports: ['react-pdf'],
  },
  
  // Webpack optimization
  webpack: (config, { dev, isServer }) => {
    // Optimize bundle splitting
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks.cacheGroups,
            // Separate chunk for AI SDK
            aiSdk: {
              test: /[\\/]node_modules[\\/](@ai-sdk|ai)[\\/]/,
              name: 'ai-sdk',
              chunks: 'all',
              priority: 30,
            },
            // Separate chunk for Clerk
            clerk: {
              test: /[\\/]node_modules[\\/]@clerk[\\/]/,
              name: 'clerk',
              chunks: 'all',
              priority: 25,
            },
            // Separate chunk for Convex
            convex: {
              test: /[\\/]node_modules[\\/]convex[\\/]/,
              name: 'convex',
              chunks: 'all',
              priority: 20,
            },
            // Separate chunk for React PDF (large library)
            reactPdf: {
              test: /[\\/]node_modules[\\/]@react-pdf[\\/]/,
              name: 'react-pdf',
              chunks: 'all',
              priority: 15,
            },
          },
        },
      };
    }
    
    return config;
  },
}

export default withBundleAnalyzer(nextConfig);