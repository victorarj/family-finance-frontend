import type { PropsWithChildren } from "react";
import Container from "./Container";

export default function PlanningLayout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-secondary">
      <Container>{children}</Container>
    </div>
  );
}
