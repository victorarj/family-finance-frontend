import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import Button from "./Button";

type NavItem = {
  key: string;
  label: string;
  icon: ReactNode;
};

type AppNavigationProps = {
  items: NavItem[];
  activeKey: string;
  userEmail: string;
  onNavigate: (key: string) => void;
  onLogout: () => void;
};

function cn(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function TabletNavigation({
  items,
  activeKey,
  userEmail,
  onNavigate,
  onLogout,
}: AppNavigationProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl text-foreground">Household Finances</h1>
            <p className="truncate text-sm text-muted-foreground">{userEmail || "Sem usuário"}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link className="text-sm text-primary hover:underline" to="/settings/bank-accounts">
              Settings
            </Link>
            <Button size="sm" variant="outline" onClick={onLogout}>
              Logout
            </Button>
          </div>
        </div>

        <nav aria-label="Primary navigation" className="overflow-x-auto">
          <div className="flex min-w-max gap-2 pb-1">
            {items.map((item) => {
              const isActive = item.key === activeKey;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onNavigate(item.key)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors",
                    isActive
                      ? "border-primary bg-primary text-background"
                      : "border-border bg-background text-foreground hover:bg-muted",
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <span aria-hidden>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </header>
  );
}

export function DesktopNavigation({
  items,
  activeKey,
  userEmail,
  onNavigate,
  onLogout,
}: AppNavigationProps) {
  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-border bg-card lg:flex">
      <div className="flex w-full flex-col px-5 py-6">
        <div className="mb-8 space-y-2">
          <p className="text-xs uppercase tracking-[0.24em] text-primary">Finances</p>
          <div>
            <h1 className="text-2xl text-foreground">Household Finances</h1>
            <p className="mt-2 break-all text-sm text-muted-foreground">{userEmail || "Sem usuário"}</p>
          </div>
        </div>

        <nav aria-label="Primary navigation" className="space-y-2">
          {items.map((item) => {
            const isActive = item.key === activeKey;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onNavigate(item.key)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm transition-colors",
                  isActive
                    ? "bg-primary text-background"
                    : "text-foreground hover:bg-secondary",
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <span aria-hidden className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-background/10 text-xs font-semibold">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-auto space-y-3 border-t border-border pt-5">
          <Link
            className="block rounded-xl px-4 py-2 text-sm text-primary transition-colors hover:bg-secondary"
            to="/settings/bank-accounts"
          >
            Settings
          </Link>
          <Button className="w-full justify-center" variant="outline" onClick={onLogout}>
            Logout
          </Button>
        </div>
      </div>
    </aside>
  );
}
