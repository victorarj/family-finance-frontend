import { HashRouter, Link, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import RequireAuth from "./auth/RequireAuth";
import BottomNav from "./components/BottomNav";
import Button from "./components/Button";
import Container from "./components/Container";
import Dashboard from "./components/Dashboard";
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
  { key: "/", label: "Dashboard", icon: <span className="text-xs font-semibold">DB</span> },
  { key: "/expenses", label: "Despesas", icon: <span className="text-xs font-semibold">DS</span> },
  { key: "/planning", label: "Planejar", icon: <span className="text-xs font-semibold">PL</span> },
  { key: "/income", label: "Receitas", icon: <span className="text-xs font-semibold">RC</span> },
  { key: "/snapshots", label: "Snapshots", icon: <span className="text-xs font-semibold">SN</span> },
];

function AppContent() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const activeTab = TABS.find((tab) =>
    tab.key === "/" ? location.pathname === "/" : location.pathname.startsWith(tab.key),
  )?.key;
  const isPlanningRoute = location.pathname.startsWith("/planning");
  const isOnboardingRoute = location.pathname.startsWith("/onboarding");
  const isSettingsRoute = location.pathname.startsWith("/settings");

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
      <div className="min-h-screen bg-background">
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
    <div className={`min-h-screen pb-20 ${isPlanningRoute ? "bg-secondary" : "bg-background"}`}>
      {showAppChrome && (
        <header className="border-b border-border bg-card/90">
          <Container>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="text-lg text-foreground">Household Finances</h1>
                <p className="text-xs text-muted-foreground">{auth.userEmail || "Sem usuário"}</p>
              </div>
              <div className="flex items-center gap-2">
                {!isOnboardingRoute && (
                  <Link className="text-sm text-primary hover:underline" to="/settings/bank-accounts">
                    Settings
                  </Link>
                )}
                <Button size="sm" variant="outline" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            </div>
          </Container>
        </header>
      )}

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

      {showAppChrome && !isOnboardingRoute && !isSettingsRoute && (
        <BottomNav
          items={TABS}
          activeKey={activeTab || "/"}
          onChange={(key) => navigate(key)}
        />
      )}

      {!showAppChrome && (
        <footer className="border-t border-border py-4">
          <Container>
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
