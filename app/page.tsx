"use client";

import { useSearchParams } from "next/navigation";
import DrawingCanvas from "@/components/canvas";
import AuthWrapper from "@/components/auth";

export default function Home() {
  const searchParams = useSearchParams();
  const room = searchParams.get("room");
  
  // If there's a room parameter, use global mode for private room
  // Otherwise use local mode
  const mode = room ? "global" : "local";
  
  return (
    <AuthWrapper>
      <DrawingCanvas mode={mode} />
    </AuthWrapper>
  );
}
