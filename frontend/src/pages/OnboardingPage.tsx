import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { create as createBankAccount, list as listBankAccounts } from "../apis/bankAccounts";
import { list as listCategories } from "../apis/categories";
import { getPreferences, savePreferences } from "../apis/preferences";
import { useAuth } from "../auth/AuthContext";
import ExpenseForm from "../components/ExpenseForm";
import IncomeForm from "../components/IncomeForm";
import Button from "../components/Button";
import Card from "../components/Card";
import FormField from "../components/FormField";
import Input from "../components/Input";
import Select from "../components/Select";
import {
  ChevronRightIcon,
  CoinsIcon,
  DocumentIcon,
  ExpenseIcon,
  IncomeIcon,
  PlanningIcon,
  TagIcon,
} from "../components/Icons";
import { useTransactionModal } from "../context/TransactionModalContext";
import type { BankAccount, Expense, Income, UserPreferences } from "../types";
import { getApiErrorMessage } from "../utils/apiError";
import { formatCurrency } from "../utils/formatters";
import { STORAGE_KEYS, setUserScopedStorageItem } from "../utils/storage";

type OnboardingStepId =
  | "returning"
  | "welcome"
  | "preferences"
  | "bank-account"
  | "categories"
  | "transaction"
  | "planning"
  | "documents"
  | "next-actions";

type NextAction = "expense" | "income" | "planning" | "documents" | null;
type TransactionMode = "expense" | "income";

const DEFAULT_PREFERENCES: UserPreferences = {
  tipo_residencia: "arrendada",
  modo_registro: "completo",
  planejamento_guiado: true,
};

const DEFAULT_ACCOUNT = {
  nome_conta: "",
  banco: "",
  moeda: "BRL",
};

