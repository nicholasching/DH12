"use client";

import { ClerkProvider as ClerkProviderBase } from "@clerk/nextjs";
import { ReactNode } from "react";

/**
 * Wrapper for ClerkProvider that ensures correct origin handling
 * for both localhost and IP address access.
 * 
 * Note: You also need to configure your IP address in the Clerk Dashboard:
 * 1. Go to https://dashboard.clerk.com
 * 2. Navigate to your application settings
 * 3. Add your IP address (e.g., http://192.168.x.x:3000) to the allowed origins
 */
export function ClerkProviderWrapper({ children }: { children: ReactNode }) {
  return (
    <ClerkProviderBase
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/dashboard"
    >
      {children}
    </ClerkProviderBase>
  );
}
