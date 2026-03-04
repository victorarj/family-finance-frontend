import { forwardRef, type InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

function cn(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid = false, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground outline-none transition",
        invalid
          ? "border-expense focus:border-expense focus:ring-2 focus:ring-expense"
          : "border-border focus:border-primary focus:ring-2 focus:ring-primary",
        className,
      )}
      {...props}
    />
  ),
);

Input.displayName = "Input";

export default Input;
