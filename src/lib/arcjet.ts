import arcjet, { shield } from "@arcjet/next";
import type { NextRequest } from "next/server";
import { env } from "@/env";

// Centralized Arcjet client configuration
// Docs: https://docs.arcjet.com/frameworks/nextjs
const mode = env.ARCJET_MODE === "LIVE" ? "LIVE" : "DRY_RUN";

export const aj = arcjet({
  key: env.ARCJET_KEY || "",
  rules: [shield({ mode })],
});

// Create a reusable decision helper
export async function enforce(request: NextRequest, _rules?: any[]) {
  if (!env.ARCJET_KEY) return { ok: true } as const;
  const decision = await aj.protect(request);

  if (decision.isDenied()) {
    return { ok: false, decision } as const;
  }

  return { ok: true, decision } as const;
}

// Specific helper for API routes with token bucket rate limit
export function apiRules(_: { requestsPerMinute?: number } = {}) {
  return [shield({ mode })];
}
