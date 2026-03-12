import { HashRouter, Link, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import RequireAuth from "./auth/RequireAuth";
import { DesktopNavigation, TabletNavigation } from "./components/AppNavigation";
import BottomNav from "./components/BottomNav";
import Button from "./components/Button";
import Container from "./components/Container";
import Dashboard from "./components/Dashboard";
import { HomeIcon, ExpenseIcon, PlanningIcon, IncomeIcon, SnapshotIcon, SettingsIcon, LogoutIcon } from "./components/Icons";
import { useViewportMode } from "./hooks/useViewport";
import DocumentsPage from "./features/documents/DocumentsPage";
import BankAccountsSettingsPage from "./pages/BankAccountsSettingsPage";
import ExpensesPage from "./pages/ExpensesPage";
import IncomePage from "./pages/IncomePage";
import LoginPage from "./pages/LoginPage";
import OnboardingPage from "./pages/OnboardingPage";
import PlanningPage from "./pages/PlanningPage";
import RegisterPage from "./pages/RegisterPage";
import SnapshotsPage from "./pages/SnapshotsPage";

const TABS = [
  { key: "/", label: "Painel", icon: <HomeIcon className="h-5 w-5" /> },
  { key: "/expenses", label: "Despesas", icon: <ExpenseIcon className="h-5 w-5" /> },
  { key: "/planning", label: "Planejar", icon: <PlanningIcon className="h-5 w-5" /> },
  { key: "/income", label: "Receitas", icon: <IncomeIcon className="h-5 w-5" /> },
  { key: "/snapshots", label: "Histórico", icon: <SnapshotIcon className="h-5 w-5" /> },
];

function AppContent() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const viewportMode = useViewportMode();

  const activeTab = TABS.find((tab) =>
    tab.key === "/" ? location.pathname === "/" : location.pathname.startsWith(tab.key),
  )?.key;
  const isPlanningRoute = location.pathname.startsWith("/planning");
  const isOnboardingRoute = location.pathname.startsWith("/onboarding");
  const isSettingsRoute = location.pathname.startsWith("/settings");
  const isMobile = viewportMode === "mobile";
  const isTablet = viewportMode === "tablet";
  const isDesktop = viewportMode === "desktop";

  const showAppChrome = Boolean(auth.token);
  const shouldRedirectToOnboarding =
    Boolean(auth.token) &&
    !auth.isProfileLoading &&
    auth.currentUser?.onboarding_completed_at === null &&
    !isOnboardingRoute;
  const shouldLeaveOnboarding =
    Boolean(auth.token) &&
    !auth.isProfileLoading &&
    Boolean(auth.currentUser?.onboarding_completed_at) &&
    isOnboardingRoute;

  const handleLogout = () => {
    auth.logout();
    navigate("/login");
  };

  if (auth.token && auth.isProfileLoading) {
    return (
      <div className="min-h-dvh bg-background">
        <Container>
          <div className="py-10 text-sm text-muted-foreground">Carregando...</div>
        </Container>
      </div>
    );
  }

  if (shouldRedirectToOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  if (shouldLeaveOnboarding) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className={`min-h-dvh ${isPlanningRoute ? "bg-secondary" : "bg-background"}`}>
      {showAppChrome && isMobile && (
        <header className="border-b border-border bg-card/90">
          <Container className="py-2" size="lg">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h1 className="text-base text-foreground">Household Finances</h1>
                <p className="truncate text-[11px] text-muted-foreground">{auth.userEmail || "Sem usuário"}</p>
              </div>
              <div className="flex items-center gap-1">
                {!isOnboardingRoute && (
                  <Link
                    aria-label="Configurações"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full text-primary transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    to="/settings/bank-accounts"
                  >
                    <SettingsIcon className="h-5 w-5" />
                  </Link>
                )}
                <Button aria-label="Sair" size="icon" variant="outline" onClick={handleLogout}>
                  <LogoutIcon className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </Container>
        </header>
      )}

      <div className={showAppChrome && isDesktop ? "lg:flex" : ""}>
        {showAppChrome && !isOnboardingRoute && isDesktop && (
          <DesktopNavigation
            items={TABS}
            activeKey={activeTab || "/"}
            userEmail={auth.userEmail || ""}
            onNavigate={(key) => navigate(key)}
            onLogout={handleLogout}
          />
        )}

        <div className="min-w-0 flex-1">
          {showAppChrome && !isOnboardingRoute && isTablet && (
            <TabletNavigation
              items={TABS}
              activeKey={activeTab || "/"}
              userEmail={auth.userEmail || ""}
              onNavigate={(key) => navigate(key)}
              onLogout={handleLogout}
            />
          )}

          <main
            className={
              showAppChrome && isMobile && !isOnboardingRoute && !isSettingsRoute
                ? "pb-[calc(var(--mobile-nav-height)+env(safe-area-inset-bottom))]"
                : ""
            }
          >
            <Routes>
              <Route
                path="/"
                element={
                  <RequireAuth>
                    <Dashboard />
                  </RequireAuth>
                }
              />
              <Route
                path="/documents"
                element={
                  <RequireAuth>
                    <DocumentsPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/expenses"
                element={
                  <RequireAuth>
                    <ExpensesPage currentUserEmail={auth.userEmail || ""} />
                  </RequireAuth>
                }
              />
              <Route
                path="/income"
                element={
                  <RequireAuth>
                    <IncomePage currentUserEmail={auth.userEmail || ""} />
                  </RequireAuth>
                }
              />
              <Route
                path="/planning"
                element={
                  <RequireAuth>
                    <PlanningPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/onboarding"
                element={
                  <RequireAuth>
                    <OnboardingPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/snapshots"
                element={
                  <RequireAuth>
                    <SnapshotsPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/settings"
                element={
                  <RequireAuth>
                    <Navigate to="/settings/bank-accounts" replace />
                  </RequireAuth>
                }
              />
              <Route
                path="/settings/bank-accounts"
                element={
                  <RequireAuth>
                    <BankAccountsSettingsPage />
                  </RequireAuth>
                }
              />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="*" element={<Navigate to={auth.token ? "/" : "/login"} />} />
            </Routes>
          </main>
        </div>
      </div>

      {showAppChrome && isMobile && !isOnboardingRoute && !isSettingsRoute && (
        <BottomNav
          items={TABS}
          activeKey={activeTab || "/"}
          onChange={(key) => navigate(key)}
        />
      )}

      {!showAppChrome && (
        <footer className="border-t border-border py-4">
          <Container size="sm">
            <p className="text-center text-sm text-muted-foreground">
              Não tem conta? <Link className="text-primary hover:underline" to="/register">Registre-se</Link>
            </p>
          </Container>
        </footer>
      )}
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </HashRouter>
  );
}
