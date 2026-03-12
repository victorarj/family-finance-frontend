import type { PropsWithChildren } from "react";

type ContainerProps = PropsWithChildren<{
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}>;

function cn(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

const sizeClasses = {
  sm: "max-w-2xl",
  md: "max-w-4xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
};

export default function Container({
  children,
  className,
  size = "lg",
}: ContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8",
        sizeClasses[size],
        className,
      )}
    >
      {children}
    </div>
  );
}
