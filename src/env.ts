import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    // Clerk Authentication - Required for admin functionality
    CLERK_SECRET_KEY: z.string().min(1),
    CLERK_WEBHOOK_SECRET: z.string().optional(),
    
    // AI API Keys - At least one required for AI features
    OPENAI_API_KEY: z.string().optional(),
    GOOGLE_GENERATIVE_AI_API_KEY: z.string().optional(),
    
    // Node Environment
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    
    // Deployment Target
    DEPLOY_TARGET: z.enum(["cloudflare", "vercel"]).optional(),
    
    // Security
    RATE_LIMIT_API_REQUESTS_PER_MINUTE: z.coerce.number().default(100),
    RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
    ALLOWED_ORIGINS: z.string().optional(),

    // Arcjet
    ARCJET_KEY: z.string().optional(),
    ARCJET_MODE: z.enum(["LIVE", "DRY_RUN"]).optional(),
    
    // LinkedIn Import
    LINKEDIN_CLIENT_ID: z.string().optional(),
    LINKEDIN_CLIENT_SECRET: z.string().optional(),
    
    // Analytics
    VERCEL_ANALYTICS_ID: z.string().optional(),
    
    // Feature Flags
    ENABLE_LINKEDIN_IMPORT: z.coerce.boolean().default(false),
    ENABLE_AI_FEATURES: z.coerce.boolean().default(true),
  },
  
  client: {
    // Convex - Required for database functionality
    NEXT_PUBLIC_CONVEX_URL: z.string().url(),
    
    // Clerk Authentication - Required for admin functionality
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().default("/admin/sign-in"),
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string().default("/admin/sign-up"),
    NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: z.string().default("/admin"),
    NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: z.string().default("/admin"),
    
    // App Configuration
    NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
    NEXT_PUBLIC_APP_NAME: z.string().default("Sassy CV"),
    NEXT_PUBLIC_DEFAULT_THEME: z.enum(["modern", "classic", "minimal", "dark"]).default("modern"),
    NEXT_PUBLIC_PUBLIC_USER_ID: z.string().optional(),
    
    // Feature Flags
    NEXT_PUBLIC_ENABLE_ANALYTICS: z.coerce.boolean().default(true),
    NEXT_PUBLIC_ENABLE_PDF_EXPORT: z.coerce.boolean().default(true),
  },
  
  runtimeEnv: {
    // Server
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    CLERK_WEBHOOK_SECRET: process.env.CLERK_WEBHOOK_SECRET,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    NODE_ENV: process.env.NODE_ENV,
    DEPLOY_TARGET: process.env.DEPLOY_TARGET,
    RATE_LIMIT_API_REQUESTS_PER_MINUTE: process.env.RATE_LIMIT_API_REQUESTS_PER_MINUTE,
    RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS,
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
    ARCJET_KEY: process.env.ARCJET_KEY,
    ARCJET_MODE: process.env.ARCJET_MODE,
    LINKEDIN_CLIENT_ID: process.env.LINKEDIN_CLIENT_ID,
    LINKEDIN_CLIENT_SECRET: process.env.LINKEDIN_CLIENT_SECRET,
    VERCEL_ANALYTICS_ID: process.env.VERCEL_ANALYTICS_ID,
    ENABLE_LINKEDIN_IMPORT: process.env.ENABLE_LINKEDIN_IMPORT,
    ENABLE_AI_FEATURES: process.env.ENABLE_AI_FEATURES,
    
    // Client
    NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
    NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL,
    NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_DEFAULT_THEME: process.env.NEXT_PUBLIC_DEFAULT_THEME,
    NEXT_PUBLIC_PUBLIC_USER_ID: process.env.NEXT_PUBLIC_PUBLIC_USER_ID,
    NEXT_PUBLIC_ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS,
    NEXT_PUBLIC_ENABLE_PDF_EXPORT: process.env.NEXT_PUBLIC_ENABLE_PDF_EXPORT,
  },
  
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  
  emptyStringAsUndefined: true,
  
  // Custom validation for AI features
  onValidationError: (error) => {
    console.error("❌ Invalid environment variables:", error.issues);
    throw new Error("Invalid environment variables");
  },
  
  onInvalidAccess: (variable) => {
    console.error(`❌ Attempted to access invalid environment variable: ${variable}`);
    throw new Error(`Invalid environment variable: ${variable}`);
  },
});

// Validate that at least one AI provider is configured if AI features are enabled
if (env.ENABLE_AI_FEATURES && !env.OPENAI_API_KEY && !env.GOOGLE_GENERATIVE_AI_API_KEY) {
  console.warn("⚠️ AI features are enabled but no AI provider API keys are configured. AI features will be disabled.");
}