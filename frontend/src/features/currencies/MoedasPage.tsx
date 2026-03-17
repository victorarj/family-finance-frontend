import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import Button from "../../components/Button";
import Card from "../../components/Card";
import Container from "../../components/Container";
import EmptyState from "../../components/EmptyState";
import { ChevronLeftIcon, RetryIcon, TagIcon } from "../../components/Icons";
import Input from "../../components/Input";
import LoadingState from "../../components/LoadingState";
import TransactionSheet from "../../components/TransactionSheet";
import {
  createCurrency,
  deleteCurrency,
  listCurrencies,
  updateCurrency,
} from "./currencies.api";
import type { Currency } from "./currencies.types";

const GET_ERROR_MESSAGE = "Não foi possível carregar as moedas. Tente novamente.";
const CREATE_ERROR_MESSAGE = "Não foi possível criar a moeda. Tente novamente.";
const UPDATE_ERROR_MESSAGE = "Não foi possível atualizar a moeda. Tente novamente.";
const DELETE_ERROR_MESSAGE = "Não foi possível excluir a moeda. Tente novamente.";
const DUPLICATE_ERROR_MESSAGE = "Esta moeda já existe.";

const sortCurrencies = (items: Currency[]) =>
  [...items].sort((left, right) => left.codigo.localeCompare(right.codigo));

function isDuplicateError(error: unknown) {
  if (!axios.isAxiosError(error)) {
    return false;
  }

  if (error.response?.status === 409) {
    return true;
  }

  const message = String(error.response?.data?.message ?? "").toLowerCase();
  return message.includes("already") || message.includes("duplicate") || message.includes("existe");
}

export default function MoedasPage() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Currency | null>(null);
  const [codigo, setCodigo] = useState("");
  const [confirmingDeleteCode, setConfirmingDeleteCode] = useState<string | null>(null);
  const [deletingCode, setDeletingCode] = useState<string | null>(null);

  const sortedCurrencies = useMemo(() => sortCurrencies(currencies), [currencies]);

  const loadCurrencies = async () => {
    setLoading(true);
    setLoadError(false);
    setSaveError(null);
    try {
      const response = await listCurrencies();
      setCurrencies(sortCurrencies(Array.isArray(response.data) ? response.data : []));
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCurrencies();
  }, []);

  const closeSheet = () => {
    setSheetOpen(false);
    setEditing(null);
    setCodigo("");
    setSaveError(null);
  };

  const openCreate = () => {
    setEditing(null);
    setCodigo("");
    setSaveError(null);
    setSheetOpen(true);
  };

  const openEdit = (currency: Currency) => {
    setEditing(currency);
    setCodigo(currency.codigo);
    setSaveError(null);
    setSheetOpen(true);
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedCode = codigo.trim().toUpperCase();

    if (!normalizedCode) {
      setSaveError("Informe um código de moeda válido.");
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      if (editing) {
        const response = await updateCurrency(editing.codigo, { novo_codigo: normalizedCode });
        setCurrencies((current) =>
          sortCurrencies(
            current.map((item) =>
              item.codigo === editing.codigo ? response.data : item,
            ),
          ),
        );
      } else {
        const response = await createCurrency({ codigo: normalizedCode });
        setCurrencies((current) => sortCurrencies([...current, response.data]));
      }
      closeSheet();
    } catch (error: unknown) {
      if (isDuplicateError(error)) {
        setSaveError(DUPLICATE_ERROR_MESSAGE);
      } else {
        setSaveError(editing ? UPDATE_ERROR_MESSAGE : CREATE_ERROR_MESSAGE);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (currency: Currency) => {
    const previousCurrencies = currencies;
    setSaveError(null);
    setDeletingCode(currency.codigo);
    setCurrencies((current) => current.filter((item) => item.codigo !== currency.codigo));

    try {
      await deleteCurrency(currency.codigo);
      setConfirmingDeleteCode(null);
    } catch {
      setCurrencies(previousCurrencies);
      setSaveError(DELETE_ERROR_MESSAGE);
    } finally {
      setDeletingCode(null);
    }
  };

  return (
    <Container size="lg">
      <div className="space-y-4 px-4 py-4 md:px-0 md:py-6">
        <Card className="space-y-3">
          <Link
            to="/configuracoes"
            className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-primary md:hidden"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            <span>Configurações</span>
          </Link>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-primary">Configurações</p>
              <h2 className="mt-2 text-2xl">Moedas</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Gerencie as moedas disponíveis para contas e transações
              </p>
            </div>
            <Button type="button" onClick={openCreate}>Nova moeda</Button>
          </div>
        </Card>

        {saveError && <p className="rounded-md bg-expense-soft px-3 py-2 text-sm text-expense">{saveError}</p>}

        <Card className="space-y-3">
          <h3 className="text-lg">Moedas cadastradas</h3>
          {loading ? (
            <LoadingState label="Carregando moedas..." />
          ) : loadError ? (
            <EmptyState
              title={GET_ERROR_MESSAGE}
              description="Verifique sua conexão e tente novamente."
              icon={<RetryIcon className="h-8 w-8 text-muted-foreground" />}
              actionLabel="Tentar novamente"
              onAction={loadCurrencies}
            />
          ) : sortedCurrencies.length === 0 ? (
            <EmptyState
              title="Nenhuma moeda cadastrada."
              description="Adicione uma nova moeda."
              icon={<TagIcon className="h-8 w-8 text-muted-foreground" />}
            />
          ) : (
            sortedCurrencies.map((currency) => (
              <div key={currency.codigo} className="rounded-xl border border-border bg-background px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="rounded-md bg-secondary px-2 py-1 font-mono text-sm font-semibold tracking-wide text-foreground">
                    {currency.codigo}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => openEdit(currency)}>
                      Editar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => setConfirmingDeleteCode(currency.codigo)}
                      disabled={deletingCode === currency.codigo}
                    >
                      Excluir
                    </Button>
                  </div>
                </div>
                {confirmingDeleteCode === currency.codigo && (
                  <div className="mt-3 space-y-3 rounded-lg border border-expense/30 bg-expense-soft p-3">
                    <p className="text-sm text-foreground">
                      Tem certeza? Esta ação é permanente e não pode ser desfeita.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(currency)}
                        disabled={deletingCode === currency.codigo}
                      >
                        {deletingCode === currency.codigo ? "Excluindo..." : "Excluir"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setConfirmingDeleteCode(null)}
                        disabled={deletingCode === currency.codigo}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </Card>
      </div>

      <TransactionSheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) {
            setEditing(null);
            setCodigo("");
            setSaveError(null);
          }
        }}
        title={editing ? "Editar moeda" : "Nova moeda"}
        description="Defina os códigos disponíveis para contas e transações."
      >
        <form className="space-y-3" onSubmit={handleSave}>
          {saveError && <p className="rounded-md bg-expense-soft px-3 py-2 text-sm text-expense">{saveError}</p>}
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground" htmlFor="currency-code">
              {editing ? "Novo código" : "Código da moeda"}
            </label>
            <Input
              id="currency-code"
              value={codigo}
              onChange={(event) => setCodigo(event.target.value.toUpperCase())}
              required
              disabled={saving}
              maxLength={10}
            />
            <p className="text-xs text-muted-foreground">Ex: BRL, USD, EUR</p>
          </div>
          <div className="flex items-center gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
            <Button type="button" variant="ghost" onClick={closeSheet} disabled={saving}>
              Cancelar
            </Button>
          </div>
        </form>
      </TransactionSheet>
    </Container>
  );
}
