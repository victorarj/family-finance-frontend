import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { create as createBankAccount, list as listBankAccounts } from "../apis/bankAccounts";
import { getPreferences, savePreferences } from "../apis/preferences";
import { useAuth } from "../auth/AuthContext";
import Button from "../components/Button";
import Card from "../components/Card";
import FormField from "../components/FormField";
import Input from "../components/Input";
import Select from "../components/Select";
import type { BankAccount, UserPreferences } from "../types";

type Step = 1 | 2 | 3;

const DEFAULT_PREFERENCES: UserPreferences = {
  tipo_residencia: "arrendada",
  modo_registro: "completo",
  planejamento_guiado: true,
};

const DEFAULT_ACCOUNT = {
  nome_conta: "",
  banco: "",
  moeda: "EUR",
};

const STEP_META: Record<Step, { eyebrow: string; title: string; description: string }> = {
  1: {
    eyebrow: "Passo 1",
    title: "Como voce quer organizar a casa?",
    description: "Defina o modo de uso inicial para personalizar o planeamento e os registos.",
  },
  2: {
    eyebrow: "Passo 2",
    title: "Adicione a primeira conta",
    description: "Use uma conta principal para ligar despesas, receitas e planeamento mensal.",
  },
  3: {
    eyebrow: "Passo 3",
    title: "Revise e conclua",
    description: "Confirme as escolhas iniciais antes de entrar no painel principal.",
  },
};

export default function OnboardingPage() {
  const auth = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>(1);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [accountForm, setAccountForm] = useState(DEFAULT_ACCOUNT);

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      try {
        const [preferencesResponse, accountsResponse] = await Promise.all([
          getPreferences().catch(() => ({ data: null })),
          listBankAccounts().catch(() => ({ data: [] as BankAccount[] })),
        ]);

        if (!isMounted) return;

        if (preferencesResponse.data) {
          setPreferences({
            tipo_residencia:
              preferencesResponse.data.tipo_residencia || DEFAULT_PREFERENCES.tipo_residencia,
            modo_registro:
              preferencesResponse.data.modo_registro || DEFAULT_PREFERENCES.modo_registro,
            planejamento_guiado:
              preferencesResponse.data.planejamento_guiado ?? DEFAULT_PREFERENCES.planejamento_guiado,
          });
        }

        setAccounts(accountsResponse.data ?? []);
      } catch {
        if (isMounted) {
          setError("Nao foi possivel carregar o onboarding.");
        }
      } finally {
        if (isMounted) {
          setIsBootstrapping(false);
        }
      }
    }

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  const refreshAccounts = async () => {
    const response = await listBankAccounts();
    setAccounts(response.data ?? []);
    return response.data ?? [];
  };

  const handlePreferencesSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSavingPreferences(true);

    try {
      await savePreferences(preferences);
      setStep(2);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Falha ao salvar preferencias.");
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
      setStep(3);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Falha ao criar conta.");
    } finally {
      setIsSavingAccount(false);
    }
  };

  const handleContinueWithoutCreating = async () => {
    setError(null);

    try {
      const latestAccounts = await refreshAccounts();
      if (latestAccounts.length === 0) {
        setError("Crie pelo menos uma conta para continuar.");
        return;
      }
      setStep(3);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Falha ao carregar contas.");
    }
  };

  const handleComplete = async () => {
    setError(null);
    setIsCompleting(true);

    try {
      await auth.completeOnboarding();
      navigate("/", { replace: true });
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Falha ao concluir onboarding.");
    } finally {
      setIsCompleting(false);
    }
  };

  if (isBootstrapping) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Card>
          <p className="text-sm text-muted-foreground">Carregando onboarding...</p>
        </Card>
      </div>
    );
  }

  const stepMeta = STEP_META[step];
  const hasAccounts = accounts.length > 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Card className="space-y-8 p-6 md:p-8">
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Configuracao inicial</p>
              <h2 className="text-3xl text-foreground">Configure a sua conta</h2>
            </div>
            <div className="rounded-full bg-secondary px-4 py-2 text-sm text-foreground">
              Passo {step} de 3
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className={`h-2 rounded-full ${item <= step ? "bg-primary" : "bg-muted"}`}
              />
            ))}
          </div>

          <div className="rounded-2xl border border-border bg-secondary/40 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{stepMeta.eyebrow}</p>
            <h3 className="mt-2 text-xl text-foreground">{stepMeta.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{stepMeta.description}</p>
          </div>
        </div>

        {error && <p className="rounded-md bg-expense-soft px-3 py-2 text-sm text-expense">{error}</p>}

        {step === 1 && (
          <form className="space-y-4" onSubmit={handlePreferencesSubmit}>
            <FormField label="Tipo de residencia" required>
              <Select
                value={preferences.tipo_residencia}
                onChange={(event) =>
                  setPreferences((current) => ({ ...current, tipo_residencia: event.target.value }))
                }
              >
                <option value="arrendada">Arrendada</option>
                <option value="propria">Propria</option>
                <option value="familiar">Casa familiar</option>
              </Select>
            </FormField>

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
                <span className="block font-medium text-foreground">Usar planeamento guiado</span>
                <span className="block text-muted-foreground">
                  Mostra uma experiencia mais assistida para montar o mes e acompanhar objetivos.
                </span>
              </span>
            </label>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={isSavingPreferences}>
                {isSavingPreferences ? "Salvando..." : "Continuar"}
              </Button>
            </div>
          </form>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-secondary/20 p-5">
              <p className="text-sm font-medium text-foreground">Contas ja encontradas</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {hasAccounts
                  ? "Pode reutilizar uma conta existente ou adicionar outra agora."
                  : "Ainda nao existe nenhuma conta para associar aos seus registos."}
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

              <FormField label="Moeda" required helperText="Ex.: EUR, USD, BRL">
                <Input
                  value={accountForm.moeda}
                  onChange={(event) =>
                    setAccountForm((current) => ({ ...current, moeda: event.target.value.toUpperCase() }))
                  }
                  required
                />
              </FormField>

              <div className="flex flex-wrap justify-between gap-3 pt-2">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Voltar
                </Button>
                <div className="flex gap-3">
                  {hasAccounts && (
                    <Button variant="secondary" onClick={handleContinueWithoutCreating}>
                      Usar conta existente
                    </Button>
                  )}
                  <Button type="submit" disabled={isSavingAccount}>
                    {isSavingAccount ? "Salvando..." : "Criar conta e continuar"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-border bg-secondary/20 p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Preferencias</p>
                <div className="mt-3 space-y-2 text-sm text-foreground">
                  <p>Tipo de residencia: {preferences.tipo_residencia}</p>
                  <p>Modo de registro: {preferences.modo_registro}</p>
                  <p>Planeamento guiado: {preferences.planejamento_guiado ? "Sim" : "Nao"}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-secondary/20 p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Contas</p>
                <div className="mt-3 space-y-2 text-sm text-foreground">
                  <p>Total configurado: {accounts.length}</p>
                  {accounts.slice(0, 2).map((account) => (
                    <p key={account.id}>
                      {account.nome_conta} - {account.moeda}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-between gap-3">
              <Button variant="outline" onClick={() => setStep(2)}>
                Voltar
              </Button>
              <Button onClick={handleComplete} disabled={isCompleting}>
                {isCompleting ? "Finalizando..." : "Concluir"}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
