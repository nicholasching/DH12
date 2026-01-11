"use client";

import { ConvexProvider as ConvexProviderBase } from "convex/react";
import { ConvexReactClient } from "convex/react";
import { ReactNode, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL!;

if (!convexUrl) {
  throw new Error("Missing NEXT_PUBLIC_CONVEX_URL environment variable");
}

const convex = new ConvexReactClient(convexUrl);

function UserSyncer() {
  const { user } = useUser();
  const storeUser = useMutation(api.users.store);

  useEffect(() => {
    if (user) {
      storeUser({
        tokenIdentifier: user.id,
        name: user.fullName || user.username || "Anonymous",
        email: user.emailAddresses[0]?.emailAddress,
        image: user.imageUrl,
      });
    }
  }, [user, storeUser]);

  return null;
}

export function ConvexProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProviderBase client={convex}>
      <UserSyncer />
      {children}
    </ConvexProviderBase>
  );
}
