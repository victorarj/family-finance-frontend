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
        "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur-xl",
        className,
      )}
      aria-label="Bottom navigation"
      data-testid="bottom-nav"
    >
      <div
        className="safe-bottom mx-auto grid w-full max-w-screen-sm gap-1 px-2 pb-2 pt-2"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map((item) => {
          const isActive = item.key === activeKey;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onChange(item.key)}
              className={cn(
                "flex min-h-[var(--mobile-nav-height)] flex-col items-center justify-center rounded-2xl px-1 py-2 text-[11px] leading-tight font-body transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isActive
                  ? "bg-secondary text-primary"
                  : "text-foreground/70 hover:text-foreground",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <span className={cn("mb-1 inline-flex items-center justify-center", isActive ? "text-primary" : "")}>
                {item.icon}
              </span>
              <span className="w-full px-1 text-center text-[11px] font-medium leading-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
