import type { PropsWithChildren } from "react";

export default function Container({ children }: PropsWithChildren) {
  return <div className="w-full max-w-[480px] mx-auto p-4">{children}</div>;
}
