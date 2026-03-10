import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { create as createBankAccount, list as listBankAccounts } from "../apis/bankAccounts";
import { getPreferences, savePreferences } from "../apis/preferences";
import { useAuth } from "../auth/AuthContext";
import type { BankAccount, BankAccountInput, UserPreferences } from "../types";
import BankAccountForm from "../components/BankAccountForm";
import Button from "../components/Button";
import Card from "../components/Card";
import Container from "../components/Container";
import FormField from "../components/FormField";
import Select from "../components/Select";

const DEFAULT_PREFERENCES: UserPreferences = {
  tipo_residencia: "apartamento",
  modo_registro: "completo",
  planejamento_guiado: true,
};

export default function OnboardingPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loadingPreferences, setLoadingPreferences] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [savingAccount, setSavingAccount] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [preferencesError, setPreferencesError] = useState<string | null>(null);
  const [accountError, setAccountError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoadingPreferences(true);
      try {
        const [preferencesResponse, bankAccountsResponse] = await Promise.all([
          getPreferences(),
          listBankAccounts(),
        ]);
        if (preferencesResponse.data) {
          setPreferences(preferencesResponse.data);
        }
        setAccounts(Array.isArray(bankAccountsResponse.data) ? bankAccountsResponse.data : []);
      } catch (error) {
        setPreferencesError(error instanceof Error ? error.message : "Falha ao carregar onboarding");
      } finally {
        setLoadingPreferences(false);
      }
    };

    load();
  }, []);

  const handleSavePreferences = async (event: React.FormEvent) => {
    event.preventDefault();
    setSavingPreferences(true);
    setPreferencesError(null);
    try {
      await savePreferences(preferences);
      await auth.refreshCurrentUser();
      setStep(2);
    } catch (error) {
      setPreferencesError(error instanceof Error ? error.message : "Falha ao salvar preferências");
    } finally {
      setSavingPreferences(false);
    }
  };

  const handleAddAccount = async (value: BankAccountInput) => {
    setSavingAccount(true);
    setAccountError(null);
    try {
      const response = await createBankAccount(value);
      setAccounts((current) => [...current, response.data]);
    } catch (error) {
      setAccountError(error instanceof Error ? error.message : "Falha ao salvar conta");
    } finally {
      setSavingAccount(false);
    }
  };

  const handleFinish = async () => {
    setFinishing(true);
    setAccountError(null);
    try {
      await auth.completeOnboarding();
      navigate("/", { replace: true });
    } catch (error) {
      setAccountError(error instanceof Error ? error.message : "Falha ao concluir onboarding");
    } finally {
      setFinishing(false);
    }
  };

  return (
    <Container>
      <div className="py-8">
        <Card className="space-y-5">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-primary">Onboarding</p>
            <h2 className="mt-2 text-2xl">Configure o essencial e comece leve.</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Primeiro salvamos suas preferências. Depois você pode adicionar contas bancárias agora ou deixar isso para depois.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className={step === 1 ? "text-foreground" : ""}>1. Preferências</span>
            <span>/</span>
            <span className={step === 2 ? "text-foreground" : ""}>2. Contas bancárias</span>
          </div>

          {step === 1 ? (
            <form className="space-y-3" onSubmit={handleSavePreferences}>
              {preferencesError && <p className="rounded-md bg-expense-soft px-3 py-2 text-sm text-expense">{preferencesError}</p>}

              <FormField label="Tipo de residência" required>
                <Select
                  value={preferences.tipo_residencia}
                  onChange={(event) =>
                    setPreferences((current) => ({ ...current, tipo_residencia: event.target.value }))
                  }
                  required
                  disabled={loadingPreferences || savingPreferences}
                >
                  <option value="apartamento">Apartamento</option>
                  <option value="casa">Casa</option>
                </Select>
              </FormField>

              <FormField label="Modo de registro" required helperText="Escolha o nível de detalhe inicial.">
                <Select
                  value={preferences.modo_registro}
                  onChange={(event) =>
                    setPreferences((current) => ({
                      ...current,
                      modo_registro: event.target.value as UserPreferences["modo_registro"],
                    }))
                  }
                  required
                  disabled={loadingPreferences || savingPreferences}
                >
                  <option value="completo">Completo</option>
                  <option value="despesas">Apenas despesas</option>
                </Select>
              </FormField>

              <FormField label="Planejamento guiado" required>
                <Select
                  value={preferences.planejamento_guiado ? "true" : "false"}
                  onChange={(event) =>
                    setPreferences((current) => ({
                      ...current,
                      planejamento_guiado: event.target.value === "true",
                    }))
                  }
                  required
                  disabled={loadingPreferences || savingPreferences}
                >
                  <option value="true">Sim, quero orientação</option>
                  <option value="false">Não, prefiro menos guia</option>
                </Select>
              </FormField>

              <Button type="submit" disabled={loadingPreferences || savingPreferences}>
                {savingPreferences ? "Salvando..." : "Continuar"}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-surface p-4">
                <h3 className="text-lg">Adicionar conta bancária</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Recomendado para registrar despesas com contexto real, mas você pode pular por agora.
                </p>
                <div className="mt-4">
                  <BankAccountForm
                    submitLabel="Adicionar conta"
                    loading={savingAccount}
                    error={accountError}
                    onSubmit={handleAddAccount}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg">Contas adicionadas</h3>
                {accounts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma conta adicionada ainda.</p>
                ) : (
                  accounts.map((account) => (
                    <div key={account.id} className="rounded-xl border border-border bg-background px-4 py-3">
                      <p className="text-sm font-medium text-foreground">{account.nome_conta}</p>
                      <p className="text-sm text-muted-foreground">
                        {account.banco} · {account.moeda}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" onClick={handleFinish} disabled={finishing}>
                  {finishing ? "Concluindo..." : accounts.length ? "Concluir onboarding" : "Pular por agora"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setStep(1)} disabled={finishing || savingAccount}>
                  Voltar
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </Container>
  );
}