function ActionCard({
  active,
  icon: Icon,
  title,
  description,
  onClick,
}: {
  active: boolean;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`w-full rounded-2xl border px-4 py-4 text-left transition-colors ${active ? "border-primary bg-primary/5" : "border-border bg-secondary/20 hover:bg-secondary/35"}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-background text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">{title}</p>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <ChevronRightIcon className="mt-1 h-4 w-4 text-muted-foreground" />
      </div>
    </button>
  );
}

function ProgressBar({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  const progress = totalSteps > 0 ? Math.min(((currentStep + 1) / totalSteps) * 100, 100) : 0;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Configuração inicial</p>
          <h2 className="text-3xl text-foreground">Seu começo no app</h2>
        </div>
        <div className="rounded-full bg-secondary px-4 py-2 text-sm text-foreground">
          Passo {currentStep + 1} de {totalSteps}
        </div>
      </div>

      <div className="h-2 rounded-full bg-muted">
        <div
          className="h-2 rounded-full bg-primary transition-[width] duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const { openAddExpense, openAddIncome } = useTransactionModal();

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [startedWithPreferences, setStartedWithPreferences] = useState(false);
  const [startedWithAccounts, setStartedWithAccounts] = useState(false);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [categoryChips, setCategoryChips] = useState<string[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [categoriesUnavailable, setCategoriesUnavailable] = useState(false);
  const [accountForm, setAccountForm] = useState(DEFAULT_ACCOUNT);
  const [transactionMode, setTransactionMode] = useState<TransactionMode>("expense");
  const [transactionCompleted, setTransactionCompleted] = useState(false);
  const [transactionSuccessMessage, setTransactionSuccessMessage] = useState<string | null>(null);
  const [selectedNextAction, setSelectedNextAction] = useState<NextAction>(null);

  const isExpenseOnly = preferences.modo_registro === "despesas";
  const showReturningSummary = startedWithPreferences && startedWithAccounts;

  const derivedSteps = useMemo<OnboardingStepId[]>(() => {
    if (showReturningSummary) {
      return ["returning"];
    }

    const steps: OnboardingStepId[] = [];

    if (!startedWithPreferences) {
      steps.push("welcome", "preferences");
    }

    steps.push("bank-account", "categories", "transaction");

    if (!isExpenseOnly) {
      steps.push("planning", "documents");
    }

    steps.push("next-actions");
    return steps;
  }, [isExpenseOnly, showReturningSummary, startedWithPreferences]);

  const currentStep = derivedSteps[currentStepIndex];
  const hasAccounts = accounts.length > 0;

  useEffect(() => {
    const controller = new AbortController();

    async function bootstrap() {
      try {
        const [preferencesResponse, accountsResponse, categoriesResponse] = await Promise.all([
          getPreferences({ signal: controller.signal }).catch(() => ({ data: null })),
          listBankAccounts({ signal: controller.signal }).catch(() => ({ data: [] as BankAccount[] })),
          listCategories({ signal: controller.signal }).catch(() => ({ data: [] })),
        ]);

        if (controller.signal.aborted) return;

        const loadedPreferences = preferencesResponse.data;
        if (loadedPreferences) {
          setStartedWithPreferences(true);
          setPreferences({
            tipo_residencia: loadedPreferences.tipo_residencia || DEFAULT_PREFERENCES.tipo_residencia,
            modo_registro: loadedPreferences.modo_registro || DEFAULT_PREFERENCES.modo_registro,
            planejamento_guiado:
              loadedPreferences.planejamento_guiado ?? DEFAULT_PREFERENCES.planejamento_guiado,
          });
        }

        const loadedAccounts = Array.isArray(accountsResponse.data) ? accountsResponse.data : [];
        setAccounts(loadedAccounts);
        setStartedWithAccounts(loadedAccounts.length > 0);

        const loadedCategories = Array.isArray(categoriesResponse.data)
          ? categoriesResponse.data
              .filter((category) => category.ativo)
              .map((category) => category.nome)
          : [];
        setCategoryChips(loadedCategories);
        setCategoriesUnavailable(loadedCategories.length === 0);
      } catch {
        if (!controller.signal.aborted) {
          setError("Não foi possível carregar o onboarding.");
          setCategoryChips([]);
          setCategoriesUnavailable(true);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingCategories(false);
          setIsBootstrapping(false);
        }
      }
    }

    void bootstrap();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    setCurrentStepIndex((current) => Math.min(current, Math.max(derivedSteps.length - 1, 0)));
  }, [derivedSteps]);

  useEffect(() => {
    if (currentStep !== "transaction" || !transactionCompleted) return undefined;
    const timeoutId = window.setTimeout(() => {
      setTransactionCompleted(false);
      setTransactionSuccessMessage(null);
      setCurrentStepIndex((current) => Math.min(current + 1, derivedSteps.length - 1));
    }, 1500);
    return () => window.clearTimeout(timeoutId);
  }, [currentStep, derivedSteps.length, transactionCompleted]);

  useEffect(() => {
    if (currentStep !== "planning" || isExpenseOnly || preferences.planejamento_guiado) return undefined;
    const timeoutId = window.setTimeout(() => {
      setCurrentStepIndex((current) => Math.min(current + 1, derivedSteps.length - 1));
    }, 2000);
    return () => window.clearTimeout(timeoutId);
  }, [currentStep, derivedSteps.length, isExpenseOnly, preferences.planejamento_guiado]);

  const refreshAccounts = async (signal?: AbortSignal) => {
    const response = await listBankAccounts({ signal });
    const latestAccounts = Array.isArray(response.data) ? response.data : [];
    setAccounts(latestAccounts);
    return latestAccounts;
  };

  const goNext = () => setCurrentStepIndex((current) => Math.min(current + 1, derivedSteps.length - 1));
  const goBack = () => {
    setError(null);
    setCurrentStepIndex((current) => Math.max(current - 1, 0));
  };

  const handlePreferencesSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSavingPreferences(true);

    try {
      await savePreferences(preferences);
      goNext();
    } catch (submissionError) {
      setError(getApiErrorMessage(submissionError, "Não foi possível salvar as preferências."));
    } finally {
      setIsSavingPreferences(false);
    }
  };

  const handleAccountSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!accountForm.nome_conta.trim() || !accountForm.banco.trim() || !accountForm.moeda.trim()) {
      setError("Preencha nome da conta, banco e moeda.");
      return;
    }

    setIsSavingAccount(true);

    try {
      await createBankAccount({
        nome_conta: accountForm.nome_conta.trim(),
        banco: accountForm.banco.trim(),
        moeda: accountForm.moeda.trim().toUpperCase(),
      });
      await refreshAccounts();
      setAccountForm(DEFAULT_ACCOUNT);
      goNext();
    } catch (submissionError) {
      setError(getApiErrorMessage(submissionError, "Não foi possível criar a conta."));
    } finally {
      setIsSavingAccount(false);
    }
  };

  const handleContinueWithExistingAccount = async () => {
    setError(null);

    try {
      const latestAccounts = await refreshAccounts();
      if (latestAccounts.length === 0) {
        setError("Crie pelo menos uma conta para continuar.");
        return;
      }
      goNext();
    } catch (submissionError) {
      if (!axios.isCancel(submissionError)) {
        setError(getApiErrorMessage(submissionError, "Não foi possível carregar as contas."));
      }
    }
  };

  const handleTransactionSaved = (mode: TransactionMode) => (_payload: Expense | Income) => {
    setTransactionCompleted(true);
    setTransactionSuccessMessage(
      mode === "expense" ? "Primeira despesa salva. Vamos seguir." : "Primeira receita salva. Vamos seguir.",
    );
  };

  const navigateAfterCompletion = (nextAction: NextAction) => {
    if (nextAction === "expense") {
      navigate("/expenses", { replace: true });
      window.setTimeout(() => openAddExpense(), 0);
      return;
    }
    if (nextAction === "income") {
      navigate("/income", { replace: true });
      window.setTimeout(() => openAddIncome(), 0);
      return;
    }
    if (nextAction === "planning") {
      navigate("/planning", { replace: true });
      return;
    }
    if (nextAction === "documents") {
      navigate("/configuracoes/documentos", { replace: true });
      return;
    }
    if (preferences.planejamento_guiado) {
      navigate("/planning", { replace: true });
      return;
    }
    if (isExpenseOnly) {
      navigate("/expenses", { replace: true });
      return;
    }
    navigate("/", { replace: true });
  };

  const handleComplete = async () => {
    setError(null);
    setIsCompleting(true);

    try {
      const completedUser = await auth.completeOnboarding();
      setUserScopedStorageItem(
        STORAGE_KEYS.onboardingCompleted,
        completedUser.id ?? auth.userId ?? null,
        "true",
      );
      navigateAfterCompletion(selectedNextAction);
    } catch (submissionError) {
      setError(getApiErrorMessage(submissionError, "Não foi possível concluir o onboarding."));
    } finally {
      setIsCompleting(false);
    }
  };

  if (isBootstrapping) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <Card>
          <p className="text-sm text-muted-foreground">Carregando onboarding...</p>
        </Card>
      </div>
    );
  }

  const stepHeader = (() => {
    if (currentStep === "returning") {
      return {
        title: "Bem-vindo de volta",
        description: "Seu começo já está pronto. Você pode entrar direto no app.",
      };
    }

    if (currentStep === "welcome") {
      return {
        title: "Olá! Seja bem-vindo ao Finanças da Casa 👋",
        description: "Vou te mostrar o essencial em poucos minutos. Prometo que vai valer a pena.",
      };
    }

    if (currentStep === "preferences") {
      return {
        title: "Como você quer organizar sua rotina?",
        description: "Vou ajustar o app ao seu jeito de registrar e acompanhar a casa.",
      };
    }

    if (currentStep === "bank-account") {
      return {
        title: "Vamos conectar sua primeira conta",
        description: startedWithPreferences && !startedWithAccounts
          ? "Você já configurou suas preferências. Agora vamos criar sua conta bancária."
          : "Sua conta será usada em despesas, receitas e planejamento ao longo do app.",
      };
    }

    if (currentStep === "categories") {
      return {
        title: "Categorias e moedas já estão prontas",
        description: "Você já começa com uma base pronta. Depois pode personalizar tudo em Configurações.",
      };
    }

    if (currentStep === "transaction") {
      return {
        title: "Vamos registrar sua primeira transação",
        description: "Se quiser, registre agora. Ou avance e faça isso depois — o app fica esperando.",
      };
    }

    if (currentStep === "planning") {
      return {
        title: "Seu planejamento mensal fica aqui",
        description: preferences.planejamento_guiado
          ? "Você vai definir metas, comparar planejado e realizado e fechar o mês com clareza."
          : "Você pode ativar o planejamento guiado quando quiser em Configurações.",
      };
    }

    if (currentStep === "documents") {
      return {
        title: "A inteligência de documentos acelera sua rotina",
        description: "Envie comprovantes, notas e extratos para consultar tudo com ajuda da IA.",
      };
    }

    return {
      title: "O que fazer agora?",
      description: "Escolha um atalho. Se preferir, eu decido o melhor próximo passo para você.",
    };
  })();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <Card className="space-y-8 p-6 md:p-8">
        <ProgressBar currentStep={currentStepIndex} totalSteps={derivedSteps.length} />

        <div className="rounded-2xl border border-border bg-secondary/40 p-4">
          <h3 className="text-xl text-foreground">{stepHeader.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{stepHeader.description}</p>
        </div>

        {error ? (
          <p className="rounded-md bg-expense-soft px-3 py-2 text-sm text-expense">{error}</p>
        ) : null}

        {currentStep === "returning" ? (
          <div className="space-y-5">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-border bg-secondary/20 p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Preferências</p>
                <div className="mt-3 space-y-2 text-sm text-foreground">
                  <p>Modo de registro: {isExpenseOnly ? "Apenas despesas" : "Completo"}</p>
                  <p>Planejamento guiado: {preferences.planejamento_guiado ? "Sim" : "Não"}</p>
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-secondary/20 p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Conta pronta</p>
                <div className="mt-3 space-y-2 text-sm text-foreground">
                  <p>Total configurado: {accounts.length}</p>
                  {accounts.slice(0, 2).map((account) => (
                    <p key={account.id}>
                      {account.nome_conta} · {account.banco} · {account.moeda}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleComplete} disabled={isCompleting}>
                {isCompleting ? "Entrando..." : "Entrar no app"}
              </Button>
            </div>
          </div>
        ) : null}

        {currentStep === "welcome" ? (
          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-secondary/20 p-5">
              <p className="text-sm text-muted-foreground">
                Você vai sair daqui com a conta pronta para registrar e acompanhar sua rotina financeira.
              </p>
            </div>

            <div className="flex justify-end">
              <Button onClick={goNext}>Começar</Button>
            </div>
          </div>
        ) : null}

        {currentStep === "preferences" ? (
          <form className="space-y-4" onSubmit={handlePreferencesSubmit}>
            <FormField label="Modo de registro" required>
              <Select
                value={preferences.modo_registro}
                onChange={(event) =>
                  setPreferences((current) => ({
                    ...current,
                    modo_registro: event.target.value as UserPreferences["modo_registro"],
                  }))
                }
              >
                <option value="completo">Completo</option>
                <option value="despesas">Apenas despesas</option>
              </Select>
            </FormField>

            <p className="rounded-xl border border-border bg-secondary/20 px-4 py-3 text-sm text-muted-foreground">
              {isExpenseOnly
                ? "Você vai registrar só despesas. Simples e direto."
                : "Você vai registrar despesas, receitas e usar o planejamento mensal."}
            </p>

            <label className="flex items-start gap-3 rounded-2xl border border-border bg-secondary/30 p-4 text-sm text-foreground">
              <input
                className="mt-1"
                type="checkbox"
                checked={preferences.planejamento_guiado}
                onChange={(event) =>
                  setPreferences((current) => ({
                    ...current,
                    planejamento_guiado: event.target.checked,
                  }))
                }
              />
              <span>
                <span className="block font-medium text-foreground">Usar planejamento guiado</span>
                <span className="block text-muted-foreground">
                  Você recebe ajuda para montar o mês e acompanhar o que saiu do plano.
                </span>
              </span>
            </label>

            <div className="flex flex-wrap justify-between gap-3 pt-2">
              <Button variant="outline" onClick={goBack}>
                Voltar
              </Button>
              <Button type="submit" disabled={isSavingPreferences}>
                {isSavingPreferences ? "Salvando..." : "Continuar"}
              </Button>
            </div>
          </form>
        ) : null}

        {currentStep === "bank-account" ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-secondary/20 p-5">
              <p className="text-sm text-foreground">
                Sua conta será usada em despesas, receitas e planejamento. Você vai vê-la aparecer em todo o app.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                💳 Aparece em: Despesas · Receitas · Planejamento
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-secondary/20 p-5">
              <p className="text-sm font-medium text-foreground">Contas já encontradas</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {hasAccounts
                  ? "Você pode usar uma conta existente ou adicionar outra agora."
                  : "Ainda não existe nenhuma conta para associar aos seus registros."}
              </p>
              {hasAccounts ? (
                <ul className="mt-4 space-y-2 text-sm text-foreground">
                  {accounts.map((account) => (
                    <li key={account.id} className="rounded-xl border border-border bg-card px-4 py-3">
                      <span className="font-medium">{account.nome_conta}</span>
                      <span className="text-muted-foreground"> · {account.banco}</span>
                      <span className="text-muted-foreground"> · {account.moeda}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <form className="space-y-4" onSubmit={handleAccountSubmit}>
              <FormField label="Nome da conta" required>
                <Input
                  value={accountForm.nome_conta}
                  onChange={(event) =>
                    setAccountForm((current) => ({ ...current, nome_conta: event.target.value }))
                  }
                  required
                />
              </FormField>

              <FormField label="Banco" required>
                <Input
                  value={accountForm.banco}
                  onChange={(event) =>
                    setAccountForm((current) => ({ ...current, banco: event.target.value }))
                  }
                  required
                />
              </FormField>

              <FormField label="Moeda" required helperText="Ex.: BRL, USD, EUR">
                <Input
                  value={accountForm.moeda}
                  onChange={(event) =>
                    setAccountForm((current) => ({ ...current, moeda: event.target.value.toUpperCase() }))
                  }
                  required
                />
              </FormField>

              <div className="flex flex-wrap justify-between gap-3 pt-2">
                <Button variant="outline" onClick={goBack}>
                  Voltar
                </Button>
                <div className="flex flex-wrap gap-3">
                  {hasAccounts ? (
                    <Button variant="secondary" onClick={handleContinueWithExistingAccount}>
                      Usar conta existente
                    </Button>
                  ) : null}
                  <Button type="submit" disabled={isSavingAccount}>
                    {isSavingAccount ? "Salvando..." : "Criar conta e continuar"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        ) : null}

        {currentStep === "categories" ? (
          <div className="space-y-6">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-border bg-secondary/20 p-5">
                <div className="flex items-center gap-2 text-foreground">
                  <TagIcon className="h-5 w-5 text-primary" />
                  <p className="text-sm font-medium">Categorias padrão</p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {isLoadingCategories
                    ? Array.from({ length: 4 }, (_, index) => (
                        <span
                          key={`category-skeleton-${index}`}
                          className="h-8 w-24 animate-pulse rounded-full bg-muted"
                        />
                      ))
                    : categoryChips.map((chip) => (
                        <span
                          key={chip}
                          className="rounded-full border border-border bg-card px-3 py-1.5 text-sm text-foreground"
                        >
                          {chip}
                        </span>
                      ))}
                </div>
                {!isLoadingCategories && categoriesUnavailable ? (
                  <p className="mt-3 text-sm text-muted-foreground">
                    Suas categorias estarão disponíveis no app.
                  </p>
                ) : null}
              </div>

              <div className="rounded-2xl border border-border bg-secondary/20 p-5">
                <div className="flex items-center gap-2 text-foreground">
                  <CoinsIcon className="h-5 w-5 text-primary" />
                  <p className="text-sm font-medium">Moeda inicial</p>
                </div>
                <div className="mt-4 inline-flex rounded-full bg-primary/10 px-3 py-1.5 text-sm text-primary">
                  BRL
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  Você pode ajustar categorias e moedas quando quiser em Configurações.
                </p>
              </div>
            </div>

            <div className="flex justify-between gap-3">
              <Button variant="outline" onClick={goBack}>
                Voltar
              </Button>
              <Button onClick={goNext}>Próximo</Button>
            </div>
          </div>
        ) : null}

        {currentStep === "transaction" ? (
          <div className="space-y-5">
            {!isExpenseOnly ? (
              <div className="inline-flex rounded-full bg-secondary p-1">
                <button
                  type="button"
                  className={`rounded-full px-4 py-2 text-sm transition-colors ${transactionMode === "expense" ? "bg-primary text-background" : "text-foreground"}`}
                  onClick={() => {
                    setTransactionCompleted(false);
                    setTransactionSuccessMessage(null);
                    setTransactionMode("expense");
                  }}
                >
                  Despesa
                </button>
                <button
                  type="button"
                  className={`rounded-full px-4 py-2 text-sm transition-colors ${transactionMode === "income" ? "bg-primary text-background" : "text-foreground"}`}
                  onClick={() => {
                    setTransactionCompleted(false);
                    setTransactionSuccessMessage(null);
                    setTransactionMode("income");
                  }}
                >
                  Receita
                </button>
              </div>
            ) : null}

            {transactionSuccessMessage ? (
              <p className="rounded-md bg-income-soft px-3 py-2 text-sm text-income">
                {transactionSuccessMessage}
              </p>
            ) : null}

            <div className="rounded-2xl border border-border bg-secondary/10 p-4 sm:p-5">
              {isExpenseOnly || transactionMode === "expense" ? (
                <ExpenseForm
                  currentUserEmail={auth.userEmail || ""}
                  currentUserId={auth.userId}
                  layout="inline"
                  submitLabel="Salvar e continuar"
                  onSaved={handleTransactionSaved("expense")}
                />
              ) : (
                <IncomeForm
                  currentUserEmail={auth.userEmail || ""}
                  layout="inline"
                  submitLabel="Salvar e continuar"
                  onSaved={handleTransactionSaved("income")}
                />
              )}
            </div>

            <div className="flex justify-between gap-3">
              <Button variant="outline" onClick={goBack}>
                Voltar
              </Button>
              <Button onClick={goNext}>Próximo</Button>
            </div>
          </div>
        ) : null}

        {currentStep === "planning" ? (
          <div className="space-y-5">
            {preferences.planejamento_guiado ? (
              <>
                <div className="grid gap-3 md:grid-cols-3">
                  {[
                    { title: "1. Planejar", text: "Você começa pelas entradas e despesas fixas." },
                    { title: "2. Acompanhar", text: "O app compara o plano com o que aconteceu." },
                    { title: "3. Fechar o mês", text: "Você salva um snapshot com a visão final do período." },
                  ].map((item) => (
                    <div key={item.title} className="rounded-2xl border border-border bg-secondary/20 p-4">
                      <p className="text-sm font-medium text-foreground">{item.title}</p>
                      <p className="mt-2 text-sm text-muted-foreground">{item.text}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl border border-border bg-secondary/20 p-5">
                  <div className="flex items-center gap-2 text-foreground">
                    <PlanningIcon className="h-5 w-5 text-primary" />
                    <p className="text-sm font-medium">Prévia do mês</p>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div className="rounded-xl bg-card px-4 py-3">
                      <p className="text-xs text-muted-foreground">Receitas planejadas</p>
                      <p className="mt-1 text-lg text-income">{formatCurrency(4200)}</p>
                    </div>
                    <div className="rounded-xl bg-card px-4 py-3">
                      <p className="text-xs text-muted-foreground">Despesas planejadas</p>
                      <p className="mt-1 text-lg text-expense">{formatCurrency(2650)}</p>
                    </div>
                    <div className="rounded-xl bg-card px-4 py-3">
                      <p className="text-xs text-muted-foreground">Saldo projetado</p>
                      <p className="mt-1 text-lg text-foreground">{formatCurrency(1550)}</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-border bg-secondary/20 p-5">
                <p className="text-sm text-muted-foreground">
                  Você pode ativar o planejamento guiado quando quiser em Configurações.
                </p>
              </div>
            )}

            <div className="flex justify-between gap-3">
              <Button variant="outline" onClick={goBack}>
                Voltar
              </Button>
              <Button onClick={goNext} disabled={!preferences.planejamento_guiado}>
                Próximo
              </Button>
            </div>
          </div>
        ) : null}

        {currentStep === "documents" ? (
          <div className="space-y-5">
            <div className="grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-2xl border border-border bg-secondary/20 p-5">
                <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                  Exemplo de conversa
                </p>
                <div className="space-y-3">
                  <div className="max-w-sm rounded-2xl bg-card px-4 py-3 text-sm text-foreground">
                    Este comprovante é do cartão ou da conta bancária?
                  </div>
                  <div className="ml-auto max-w-sm rounded-2xl bg-primary px-4 py-3 text-sm text-background">
                    É da conta bancária principal.
                  </div>
                  <div className="max-w-sm rounded-2xl bg-card px-4 py-3 text-sm text-foreground">
                    Perfeito. Encontrei a data, o valor e a origem do documento.
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-secondary/20 p-5">
                <div className="flex items-center gap-2 text-foreground">
                  <DocumentIcon className="h-5 w-5 text-primary" />
                  <p className="text-sm font-medium">O que você ganha aqui</p>
                </div>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <li>Consulte extratos bancários e comprovantes com linguagem natural.</li>
                  <li>Encontre respostas rápidas sem abrir arquivo por arquivo.</li>
                  <li>Use a biblioteca para manter os documentos organizados.</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-between gap-3">
              <Button variant="outline" onClick={goBack}>
                Voltar
              </Button>
              <Button onClick={goNext}>Próximo</Button>
            </div>
          </div>
        ) : null}

        {currentStep === "next-actions" ? (
          <div className="space-y-5">
            <div className="grid gap-3 md:grid-cols-2">
              <ActionCard
                active={selectedNextAction === "expense"}
                icon={ExpenseIcon}
                title="Registrar primeira despesa"
                description="Abra a despesa nova direto no fluxo principal."
                onClick={() => setSelectedNextAction("expense")}
              />

              {!isExpenseOnly ? (
                <ActionCard
                  active={selectedNextAction === "income"}
                  icon={IncomeIcon}
                  title="Adicionar receita"
                  description="Comece a acompanhar as entradas do mês."
                  onClick={() => setSelectedNextAction("income")}
                />
              ) : null}

              {!isExpenseOnly ? (
                <ActionCard
                  active={selectedNextAction === "planning"}
                  icon={PlanningIcon}
                  title="Iniciar planejamento do mês"
                  description="Monte a visão do mês com uma base clara."
                  onClick={() => setSelectedNextAction("planning")}
                />
              ) : null}

              {!isExpenseOnly ? (
                <ActionCard
                  active={selectedNextAction === "documents"}
                  icon={DocumentIcon}
                  title="Enviar primeiro documento"
                  description="Experimente a biblioteca com apoio da IA."
                  onClick={() => setSelectedNextAction("documents")}
                />
              ) : null}
            </div>

            <div className="flex justify-between gap-3">
              <Button variant="outline" onClick={goBack}>
                Voltar
              </Button>
              <Button onClick={handleComplete} disabled={isCompleting}>
                {isCompleting ? "Concluindo..." : "Concluir"}
              </Button>
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
