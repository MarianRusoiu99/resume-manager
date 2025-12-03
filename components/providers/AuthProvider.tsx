"use client";

import { useEffect, useRef, useCallback } from "react";
import { SessionProvider, useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";

// Public routes that don't require authentication
const publicRoutes = ["/login", "/register", "/public"];

// Global event for session expiry (can be triggered from anywhere)
const SESSION_EXPIRED_EVENT = "session:expired";

/**
 * Trigger session expiry from anywhere in the app
 * Call this when an API request returns 401/403
 */
export function triggerSessionExpiry() {
  globalThis.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
}

function SessionMonitor({ children }: { readonly children: React.ReactNode }) {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const wasAuthenticated = useRef(false);
  const isHandlingExpiry = useRef(false);

  // Handle session expiry - logout and redirect
  const handleSessionExpiry = useCallback(async () => {
    // Prevent multiple simultaneous expiry handlers
    if (isHandlingExpiry.current) return;
    isHandlingExpiry.current = true;

    try {
      await signOut({ redirect: false });
      router.push("/login");
      router.refresh();
    } finally {
      // Reset after a delay to allow for redirect
      setTimeout(() => {
        isHandlingExpiry.current = false;
      }, 1000);
    }
  }, [router]);

  // Listen for session expiry events (triggered by failed API calls)
  useEffect(() => {
    const handleExpiredEvent = () => {
      if (wasAuthenticated.current && !publicRoutes.some((route) => pathname.startsWith(route))) {
        handleSessionExpiry();
      }
    };

    globalThis.addEventListener(SESSION_EXPIRED_EVENT, handleExpiredEvent);
    return () => globalThis.removeEventListener(SESSION_EXPIRED_EVENT, handleExpiredEvent);
  }, [handleSessionExpiry, pathname]);

  // Track authentication state changes
  useEffect(() => {
    if (status === "authenticated") {
      wasAuthenticated.current = true;
    }

    // Handle natural session expiry detected by NextAuth
    if (
      wasAuthenticated.current &&
      status === "unauthenticated" &&
      !publicRoutes.some((route) => pathname.startsWith(route))
    ) {
      router.push("/login");
      router.refresh();
    }
  }, [status, router, pathname]);

  return <>{children}</>;
}

export function AuthProvider({ children }: { readonly children: React.ReactNode }) {
  return (
    <SessionProvider 
      // Only refetch on window focus, no constant polling
      refetchOnWindowFocus={true}
    >
      <SessionMonitor>{children}</SessionMonitor>
    </SessionProvider>
  );
}
