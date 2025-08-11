import { env } from '@/env';

export const isCloudflareStatic = env.DEPLOY_TARGET === 'cloudflare';
// Disable AI features by default on Cloudflare static export (no Next.js API routes)
export const isAIAvailable = !env.ENABLE_AI_FEATURES
  ? false
  : !isCloudflareStatic;
