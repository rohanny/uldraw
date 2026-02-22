"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthWrapper({ 
  children,
  requireAuth = true
}: { 
  children: React.ReactNode;
  requireAuth?: boolean;
}) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (requireAuth && !session) {
        router.push("/login");
      } else if (!requireAuth && session) {
        router.replace("/");
      } else {
        setChecking(false);
      }
    };
    
    checkUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (requireAuth && !session) {
        router.push("/login");
      } else if (!requireAuth && session) {
        router.replace("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [router, requireAuth]);

  if (checking) return null;

  return <>{children}</>;
}
