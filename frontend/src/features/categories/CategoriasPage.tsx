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
  activateCategory,
  createCategory,
  listCategories,
  removeCategory,
  updateCategory,
} from "./categories.api";
import type { Category } from "./categories.types";

const GET_ERROR_MESSAGE = "Não foi possível carregar as categorias. Tente novamente.";
const SAVE_ERROR_MESSAGE = "Não foi possível salvar a categoria. Tente novamente.";
const REMOVE_ERROR_MESSAGE = "Não foi possível atualizar a categoria. Tente novamente.";
const ACTIVATE_ERROR_MESSAGE = "Não foi possível reativar a categoria. Tente novamente.";

export default function CategoriasPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<Category | null>(null);
  const isMountedRef = useRef(true);

  const activeCategories = useMemo(
    () => categories.filter((category) => category.ativo),
    [categories],
  );
  const inactiveCategories = useMemo(
    () => categories.filter((category) => !category.ativo),
    [categories],
  );

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadCategories = async (signal?: AbortSignal) => {
    setLoading(true);
    setLoadError(false);
    try {
      const response = await listCategories(true, { signal });
      if (signal?.aborted || !isMountedRef.current) return;
      setCategories(Array.isArray(response.data) ? response.data : []);
    } catch {
      if (signal?.aborted) return;
      setLoadError(true);
    } finally {
      if (!signal?.aborted && isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    void loadCategories(controller.signal);
    return () => controller.abort();
  }, []);

  const closeSheet = () => {
    setSheetOpen(false);
    setEditing(null);
    setName("");
    setSaveError(null);
  };

  const openCreate = () => {
    setEditing(null);
    setName("");
    setSaveError(null);
    setSheetOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditing(category);
    setName(category.nome);
    setSaveError(null);
    setSheetOpen(true);
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setSaveError("Informe um nome válido para a categoria.");
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      if (editing) {
        if (!editing.id) {
          throw new Error("Categoria inválida para edição.");
        }
        const response = await updateCategory(editing.id, { nome: trimmedName });
        if (!isMountedRef.current) return;
        setCategories((current) =>
          current.map((category) =>
            category.id === editing.id ? response.data : category,
          ),
        );
      } else {
        const response = await createCategory({ nome: trimmedName });
        if (!isMountedRef.current) return;
        setCategories((current) =>
          [...current, { ...response.data, ativo: response.data.ativo ?? true }].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
        );
      }
      closeSheet();
    } catch (error) {
      if (!isMountedRef.current || axios.isCancel(error)) return;
      setSaveError(getApiErrorMessage(error, SAVE_ERROR_MESSAGE));
    } finally {
      if (isMountedRef.current) setSaving(false);
    }
  };

  const handleRemove = async (category: Category) => {
    const confirmed = window.confirm(
      category.can_delete
        ? "Deseja excluir esta categoria?"
        : "Esta categoria será apenas desativada porque é padrão ou já está em uso. Deseja continuar?",
    );
    if (!confirmed) return;
    if (!category.id) {
      setSaveError(REMOVE_ERROR_MESSAGE);
      return;
    }

    setLoadError(false);
    setSaveError(null);
    const previousCategories = categories;
    setCategories((current) =>
      current.map((item) =>
        item.id === category.id ? { ...item, ativo: false } : item,
      ),
    );

    try {
      const response = await removeCategory(category.id);
      if (!isMountedRef.current) return;
      if ((response.data as Category & { deleted?: boolean }).deleted) {
        setCategories((current) => current.filter((item) => item.id !== category.id));
      } else {
        setCategories((current) =>
          current.map((item) => (item.id === category.id ? response.data : item)),
        );
      }
    } catch (error) {
      if (!isMountedRef.current || axios.isCancel(error)) return;
      setCategories(previousCategories);
      setSaveError(getApiErrorMessage(error, REMOVE_ERROR_MESSAGE));
    }
  };

  const handleActivate = async (category: Category) => {
    if (!category.id) {
      setSaveError(ACTIVATE_ERROR_MESSAGE);
      return;
    }

    setSaveError(null);
    try {
      const response = await activateCategory(category.id);
      if (!isMountedRef.current) return;
      setCategories((current) =>
        current.map((item) => (item.id === category.id ? response.data : item)),
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
              <h2 className="mt-2 text-2xl">Categorias</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Gerencie as categorias usadas em despesas e receitas
              </p>
            </div>
            <Button type="button" onClick={openCreate}>Nova categoria</Button>
          </div>
        </Card>

        {saveError && <p className="rounded-md bg-expense-soft px-3 py-2 text-sm text-expense">{saveError}</p>}

        <Card className="space-y-3">
          <h3 className="text-lg">Ativas</h3>
          {loading ? (
            <LoadingState label="Carregando categorias..." />
          ) : loadError ? (
            <EmptyState
              title={GET_ERROR_MESSAGE}
              description="Verifique sua conexão e tente novamente."
              icon={<RetryIcon className="h-8 w-8 text-muted-foreground" />}
              actionLabel="Tentar novamente"
              onAction={loadCategories}
            />
          ) : activeCategories.length === 0 ? (
            <EmptyState
              title="Nenhuma categoria ativa."
              description="Adicione uma nova categoria."
              icon={<TagIcon className="h-8 w-8 text-muted-foreground" />}
            />
          ) : (
            activeCategories.map((category) => (
              <div key={category.id} className="rounded-xl border border-border bg-background px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-medium text-foreground">{category.nome}</p>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => openEdit(category)}>
                      Editar
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => handleRemove(category)}>
                      {category.can_delete ? "Excluir" : "Desativar"}
                    </Button>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {category.is_default && <span className="rounded-full bg-secondary px-2 py-1">Padrão</span>}
                  {category.is_in_use && <span className="rounded-full bg-warning-soft px-2 py-1 text-warning">Em uso</span>}
                </div>
              </div>
            ))
          )}
        </Card>

        <Card className="space-y-3">
          <h3 className="text-lg">Inativas</h3>
          {loading ? (
            <LoadingState label="Carregando categorias..." />
          ) : loadError ? (
            <EmptyState
              title={GET_ERROR_MESSAGE}
              description="Verifique sua conexão e tente novamente."
              icon={<RetryIcon className="h-8 w-8 text-muted-foreground" />}
              actionLabel="Tentar novamente"
              onAction={loadCategories}
            />
          ) : inactiveCategories.length === 0 ? (
            <EmptyState
              title="Nenhuma categoria inativa."
              description=""
              icon={<TagIcon className="h-8 w-8 text-muted-foreground" />}
            />
          ) : (
            inactiveCategories.map((category) => (
              <div key={category.id} className="rounded-xl border border-border bg-background px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{category.nome}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {category.is_default && <span className="rounded-full bg-secondary px-2 py-1">Padrão</span>}
                      {category.is_in_use && <span className="rounded-full bg-warning-soft px-2 py-1 text-warning">Em uso</span>}
                    </div>
                  </div>
                  <Button type="button" size="sm" variant="outline" onClick={() => handleActivate(category)}>
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
            setName("");
            setSaveError(null);
          }
        }}
        title={editing ? "Editar categoria" : "Nova categoria"}
        description="Mantenha a lista de categorias organizada para despesas e receitas."
      >
        <form className="space-y-3" onSubmit={handleSave}>
          {saveError && <p className="rounded-md bg-expense-soft px-3 py-2 text-sm text-expense">{saveError}</p>}
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground" htmlFor="category-name">
              Nome da categoria
            </label>
            <Input
              id="category-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              disabled={saving}
            />
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
