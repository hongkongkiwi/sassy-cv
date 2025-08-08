# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `pnpm run dev` - Start Next.js development server
- `pnpm run build` - Build for production (Vercel target)
- `pnpm run build:static` - Build static export for Cloudflare Pages
- `pnpm run start` - Start production server
- `pnpm run lint` - Run Next.js linting
- `pnpm run type-check` - Run TypeScript type checking

### Convex Backend
- `pnpm run convex:dev` - Start Convex development mode (auto-syncs schema)
- `pnpm run convex:deploy` - Deploy Convex functions to production
- `npx convex dev` - Initial Convex setup (creates project if needed)

### Deployment
- `pnpm run deploy` - Deploy to Cloudflare Pages production
- `pnpm run deploy:staging` - Deploy to Cloudflare Pages staging
- `pnpm run deploy:vercel` - Deploy to Vercel production
- `pnpm run deploy:vercel:staging` - Deploy to Vercel staging

## Architecture Overview

This is a **Sassy CV** - a self-hosted personal CV platform that serves as an alternative to SaaS CV services. The application provides a public CV view with a private admin dashboard.

### Tech Stack
- **Frontend**: Next.js 15 + React 19 + TypeScript + Tailwind CSS 4
- **Backend**: Convex (serverless functions and database)
- **Authentication**: Clerk (invitation-only access)
- **AI Integration**: OpenAI GPT-4 & Google Gemini for CV analysis
- **PDF Generation**: React-PDF
- **Deployment**: Cloudflare Pages (primary) or Vercel (alternative)

### Key Architecture Patterns

**Multi-deployment Configuration**: The app uses `DEPLOY_TARGET` environment variable to configure builds for different platforms:
- `DEPLOY_TARGET=cloudflare` - Static export for Cloudflare Pages
- `DEPLOY_TARGET=vercel` - Server-side rendering for Vercel
- Default - Standard Next.js build

**Database Schema**: All data is stored in Convex with user isolation via `userId` (Clerk):
- `contactInfo` - User's contact details and professional summary
- `experiences` - Work history with descriptions and technologies
- `skills` - Categorized technical skills
- `projects` - Personal/professional projects  
- `education` - Academic background
- `analytics` - CV view tracking and visitor analytics
- `themes` - CV visual themes and customization
- `coverLetters` - AI-generated cover letters
- `linkedinImports` - LinkedIn profile import data

**Authentication Flow**: 
- Public CV accessible to all visitors at `/`
- Admin dashboard at `/admin/*` requires Clerk authentication
- User management handled through Clerk dashboard (invitation-only)

**AI Integration Pattern**:
- AI providers abstracted in `/lib/ai-providers.ts`
- Supports OpenAI and Google AI with easy switching
- AI features: CV analysis, content rewriting, cover letter generation
- All AI calls require authentication and use structured outputs

### Important File Locations

**Core Configuration**:
- `convex/schema.ts` - Database schema definitions
- `src/types/cv.ts` - TypeScript interfaces for CV data
- `src/lib/ai-providers.ts` - AI model configuration and switching

**Key Components**:
- `src/app/page.tsx` - Public CV display
- `src/app/admin/` - Admin dashboard pages
- `src/components/AdminLayout.tsx` - Admin dashboard wrapper
- `src/components/ai/` - AI-powered features
- `src/contexts/ThemeContext.tsx` - Theme management

**API Routes**:
- `src/app/api/ai/analyze-cv/route.ts` - CV analysis endpoint
- `src/app/api/ai/rewrite-section/route.ts` - Content improvement
- `src/app/api/generate-cover-letter/route.ts` - Cover letter generation

### Environment Variables Required

```env
# Core Services
NEXT_PUBLIC_CONVEX_URL=your-convex-deployment-url
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
CLERK_SECRET_KEY=your-clerk-secret-key

# AI Providers (optional)
OPENAI_API_KEY=your-openai-key
GOOGLE_GENERATIVE_AI_API_KEY=your-google-ai-key

# Deployment Target
DEPLOY_TARGET=cloudflare # or vercel
```

### Development Workflow

1. **Initial Setup**: Run `npx convex dev` to create Convex project and generate schema types
2. **Schema Changes**: Modify `convex/schema.ts`, schema auto-syncs in dev mode
3. **AI Features**: Require API keys in `.env.local` to function
4. **User Management**: Add users through Clerk dashboard for admin access
5. **Testing**: No test framework configured - manual testing via admin dashboard

### Deployment Notes

**Cloudflare Pages (Primary)**:
- Uses static export with edge runtime
- Automated deployment via GitHub Actions
- Requires Wrangler configuration in `wrangler.toml`

**Analytics Implementation**: 
- Custom analytics stored in Convex `analytics` table
- Tracks page views, PDF downloads, visitor info
- No external analytics services used

### Content Management

The app uses a hybrid approach:
- Static default data in `src/data/cv-data.ts` (fallback)
- Dynamic data stored in Convex database
- Admin dashboard allows CRUD operations on all CV sections
- LinkedIn import feature for bulk data population