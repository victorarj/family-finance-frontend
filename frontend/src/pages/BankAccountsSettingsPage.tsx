import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  create as createBankAccount,
  deactivate as deactivateBankAccount,
  list as listBankAccounts,
  remove as removeBankAccount,
  update as updateBankAccount,
} from "../apis/bankAccounts";
import type { BankAccount, BankAccountInput } from "../types";
import { getApiErrorMessage } from "../utils/apiError";
import BankAccountForm from "../components/BankAccountForm";
import Button from "../components/Button";
import Card from "../components/Card";
import Container from "../components/Container";
import TransactionSheet from "../components/TransactionSheet";

function toInput(account: BankAccount): BankAccountInput {
  return {
    nome_conta: account.nome_conta,
    banco: account.banco,
    moeda: account.moeda,
  };
}

export default function BankAccountsSettingsPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<BankAccount | null>(null);

  const loadAccounts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await listBankAccounts();
      setAccounts(Array.isArray(response.data) ? response.data : []);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, "Falha ao carregar contas"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const handleSave = async (value: BankAccountInput) => {
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        await updateBankAccount(editing.id, value);
      } else {
        await createBankAccount(value);
      }
      await loadAccounts();
      setSheetOpen(false);
      setEditing(null);
    } catch (saveError) {
      setError(getApiErrorMessage(saveError, "Falha ao salvar conta"));
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (account: BankAccount) => {
    setError(null);
    try {
      await deactivateBankAccount(account.id);
      await loadAccounts();
    } catch (actionError) {
      setError(getApiErrorMessage(actionError, "Falha ao desativar conta"));
    }
  };

  const handleDelete = async (account: BankAccount) => {
    setError(null);
    try {
      await removeBankAccount(account.id);
      await loadAccounts();
    } catch (actionError) {
      setError(getApiErrorMessage(actionError, "Falha ao excluir conta"));
    }
  };

  const activeAccounts = accounts.filter((account) => account.ativo);
  const inactiveAccounts = accounts.filter((account) => !account.ativo);

  return (
    <Container size="lg">
      <div className="space-y-4 py-6">
        <Card className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-primary">Configurações</p>
              <h2 className="mt-2 text-2xl">Contas bancárias</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Crie, edite e desative contas. Contas com histórico continuam preservadas e não podem ser excluídas.
              </p>
            </div>
            <Button
              type="button"
              onClick={() => {
                setEditing(null);
                setSheetOpen(true);
              }}
            >
              Nova conta
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Precisa voltar ao registro diário? <Link className="text-primary hover:underline" to="/expenses">Ir para despesas</Link>
          </p>
        </Card>

        {error && <p className="rounded-md bg-expense-soft px-3 py-2 text-sm text-expense">{error}</p>}

        <Card className="space-y-3">
          <h3 className="text-lg">Ativas</h3>
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : activeAccounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma conta ativa.</p>
          ) : (
            activeAccounts.map((account) => (
              <div key={account.id} className="rounded-xl border border-border bg-background px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{account.nome_conta}</p>
                    <p className="text-sm text-muted-foreground">
                      {account.banco} · {account.moeda}
                    </p>
                    {!account.can_delete && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Conta com histórico: use desativação para preservar referências existentes.
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditing(account);
                        setSheetOpen(true);
                      }}
                    >
                      Editar
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => handleDeactivate(account)}>
                      Desativar
                    </Button>
                    {account.can_delete && (
                      <Button type="button" size="sm" variant="destructive" onClick={() => handleDelete(account)}>
                        Excluir
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </Card>

        <Card className="space-y-3">
          <h3 className="text-lg">Inativas</h3>
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : inactiveAccounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma conta inativa.</p>
          ) : (
            inactiveAccounts.map((account) => (
              <div key={account.id} className="rounded-xl border border-border bg-background px-4 py-3">
                <p className="text-sm font-medium text-foreground">{account.nome_conta}</p>
                <p className="text-sm text-muted-foreground">
                  {account.banco} · {account.moeda}
                </p>
              </div>
            ))
          )}
        </Card>
      </div>

      <TransactionSheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setEditing(null);
        }}
        title={editing ? "Editar conta bancária" : "Nova conta bancária"}
        description="Mantenha apenas contas ativas para novos lançamentos."
      >
        <BankAccountForm
          initialValue={editing ? toInput(editing) : null}
          submitLabel={editing ? "Salvar alterações" : "Criar conta"}
          loading={saving}
          error={error}
          onSubmit={handleSave}
          onCancel={() => {
            setSheetOpen(false);
            setEditing(null);
          }}
        />
      </TransactionSheet>
    </Container>
  );
}
