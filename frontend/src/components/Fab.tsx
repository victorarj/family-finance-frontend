import { motion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";

type FabProps = Omit<HTMLMotionProps<"button">, "children"> & {
  icon: ReactNode;
  onClick?: () => void;
  label: string;
  className?: string;
};

function cn(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

export default function Fab({ icon, onClick, label, className, type = "button", ...props }: FabProps) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      aria-label={label}
      whileTap={{ scale: 0.96 }}
      className={cn(
        "fixed right-4 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-fab focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [bottom:calc(var(--mobile-nav-height)+0.75rem+env(safe-area-inset-bottom))] md:bottom-6 md:right-6 lg:bottom-8 lg:right-8",
        className,
      )}
      {...props}
    >
      {icon}
    </motion.button>
  );
}
