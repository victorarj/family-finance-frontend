import { useState } from "react";
import {
  HashRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import RequireAuth from "./auth/RequireAuth";
import {
  DesktopNavigation,
  TabletNavigation,
} from "./components/AppNavigation";
import BottomNav from "./components/BottomNav";
import Button from "./components/Button";
import Container from "./components/Container";
import Dashboard from "./components/Dashboard";
import Fab from "./components/Fab";
import AiChatModal from "./components/AiChatModal";
import {
  ChatIcon,
  HomeIcon,
  ExpenseIcon,
  PlanningIcon,
  IncomeIcon,
  SnapshotIcon,
  SettingsIcon,
  LogoutIcon,
} from "./components/Icons";
import { useViewportMode } from "./hooks/useViewport";
import DocumentsPage from "./features/documents/DocumentsPage";
import CategoriasPage from "./features/categories/CategoriasPage";
import MoedasPage from "./features/currencies/MoedasPage";
import BankAccountsSettingsPage from "./pages/BankAccountsSettingsPage";
import ExpensesPage from "./pages/ExpensesPage";
import IncomePage from "./pages/IncomePage";
import LoginPage from "./pages/LoginPage";
import OnboardingPage from "./pages/OnboardingPage";
import PlanningPage from "./pages/PlanningPage";
import RegisterPage from "./pages/RegisterPage";
import SettingsHubPage from "./pages/SettingsHubPage";
import SnapshotsPage from "./pages/SnapshotsPage";
import TransactionModalContext from "./context/TransactionModalContext";
import TransactionSheet from "./components/TransactionSheet";
import IncomeForm from "./components/IncomeForm";
import ExpenseForm from "./components/ExpenseForm";
import type { Expense, Income } from "./types";

function blurActiveElement() {
  if (typeof document === "undefined") return;
  const activeElement = document.activeElement;
  if (activeElement instanceof HTMLElement) {
    activeElement.blur();
  }
}

const TABS = [
  { key: "/", label: "Painel", icon: <HomeIcon className="h-5 w-5" /> },
  {
    key: "/income",
    label: "Receitas",
    icon: <IncomeIcon className="h-5 w-5" />,
  },
  {
    key: "/expenses",
    label: "Despesas",
    icon: <ExpenseIcon className="h-5 w-5" />,
  },
  {
    key: "/planning",
    label: "Planejamento",
    icon: <PlanningIcon className="h-5 w-5" />,
  },
  {
    key: "/snapshots",
    label: "Snapshots",
    icon: <SnapshotIcon className="h-5 w-5" />,
  },
];

function AppContent() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const viewportMode = useViewportMode();

  const activeTab = TABS.find((tab) =>
    tab.key === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(tab.key),
  )?.key;
  const isPlanningRoute = location.pathname.startsWith("/planning");
  const isOnboardingRoute = location.pathname.startsWith("/onboarding");
  const isSettingsRoute =
    location.pathname.startsWith("/settings") ||
    location.pathname.startsWith("/configuracoes") ||
    location.pathname.startsWith("/documents");
  const isMobile = viewportMode === "mobile";
  const isTablet = viewportMode === "tablet";
  const isDesktop = viewportMode === "desktop";
  const [isChatOpen, setChatOpen] = useState(false);
  const [activeSheet, setActiveSheet] = useState<"none" | "income" | "expense">("none");
  const [currentIncome, setCurrentIncome] = useState<Income | null>(null);
  const [currentExpense, setCurrentExpense] = useState<Expense | null>(null);
  const [incomeRefreshToken, setIncomeRefreshToken] = useState(0);
  const [expenseRefreshToken, setExpenseRefreshToken] = useState(0);

  const openAddIncome = () => {
    blurActiveElement();
    setCurrentExpense(null);
    setCurrentIncome(null);
    setActiveSheet("income");
  };

  const openEditIncome = (income: Income) => {
    blurActiveElement();
    setCurrentExpense(null);
    setCurrentIncome(income);
    setActiveSheet("income");
  };

  const openAddExpense = () => {
    blurActiveElement();
    setCurrentIncome(null);
    setCurrentExpense(null);
    setActiveSheet("expense");
  };

  const openEditExpense = (expense: Expense) => {
    blurActiveElement();
    setCurrentIncome(null);
    setCurrentExpense(expense);
    setActiveSheet("expense");
  };

  const closeSheet = () => {
    setActiveSheet("none");
    setCurrentIncome(null);
    setCurrentExpense(null);
  };

  const handleIncomeSaved = () => {
    closeSheet();
    setIncomeRefreshToken((current) => current + 1);
  };

  const handleExpenseSaved = () => {
    closeSheet();
    setExpenseRefreshToken((current) => current + 1);
  };

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
          <div className="py-10 text-sm text-muted-foreground">
            Carregando...
          </div>
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
    <TransactionModalContext.Provider
      value={{
        activeSheet,
        isAnySheetOpen: activeSheet !== "none",
        currentIncome,
        currentExpense,
        openAddIncome,
        openEditIncome,
        openAddExpense,
        openEditExpense,
        closeSheet,
        incomeRefreshToken,
        expenseRefreshToken,
      }}
    >
      <div
        className={`min-h-dvh ${isPlanningRoute ? "bg-secondary" : "bg-background"}`}
      >
      {showAppChrome && isMobile && (
        <header className="border-b border-border bg-card/90">
          <Container className="py-2" size="lg">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h1 className="text-base text-foreground">
                  Finanças da Casa
                </h1>
                <p className="truncate text-[11px] text-muted-foreground">
                  {auth.userEmail || "Sem usuário"}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {!isOnboardingRoute && (
                  <Link
                    aria-label="Configurações"
                    className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      isSettingsRoute ? "bg-secondary" : "hover:bg-secondary"
                    }`}
                    to="/configuracoes"
                  >
                    <SettingsIcon className="h-5 w-5" />
                  </Link>
                )}
                <Button
                  aria-label="Sair"
                  size="icon"
                  variant="outline"
                  onClick={handleLogout}
                >
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
            activeKey={activeTab ?? (isSettingsRoute ? "/configuracoes" : undefined)}
            userEmail={auth.userEmail || ""}
            onNavigate={(key) => navigate(key)}
            onLogout={handleLogout}
          />
        )}

        <div className="min-w-0 flex-1">
          {showAppChrome && !isOnboardingRoute && isTablet && (
            <TabletNavigation
              items={TABS}
              activeKey={activeTab ?? (isSettingsRoute ? "/configuracoes" : undefined)}
              userEmail={auth.userEmail || ""}
              onNavigate={(key) => navigate(key)}
              onLogout={handleLogout}
            />
          )}

          <main
            className={
              showAppChrome && isMobile && !isOnboardingRoute
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
                path="/configuracoes/documentos"
                element={
                  <RequireAuth>
                    <DocumentsPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/documents"
                element={<Navigate to="/configuracoes/documentos" replace />}
              />
              <Route
                path="/expenses"
                element={
                  <RequireAuth>
                    <ExpensesPage
                      currentUserEmail={auth.userEmail || ""}
                      refreshTrigger={expenseRefreshToken}
                    />
                  </RequireAuth>
                }
              />
              <Route
                path="/income"
                element={
                  <RequireAuth>
                    <IncomePage
                      currentUserEmail={auth.userEmail || ""}
                      refreshTrigger={incomeRefreshToken}
                    />
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
                path="/planejamento"
                element={<Navigate to="/planning" replace />}
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
                path="/configuracoes"
                element={
                  <RequireAuth>
                    <SettingsHubPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/settings"
                element={<Navigate to="/configuracoes" replace />}
              />
              <Route
                path="/configuracoes/contas-bancarias"
                element={
                  <RequireAuth>
                    <BankAccountsSettingsPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/configuracoes/categorias"
                element={
                  <RequireAuth>
                    <CategoriasPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/configuracoes/moedas"
                element={
                  <RequireAuth>
                    <MoedasPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/settings/bank-accounts"
                element={<Navigate to="/configuracoes/contas-bancarias" replace />}
              />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route
                path="*"
                element={<Navigate to={auth.token ? "/" : "/login"} />}
              />
            </Routes>
          </main>
        </div>
      </div>

      {showAppChrome && isMobile && !isOnboardingRoute && (
        <BottomNav
          items={TABS}
          activeKey={isSettingsRoute ? undefined : activeTab || "/"}
          onChange={(key) => navigate(key)}
        />
      )}

      {showAppChrome && !isOnboardingRoute && (
        <>
          <Fab
            aria-label="Abrir chat"
            onClick={() => {
              blurActiveElement();
              setChatOpen(true);
            }}
            className="w-auto gap-2 px-5"
          >
            <ChatIcon className="h-5 w-5 text-background" />
            <span className="text-sm font-medium text-background">Chat</span>
          </Fab>
          <AiChatModal isOpen={isChatOpen} onClose={() => setChatOpen(false)} />

          <TransactionSheet
            open={activeSheet === "income"}
            onOpenChange={(open) => {
              if (!open) {
                closeSheet();
              }
            }}
            title={currentIncome ? "Editar receita" : "Nova receita"}
            description="Preencha os campos para salvar a receita."
          >
            <IncomeForm
              income={currentIncome}
              currentUserEmail={auth.userEmail || ""}
              onSaved={handleIncomeSaved}
              onCancel={closeSheet}
            />
          </TransactionSheet>

          <TransactionSheet
            open={activeSheet === "expense"}
            onOpenChange={(open) => {
              if (!open) {
                closeSheet();
              }
            }}
            title={currentExpense ? "Editar despesa" : "Nova despesa"}
            description="Preencha os campos para salvar a despesa."
          >
            <ExpenseForm
              expense={currentExpense}
              currentUserEmail={auth.userEmail || ""}
              currentUserId={auth.userId}
              onSaved={handleExpenseSaved}
              onCancel={closeSheet}
            />
          </TransactionSheet>
        </>
      )}

      {!showAppChrome && (
        <footer className="border-t border-border py-4">
          <Container size="sm">
            <p className="text-center text-sm text-muted-foreground">
              Não tem conta?{" "}
              <Link className="text-primary hover:underline" to="/register">
                Registre-se
              </Link>
            </p>
          </Container>
        </footer>
      )}
      </div>
    </TransactionModalContext.Provider>
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
