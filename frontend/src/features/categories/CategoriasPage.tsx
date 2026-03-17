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
  createCategory,
  deactivateCategory,
  listCategories,
  updateCategory,
} from "./categories.api";
import type { Category } from "./categories.types";

const GET_ERROR_MESSAGE = "Não foi possível carregar as categorias. Tente novamente.";
const SAVE_ERROR_MESSAGE = "Não foi possível salvar a categoria. Tente novamente.";
const DEACTIVATE_ERROR_MESSAGE = "Não foi possível desativar a categoria. Tente novamente.";

export default function CategoriasPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<Category | null>(null);

  const activeCategories = useMemo(
    () => categories.filter((category) => category.ativo),
    [categories],
  );
  const inactiveCategories = useMemo(
    () => categories.filter((category) => !category.ativo),
    [categories],
  );

  const loadCategories = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const response = await listCategories(true);
      setCategories(Array.isArray(response.data) ? response.data : []);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
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
        const response = await updateCategory(editing.id, { nome: trimmedName });
        setCategories((current) =>
          current.map((category) =>
            category.id === editing.id ? response.data : category,
          ),
        );
      } else {
        const response = await createCategory({ nome: trimmedName });
        setCategories((current) => [response.data, ...current]);
      }
      closeSheet();
    } catch {
      setSaveError(SAVE_ERROR_MESSAGE);
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (category: Category) => {
    const confirmed = window.confirm("Deseja desativar esta categoria?");
    if (!confirmed) return;

    setLoadError(false);
    setSaveError(null);
    const previousCategories = categories;
    setCategories((current) =>
      current.map((item) =>
        item.id === category.id ? { ...item, ativo: false } : item,
      ),
    );

    try {
      const response = await deactivateCategory(category.id);
      setCategories((current) =>
        current.map((item) => (item.id === category.id ? response.data : item)),
      );
    } catch {
      setCategories(previousCategories);
      setSaveError(DEACTIVATE_ERROR_MESSAGE);
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
                    <Button type="button" size="sm" variant="ghost" onClick={() => handleDeactivate(category)}>
                      Desativar
                    </Button>
                  </div>
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
                <p className="text-sm font-medium text-muted-foreground">{category.nome}</p>
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
