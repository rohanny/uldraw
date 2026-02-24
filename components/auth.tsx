"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function AuthLogic({ 
  children,
  requireAuth = true
}: { 
  children: React.ReactNode;
  requireAuth?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const getRedirectUrl = () => {
      const currentUrl = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
      // Prevent encoding an already redirecting login URL itself
      if (pathname === "/login" || pathname === "/register") return "/login";
      return `/login?redirect=${encodeURIComponent(currentUrl)}`;
    };

    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      const isAuthPage = pathname === '/login' || pathname === '/register';

      if (requireAuth && !session) {
        if (!isAuthPage) router.replace(getRedirectUrl());
      } else if (!requireAuth && session) {
        const redirectUrl = searchParams.get("redirect") || "/";
        router.replace(redirectUrl);
      } else {
        setChecking(false);
      }
    };
    
    checkUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const isAuthPage = pathname === '/login' || pathname === '/register';
      
      if (requireAuth && !session) {
        if (!isAuthPage) router.replace(getRedirectUrl());
      } else if (!requireAuth && session) {
        const redirectUrl = searchParams.get("redirect") || "/";
        router.replace(redirectUrl);
      }
    });

    return () => subscription.unsubscribe();
  }, [router, requireAuth, pathname, searchParams]);

  if (checking) return null;

  return <>{children}</>;
}

export default function AuthWrapper(props: { children: React.ReactNode; requireAuth?: boolean }) {
  return (
    <Suspense fallback={null}>
      <AuthLogic {...props} />
    </Suspense>
  );
}
