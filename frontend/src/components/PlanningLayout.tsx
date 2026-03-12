import type { PropsWithChildren } from "react";
import Container from "./Container";

export default function PlanningLayout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-dvh bg-secondary">
      <Container size="xl">{children}</Container>
    </div>
  );
}
