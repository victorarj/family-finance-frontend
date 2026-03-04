import type { ReactNode } from "react";

type BottomNavItem = {
  key: string;
  label: string;
  icon: ReactNode;
};

type BottomNavProps = {
  items: BottomNavItem[];
  activeKey: string;
  onChange: (key: string) => void;
  className?: string;
};

function cn(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

export default function BottomNav({ items, activeKey, onChange, className }: BottomNavProps) {
  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/80 backdrop-blur-xl",
        className,
      )}
      aria-label="Bottom navigation"
    >
      <div className="mx-auto grid w-full max-w-[480px] grid-cols-4 px-2 py-2">
        {items.map((item) => {
          const isActive = item.key === activeKey;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onChange(item.key)}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center rounded-md px-2 py-1 text-[11px] font-body transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isActive ? "bg-secondary text-primary" : "text-foreground/70 hover:text-foreground",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="mb-1 inline-flex items-center justify-center">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
