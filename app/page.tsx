import DrawingCanvas from "@/components/canvas";
import AuthWrapper from "@/components/auth-wrapper";

export default function Home() {
  return (
    <AuthWrapper>
      <DrawingCanvas />
    </AuthWrapper>
  );
}
