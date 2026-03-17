import type { ReactNode } from "react";
import { Drawer } from "vaul";
import { useViewportMode } from "../hooks/useViewport";

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
  title = "Nova transação",
  description = "Crie um novo lançamento financeiro.",
  children,
}: TransactionSheetProps) {
  const viewportMode = useViewportMode();
  const largeScreen = viewportMode !== "mobile";

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-overlay bg-foreground/30" />
        <Drawer.Content
          data-vaul-no-drag
          className={`fixed z-modal flex w-full flex-col bg-surface-elevated shadow-elevated outline-none transition-transform duration-150 ease-out ${
            largeScreen
              ? "left-1/2 top-1/2 !h-auto max-h-[min(82vh,880px)] max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl"
              : "inset-x-0 bottom-0 mx-auto max-h-[92dvh] max-w-screen-sm rounded-t-3xl"
          }`}
          data-sheet-mode={largeScreen ? "dialog" : "drawer"}
        >
          <div
            className="sticky top-0 z-sticky bg-surface-elevated px-4 pb-3 pt-4 sm:px-5"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted-foreground/35" />
            <Drawer.Title className="font-display text-lg text-foreground">
              {title}
            </Drawer.Title>
            <Drawer.Description className="mt-1 font-body text-sm text-foreground/70">
              {description}
            </Drawer.Description>
          </div>
          <div className="overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] sm:px-5 sm:pb-8">
            <div className="pt-1">{children}</div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
