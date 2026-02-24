import DrawingCanvas from "@/components/canvas";
import AuthWrapper from "@/components/auth";

export default function GlobalMode() {
  return (
    <AuthWrapper>
      <DrawingCanvas mode="global" />
    </AuthWrapper>
  );
}
