"use client";

import { ReactNode } from "react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useAuth } from "@clerk/nextjs";
import { ConvexReactClient, ConvexProvider } from "convex/react";
import { env } from "@/env";

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const convexUrl = env.NEXT_PUBLIC_CONVEX_URL;
  const hasClerk = Boolean(env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  if (!convexUrl) {
    return (
      <div className="p-6 text-sm text-gray-700">
        Convex is not configured. Set `NEXT_PUBLIC_CONVEX_URL` in your `.env.local`.
      </div>
    );
  }

  const convex = new ConvexReactClient(convexUrl);

  if (hasClerk) {
    return <ConvexWithClerk client={convex}>{children}</ConvexWithClerk>;
  }
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}

function ConvexWithClerk({ client, children }: { client: ConvexReactClient; children: ReactNode }) {
  const auth = useAuth();
  return (
    <ConvexProviderWithClerk client={client} useAuth={() => auth}>
      {children}
    </ConvexProviderWithClerk>
  );
}