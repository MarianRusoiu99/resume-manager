"use client";

import { useEffect, useRef } from "react";
import { SessionProvider, useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";

// Public routes that don't require authentication
const publicRoutes = ["/login", "/register", "/public"];

function SessionMonitor({ children }: { readonly children: React.ReactNode }) {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const wasAuthenticated = useRef(false);

  useEffect(() => {
    // Track when user becomes authenticated
    if (status === "authenticated") {
      wasAuthenticated.current = true;
    }

    // If user was authenticated and session expires, redirect to login
    // Only redirect if not already on a public route
    if (
      wasAuthenticated.current &&
      status === "unauthenticated" &&
      !publicRoutes.some((route) => pathname.startsWith(route))
    ) {
      router.push("/login");
    }
  }, [status, router, pathname]);

  return <>{children}</>;
}

export function AuthProvider({ children }: { readonly children: React.ReactNode }) {
  return (
    <SessionProvider refetchInterval={5 * 60} refetchOnWindowFocus={true}>
      <SessionMonitor>{children}</SessionMonitor>
    </SessionProvider>
  );
}
