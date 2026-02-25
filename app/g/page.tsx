import DrawingCanvas from "@/components/canvas";
import AuthWrapper from "@/components/auth";

export default function GlobalMode() {
  return (
    <AuthWrapper requireAuth={false}>
      <DrawingCanvas mode="global" />
    </AuthWrapper>
  );
}
