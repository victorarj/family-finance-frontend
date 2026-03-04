import type { PropsWithChildren } from "react";

type CardProps = PropsWithChildren<{
  className?: string;
  padded?: boolean;
}>;

export default function Card({ children, className = "", padded = true }: CardProps) {
  const baseClasses = "rounded-2xl bg-card shadow-card";
  const paddingClass = padded ? "p-4" : "";

  return <div className={`${baseClasses} ${paddingClass} ${className}`.trim()}>{children}</div>;
}
