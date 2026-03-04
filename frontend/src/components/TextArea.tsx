import { forwardRef, type TextareaHTMLAttributes } from "react";

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean;
};

function cn(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, invalid = false, ...props }, ref) => (
    <textarea
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

TextArea.displayName = "TextArea";

export default TextArea;
