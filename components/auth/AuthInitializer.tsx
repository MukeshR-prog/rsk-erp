"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/useAuthStore";

const PUBLIC_ROUTES = ["/login", "/auth/callback"];

export default function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { user, setUser, setLoading, setInitialized, initialized } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        setLoading(true);
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (mounted) {
          setUser(session?.user ?? null);
          setInitialized(true);
        }
      } catch (error) {
        console.error("Auth initialization failed:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initAuth();

    // Listen for auth state shifts
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUser(session?.user ?? null);
        setInitialized(true);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setUser, setLoading, setInitialized]);

  // Route Guard routing logic
  useEffect(() => {
    if (!initialized) return;

    const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));

    if (!user && !isPublicRoute) {
      // Force redirect to login page if unauthenticated
      router.push("/login");
    } else if (user && isPublicRoute) {
      // If user is logged in and trying to access login/callback, redirect to dashboard
      router.push("/");
    }
  }, [user, initialized, pathname, router]);

  return <>{children}</>;
}
