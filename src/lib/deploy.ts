export const isCloudflareStatic = process.env.NEXT_PUBLIC_DEPLOY_TARGET === 'cloudflare';
// Disable AI features by default on Cloudflare static export (no Next.js API routes)
export const isAIAvailable = process.env.NEXT_PUBLIC_DISABLE_AI === 'true'
  ? false
  : !isCloudflareStatic;
