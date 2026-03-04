import type { ReactNode } from "react";
import { Drawer } from "vaul";

type TransactionSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: ReactNode;
};

export default function TransactionSheet({
  open,
  onOpenChange,
  title = "New transaction",
  description = "Create a new household transaction entry.",
  children,
}: TransactionSheetProps) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-foreground/30" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[85dvh] w-full max-w-[480px] flex-col rounded-xl bg-surface-elevated shadow-elevated outline-none transition-transform duration-300 ease-out">
          <div className="sticky top-0 z-10 rounded-t-xl bg-surface-elevated px-4 pt-4 pb-3">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-border" />
            <Drawer.Title className="font-display text-lg text-foreground">{title}</Drawer.Title>
            <Drawer.Description className="mt-1 font-body text-sm text-foreground/70">
              {description}
            </Drawer.Description>
          </div>
          <div className="overflow-y-auto px-4 pb-6">
            <div className="pt-1">{children}</div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
