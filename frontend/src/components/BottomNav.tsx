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

export default function BottomNav({
  items,
  activeKey,
  onChange,
  className,
}: BottomNavProps) {
  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/85 backdrop-blur-xl",
        className,
      )}
      aria-label="Bottom navigation"
    >
      <div
        className="mx-auto grid w-full max-w-[560px] gap-1 px-2 pb-2 pt-3"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map((item) => {
          const isActive = item.key === activeKey;
          const isPlanning = item.key === "/planning";

          if (isPlanning) {
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onChange(item.key)}
                className="relative flex min-h-14 flex-col items-center justify-end rounded-md px-1 pb-1 pt-4 text-[11px] leading-tight font-body text-foreground/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:text-foreground"
                aria-current={isActive ? "page" : undefined}
              >
                <span
                  className={cn(
                    "absolute -top-5 inline-flex h-14 w-14 items-center justify-center rounded-full border-4 border-card text-sm shadow-lg transition-all",
                    isActive
                      ? "scale-100 bg-primary text-background shadow-primary/30"
                      : "scale-95 bg-secondary text-primary shadow-primary/20",
                  )}
                >
                  {item.icon}
                </span>
                <span className={cn("font-medium", isActive ? "text-primary" : "")}>
                  {item.label}
                </span>
                <span
                  className={cn(
                    "mt-1 h-1 w-1 rounded-full transition-colors",
                    isActive ? "bg-primary" : "bg-transparent",
                  )}
                  aria-hidden
                />
              </button>
            );
          }

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onChange(item.key)}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center rounded-md px-1 py-1 text-[11px] leading-tight font-body transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isActive
                  ? "bg-secondary text-primary"
                  : "text-foreground/70 hover:text-foreground",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="mb-1 inline-flex items-center justify-center">{item.icon}</span>
              <span className="w-full truncate text-center">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
