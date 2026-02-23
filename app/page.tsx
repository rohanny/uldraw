import DrawingCanvas from "@/components/canvas";
import AuthWrapper from "@/components/auth";

export default function Home() {
  return (
    <AuthWrapper>
      <DrawingCanvas />
    </AuthWrapper>
  );
}
