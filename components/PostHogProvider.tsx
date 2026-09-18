"use client";

import { useEffect } from "react";
import { initPostHog } from "@/lib/posthog";

/**
 * Boots PostHog once on the client. Renders nothing extra; with no
 * NEXT_PUBLIC_POSTHOG_KEY it does nothing at all.
 */
export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initPostHog();
  }, []);
  return <>{children}</>;
}
