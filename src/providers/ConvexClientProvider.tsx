"use client";

import { ReactNode } from "react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useAuth } from "@clerk/nextjs";
import { ConvexReactClient, ConvexProvider } from "convex/react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const hasClerk = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  if (hasClerk) {
    return (
      <ConvexProviderWithClerk client={convex} useAuth={() => auth}>
        {children}
      </ConvexProviderWithClerk>
    );
  }
  // Fallback provider without Clerk (public pages only)
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}