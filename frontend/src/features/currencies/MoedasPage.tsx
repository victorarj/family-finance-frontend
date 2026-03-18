import axios from "axios";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { getApiErrorMessage } from "../../utils/apiError";
import {
  activateCurrency,
  createCurrency,
  listCurrencies,
  removeCurrency,
  updateCurrency,
} from "./currencies.api";
import type { Currency } from "./currencies.types";

const GET_ERROR_MESSAGE = "Não foi possível carregar as moedas. Tente novamente.";
const CREATE_ERROR_MESSAGE = "Não foi possível criar a moeda. Tente novamente.";
const UPDATE_ERROR_MESSAGE = "Não foi possível atualizar a moeda. Tente novamente.";
const REMOVE_ERROR_MESSAGE = "Não foi possível atualizar a moeda. Tente novamente.";
const ACTIVATE_ERROR_MESSAGE = "Não foi possível reativar a moeda. Tente novamente.";
const DUPLICATE_ERROR_MESSAGE = "Esta moeda já existe.";

const sortCurrencies = (items: Currency[]) =>
  [...items].sort((left, right) => left.codigo.localeCompare(right.codigo));

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
  const isMountedRef = useRef(true);

  const activeCurrencies = useMemo(
    () => sortCurrencies(currencies.filter((currency) => currency.ativo)),
    [currencies],
  );
  const inactiveCurrencies = useMemo(
    () => sortCurrencies(currencies.filter((currency) => !currency.ativo)),
    [currencies],
  );

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadCurrencies = async (signal?: AbortSignal) => {
    setLoading(true);
    setLoadError(false);
    setSaveError(null);
    try {
      const response = await listCurrencies({ signal, includeInactive: true });
      if (signal?.aborted || !isMountedRef.current) return;
      setCurrencies(sortCurrencies(Array.isArray(response.data) ? response.data : []));
    } catch (error) {
      if (axios.isCancel(error)) return;
      setLoadError(true);
    } finally {
      if (!signal?.aborted && isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    void loadCurrencies(controller.signal);
    return () => controller.abort();
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
        if (!isMountedRef.current) return;
        setCurrencies((current) =>
          sortCurrencies(
            current.map((item) =>
              item.codigo === editing.codigo ? response.data : item,
            ),
          ),
        );
      } else {
        const response = await createCurrency({ codigo: normalizedCode });
        if (!isMountedRef.current) return;
        setCurrencies((current) => sortCurrencies([...current, response.data]));
      }
      closeSheet();
    } catch (error: unknown) {
      if (!isMountedRef.current || axios.isCancel(error)) return;
      setSaveError(
        getApiErrorMessage(
          error,
          editing ? UPDATE_ERROR_MESSAGE : CREATE_ERROR_MESSAGE,
        ) || DUPLICATE_ERROR_MESSAGE,
      );
    } finally {
      if (isMountedRef.current) setSaving(false);
    }
  };

  const handleRemove = async (currency: Currency) => {
    const previousCurrencies = currencies;
    setSaveError(null);
    setDeletingCode(currency.codigo);
    setCurrencies((current) =>
      current.map((item) =>
        item.codigo === currency.codigo ? { ...item, ativo: false } : item,
      ),
    );

    try {
      const response = await removeCurrency(currency.codigo);
      if (!isMountedRef.current) return;
      if ((response.data as Currency & { deleted?: boolean }).deleted) {
        setCurrencies((current) => current.filter((item) => item.codigo !== currency.codigo));
      } else {
        setCurrencies((current) =>
          current.map((item) => (item.codigo === currency.codigo ? response.data : item)),
        );
      }
      setConfirmingDeleteCode(null);
    } catch (error) {
      if (!isMountedRef.current || axios.isCancel(error)) return;
      setCurrencies(previousCurrencies);
      setSaveError(getApiErrorMessage(error, REMOVE_ERROR_MESSAGE));
    } finally {
      if (isMountedRef.current) setDeletingCode(null);
    }
  };

  const handleActivate = async (currency: Currency) => {
    setSaveError(null);
    try {
      const response = await activateCurrency(currency.codigo);
      if (!isMountedRef.current) return;
      setCurrencies((current) =>
        current.map((item) => (item.codigo === currency.codigo ? response.data : item)),
      );
    } catch (error) {
      if (!isMountedRef.current || axios.isCancel(error)) return;
      setSaveError(getApiErrorMessage(error, ACTIVATE_ERROR_MESSAGE));
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
          <h3 className="text-lg">Ativas</h3>
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
          ) : activeCurrencies.length === 0 ? (
            <EmptyState
              title="Nenhuma moeda ativa."
              description="Adicione uma nova moeda."
              icon={<TagIcon className="h-8 w-8 text-muted-foreground" />}
            />
          ) : (
            activeCurrencies.map((currency) => (
              <div key={currency.codigo} className="rounded-xl border border-border bg-background px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="rounded-md bg-secondary px-2 py-1 font-mono text-sm font-semibold tracking-wide text-foreground">
                      {currency.codigo}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {currency.is_default && <span className="rounded-full bg-secondary px-2 py-1">Padrão</span>}
                      {currency.is_in_use && <span className="rounded-full bg-warning-soft px-2 py-1 text-warning">Em uso</span>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => openEdit(currency)}>
                      Editar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={currency.can_delete ? "destructive" : "ghost"}
                      onClick={() => setConfirmingDeleteCode(currency.codigo)}
                      disabled={deletingCode === currency.codigo}
                    >
                      {currency.can_delete ? "Excluir" : "Desativar"}
                    </Button>
                  </div>
                </div>
                {confirmingDeleteCode === currency.codigo && (
                  <div className="mt-3 space-y-3 rounded-lg border border-expense/30 bg-expense-soft p-3">
                    <p className="text-sm text-foreground">
                      {currency.can_delete
                        ? "Tem certeza? Esta ação é permanente e não pode ser desfeita."
                        : "Esta moeda será apenas desativada porque é padrão ou já está em uso. Deseja continuar?"}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={currency.can_delete ? "destructive" : "outline"}
                        onClick={() => handleRemove(currency)}
                        disabled={deletingCode === currency.codigo}
                      >
                        {deletingCode === currency.codigo
                          ? currency.can_delete ? "Excluindo..." : "Desativando..."
                          : currency.can_delete ? "Excluir" : "Desativar"}
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

        <Card className="space-y-3">
          <h3 className="text-lg">Inativas</h3>
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
          ) : inactiveCurrencies.length === 0 ? (
            <EmptyState
              title="Nenhuma moeda inativa."
              description=""
              icon={<TagIcon className="h-8 w-8 text-muted-foreground" />}
            />
          ) : (
            inactiveCurrencies.map((currency) => (
              <div key={currency.codigo} className="rounded-xl border border-border bg-background px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="rounded-md bg-secondary px-2 py-1 font-mono text-sm font-semibold tracking-wide text-muted-foreground">
                      {currency.codigo}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {currency.is_default && <span className="rounded-full bg-secondary px-2 py-1">Padrão</span>}
                      {currency.is_in_use && <span className="rounded-full bg-warning-soft px-2 py-1 text-warning">Em uso</span>}
                    </div>
                  </div>
                  <Button type="button" size="sm" variant="outline" onClick={() => handleActivate(currency)}>
                    Reativar
                  </Button>
                </div>
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
