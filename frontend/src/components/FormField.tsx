import type { PropsWithChildren } from "react";

type FormFieldProps = PropsWithChildren<{
  label: string;
  required?: boolean;
  helperText?: string;
  error?: string;
  className?: string;
}>;

function cn(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

export default function FormField({
  label,
  required = false,
  helperText,
  error,
  className,
  children,
}: FormFieldProps) {
  return (
    <label className={cn("block space-y-1 text-sm", className)}>
      <span className="text-muted-foreground">
        {label}
        {required ? " *" : ""}
      </span>
      {children}
      {(error || helperText) && (
        <span className={cn("block text-xs", error ? "text-expense" : "text-muted-foreground")}>
          {error || helperText}
        </span>
      )}
    </label>
  );
}
