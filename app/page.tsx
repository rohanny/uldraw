"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import DrawingCanvas from "@/components/canvas";
import AuthWrapper from "@/components/auth";

function HomeContent() {
  const searchParams = useSearchParams();
  const room = searchParams.get("room");
  
  // If there's a room parameter, use global mode for private room
  // Otherwise use local mode
  const mode = room ? "global" : "local";
  
  return (
    <AuthWrapper requireAuth={false}>
      <DrawingCanvas mode={mode} />
    </AuthWrapper>
  );
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}
