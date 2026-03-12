import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { list as listCategories } from "../apis/categories";
import {
  create as saveBudget,
  list as listBudgets,
  remove as removeBudget,
  update as updateBudget,
} from "../apis/monthlyBudgets";
import {
  create as createSnapshot,
  list as listSnapshots,
} from "../apis/monthlySnapshots";
import { getProjection, getStatus } from "../apis/planning";
import {
  create as saveRecurring,
  list as listRecurring,
  remove as removeRecurring,
  update as updateRecurring,
} from "../apis/recurring";
import type {
  BudgetMensal,
  Category,
  MonthStatus,
  PlanningProjection,
  SnapshotMensal,
  TransacaoRecorrente,
} from "../types";
import Button from "../components/Button";
import Card from "../components/Card";
import FormField from "../components/FormField";
import Input from "../components/Input";
import MonthNavigator from "../components/MonthNavigator";
import PlanningLayout from "../components/PlanningLayout";
import Select from "../components/Select";
import TransactionSheet from "../components/TransactionSheet";
import { normalizeDisplayText } from "../utils/text";
import { formatCurrency, formatMonthLabel, getMonthStatusLabel } from "../utils/formatters";

function monthNow() {
  return new Date().toISOString().slice(0, 7);
}

function toNumber(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

const STEPS = [
  "Mês",
  "Recorrentes",
  "Orçamentos",
  "Projeção",
  "Confirmar",
] as const;

function emptyRecurringForm(): TransacaoRecorrente {
  return {
    tipo: "expense",
    descricao: "",
    valor: 0,
    frequencia: "mensal",
  };
}

export default function PlanningPage() {
  const navigate = useNavigate();
  const [mes, setMes] = useState(monthNow());
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState<MonthStatus>("NOT_STARTED");
  const [projection, setProjection] = useState<PlanningProjection | null>(null);
  const [budgets, setBudgets] = useState<BudgetMensal[]>([]);
  const [recurring, setRecurring] = useState<TransacaoRecorrente[]>([]);
  const [snapshots, setSnapshots] = useState<SnapshotMensal[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmSheetOpen, setConfirmSheetOpen] = useState(false);
  const [editingBudgetId, setEditingBudgetId] = useState<number | null>(null);
  const [editingBudgetValue, setEditingBudgetValue] = useState("");
  const [editingRecurringId, setEditingRecurringId] = useState<number | null>(
    null,
  );

  const [budgetForm, setBudgetForm] = useState<BudgetMensal>({
    mes,
    categoria_id: 0,
    valor_planejado: 0,
  });

  const [recurringForm, setRecurringForm] = useState<TransacaoRecorrente>(
    emptyRecurringForm(),
  );

  const activeRecurring = useMemo(
    () => recurring.filter((item) => item.ativo !== false),
    [recurring],
  );

  const canGoNext = step < STEPS.length - 1;
  const canGoPrev = step > 0;

  const projectionTone = useMemo(() => {
    if (!projection) return "text-foreground";
    return toNumber(projection.projected_balance) >= 0
      ? "text-income"
      : "text-expense";
  }, [projection]);

  const reload = async () => {
    try {
      setError(null);
      const [
        statusRes,
        projectionRes,
        budgetsRes,
        recurringRes,
        snapshotsRes,
        categoriesRes,
      ] = await Promise.all([
        getStatus(mes),
        getProjection(mes),
        listBudgets(mes),
        listRecurring(),
        listSnapshots(mes),
        listCategories(),
      ]);
      setStatus(statusRes.data.status);
      setProjection(projectionRes.data);
      setBudgets(Array.isArray(budgetsRes.data) ? budgetsRes.data : []);
      setRecurring(Array.isArray(recurringRes.data) ? recurringRes.data : []);
      setSnapshots(Array.isArray(snapshotsRes.data) ? snapshotsRes.data : []);
      setCategories(
        Array.isArray(categoriesRes.data)
          ? categoriesRes.data.map((category) => ({
              ...category,
              nome: normalizeDisplayText(category.nome),
            }))
          : [],
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Falha ao carregar planejamento",
      );
    }
  };

  useEffect(() => {
    setBudgetForm((prev) => ({ ...prev, mes }));
    void reload();
  }, [mes]);

  const onCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await saveBudget(budgetForm);
      setBudgetForm((prev) => ({ ...prev, valor_planejado: 0 }));
      await reload();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Falha ao salvar orçamento",
      );
    } finally {
      setBusy(false);
    }
  };

  const onCreateRecurring = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await saveRecurring(recurringForm);
      setRecurringForm(emptyRecurringForm());
      await reload();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Falha ao salvar recorrente",
      );
    } finally {
      setBusy(false);
    }
  };

  const startRecurringEdit = (item: TransacaoRecorrente) => {
    if (!item.id) return;
    setEditingRecurringId(item.id);
    setRecurringForm({
      id: item.id,
      tipo: item.tipo,
      descricao: item.descricao,
      valor: Number(item.valor),
      frequencia: item.frequencia || "mensal",
      categoria_id: item.categoria_id || null,
      ativo: item.ativo,
    });
  };

  const cancelRecurringEdit = () => {
    setEditingRecurringId(null);
    setRecurringForm(emptyRecurringForm());
  };

  const onUpdateRecurring = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecurringId) return;
    setBusy(true);
    try {
      await updateRecurring(editingRecurringId, recurringForm);
      cancelRecurringEdit();
      await reload();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Falha ao atualizar recorrente",
      );
    } finally {
      setBusy(false);
    }
  };

  const onDeleteRecurring = async (item: TransacaoRecorrente) => {
    if (!item.id || !window.confirm("Excluir recorrente?")) return;
    setBusy(true);
    try {
      await removeRecurring(item.id);
      if (editingRecurringId === item.id) {
        cancelRecurringEdit();
      }
      await reload();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Falha ao excluir recorrente",
      );
    } finally {
      setBusy(false);
    }
  };

  const createSnapshotWithGuard = async (confirmNegative = false) => {
    setBusy(true);
    try {
      await createSnapshot({ mes, confirm_negative: confirmNegative });
      setConfirmSheetOpen(false);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao criar snapshot");
    } finally {
      setBusy(false);
    }
  };

  const onCreateSnapshot = async () => {
    const projectedBalance = projection
      ? toNumber(projection.projected_balance)
      : null;
    if (projectedBalance !== null && projectedBalance <= 0) {
      setConfirmSheetOpen(true);
      return;
    }
    await createSnapshotWithGuard(false);
  };

  const startBudgetEdit = (budget: BudgetMensal) => {
    if (!budget.id) return;
    setEditingBudgetId(budget.id);
    setEditingBudgetValue(String(Number(budget.valor_planejado)));
  };

  const cancelBudgetEdit = () => {
    setEditingBudgetId(null);
    setEditingBudgetValue("");
  };

  const onUpdateBudget = async () => {
    if (!editingBudgetId) return;
    setBusy(true);
    try {
      await updateBudget(editingBudgetId, {
        valor_planejado: Number(editingBudgetValue),
      });
      cancelBudgetEdit();
      await reload();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Falha ao atualizar orçamento",
      );
    } finally {
      setBusy(false);
    }
  };

  const onDeleteBudget = async (budget: BudgetMensal) => {
    if (!budget.id || !window.confirm("Excluir orçamento?")) return;
    setBusy(true);
    try {
      await removeBudget(budget.id);
      if (editingBudgetId === budget.id) {
        cancelBudgetEdit();
      }
      await reload();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Falha ao excluir orçamento",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <PlanningLayout>
      <section className="space-y-3 lg:space-y-6">
        <Card className="space-y-3">
          <h2 className="text-xl">Planejamento mensal</h2>
          <p className="text-sm text-muted-foreground">
            Siga o fluxo em etapas para estruturar seu mês antes de executar
            despesas e receitas.
          </p>
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1 md:grid md:grid-cols-5 md:overflow-visible md:pb-0">
            {STEPS.map((label, idx) => {
              const active = idx === step;
              const done = idx < step;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setStep(idx)}
                  className={`min-w-[8.5rem] rounded-md px-3 py-2 text-left text-xs md:min-w-0 md:text-center ${
                    active
                      ? "bg-primary text-background"
                      : done
                        ? "bg-income-soft text-income"
                        : "bg-surface text-muted-foreground"
                  }`}
                >
                  {idx + 1}. {label}
                </button>
              );
            })}
          </div>
        </Card>

        {error && (
          <p className="rounded-md bg-expense-soft px-3 py-2 text-sm text-expense">
            {error}
          </p>
        )}

        {step === 0 && (
          <Card className="space-y-3">
            <h3 className="text-lg">1. Selecione o mês</h3>
            <p className="text-sm text-muted-foreground">
              Defina o mês de referência para carregar status, projeção,
              orçamentos e snapshots.
            </p>
            <div className="flex flex-col gap-2">
              <MonthNavigator month={mes} onChange={setMes} />
              <div className="rounded-full bg-surface px-3 py-2 text-sm">
                Status atual: <strong>{getMonthStatusLabel(status)}</strong>
              </div>
            </div>
          </Card>
        )}

        {step === 1 && (
          <Card className="space-y-3">
            <h3 className="text-lg">2. Gerencie transacoes recorrentes</h3>
            <p className="text-sm text-muted-foreground">
              Entradas recorrentes funcionam como template mensal reutilizável e
              editável a qualquer momento.
            </p>
            <form
              className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4"
              onSubmit={editingRecurringId ? onUpdateRecurring : onCreateRecurring}
            >
              <Select
                value={recurringForm.tipo}
                onChange={(e) =>
                  setRecurringForm((prev) => ({
                    ...prev,
                    tipo: e.target.value as TransacaoRecorrente["tipo"],
                  }))
                }
                disabled={busy}
              >
                <option value="expense">Despesa</option>
                <option value="income">Receita</option>
              </Select>
              <Input
                type="text"
                value={recurringForm.descricao}
                onChange={(e) =>
                  setRecurringForm((prev) => ({
                    ...prev,
                    descricao: e.target.value,
                  }))
                }
                placeholder="Descrição"
                required
                disabled={busy}
              />
              <Input
                type="number"
                step="0.01"
                value={recurringForm.valor}
                onChange={(e) =>
                  setRecurringForm((prev) => ({
                    ...prev,
                    valor: Number(e.target.value),
                  }))
                }
                placeholder="Valor"
                required
                disabled={busy}
              />
              <Button type="submit" disabled={busy}>
                {editingRecurringId ? "Salvar alterações" : "Salvar recorrente"}
              </Button>
            </form>
            {editingRecurringId && (
              <div className="flex flex-wrap">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={cancelRecurringEdit}
                  disabled={busy}
                >
                  Cancelar edição
                </Button>
              </div>
            )}

            <div className="space-y-2 text-sm">
              <h4 className="font-semibold">Recorrentes ativos</h4>
              <ul className="space-y-2 text-foreground">
                {activeRecurring.map((item) => (
                  <li
                    className="rounded-md bg-surface px-3 py-2"
                    key={item.id}
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <p className="min-w-0">
                        {item.tipo} - {item.descricao}: {formatCurrency(item.valor)}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={busy || !item.id}
                          onClick={() => startRecurringEdit(item)}
                        >
                          Editar
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="text-expense hover:bg-expense-soft"
                          disabled={busy || !item.id}
                          onClick={() => void onDeleteRecurring(item)}
                        >
                          Excluir
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
                {activeRecurring.length === 0 && (
                  <li className="rounded-md bg-surface px-3 py-2 text-muted-foreground">
                    Nenhuma transacao recorrente registrada.
                  </li>
                )}
              </ul>
            </div>
          </Card>
        )}

        {step === 2 && (
          <Card className="space-y-3">
            <h3 className="text-lg">3. Defina orçamentos por categoria</h3>
            <p className="text-sm text-muted-foreground">
              Use esta etapa para estimar gastos que não fazem parte das contas
              recorrentes (ex.: supermercado, restaurantes, compras).
            </p>
            <form
              className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3"
              onSubmit={onCreateBudget}
            >
              <Select
                value={budgetForm.categoria_id}
                onChange={(e) =>
                  setBudgetForm((prev) => ({
                    ...prev,
                    categoria_id: Number(e.target.value),
                  }))
                }
                required
              >
                <option value={0}>Categoria</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id || 0}>
                    {category.nome}
                  </option>
                ))}
              </Select>
              <Input
                type="number"
                step="0.01"
                value={budgetForm.valor_planejado}
                onChange={(e) =>
                  setBudgetForm((prev) => ({
                    ...prev,
                    valor_planejado: Number(e.target.value),
                  }))
                }
                placeholder="Valor planejado"
                required
              />
              <Button type="submit" disabled={busy}>
                Salvar orçamento
              </Button>
            </form>

            <ul className="space-y-2 text-sm text-foreground">
              {budgets.map((budget) => (
                <li
                  className="space-y-2 rounded-md bg-surface px-3 py-3"
                  key={budget.id || `${budget.mes}-${budget.categoria_id}`}
                >
                  <p className="text-muted-foreground">
                    Categoria:{" "}
                    {categories.find((c) => c.id === budget.categoria_id)?.nome ||
                      `#${budget.categoria_id}`}
                  </p>
                  {editingBudgetId === budget.id ? (
                    <div className="space-y-2">
                      <FormField label="Valor planejado">
                        <Input
                          type="number"
                          step="0.01"
                          value={editingBudgetValue}
                          onChange={(e) => setEditingBudgetValue(e.target.value)}
                          disabled={busy}
                        />
                      </FormField>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          disabled={busy}
                          onClick={() => void onUpdateBudget()}
                        >
                          Salvar
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={busy}
                          onClick={cancelBudgetEdit}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-foreground">
                        {formatCurrency(budget.valor_planejado)}
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={busy || !budget.id}
                          onClick={() => startBudgetEdit(budget)}
                        >
                          Editar
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="text-expense hover:bg-expense-soft"
                          disabled={busy || !budget.id}
                          onClick={() => void onDeleteBudget(budget)}
                        >
                          Excluir
                        </Button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
              {budgets.length === 0 && (
                <li className="rounded-md bg-surface px-3 py-2 text-muted-foreground">
                  Nenhum orçamento cadastrado para este mês.
                </li>
              )}
            </ul>
          </Card>
        )}

        {step === 3 && (
          <Card className="space-y-3">
            <h3 className="text-lg">4. Revise a projeção</h3>
            <p className="text-sm text-muted-foreground">
              Projeção = receitas - despesas recorrentes - orçamentos variáveis.
              Despesas já lançadas aparecem apenas como acompanhamento.
            </p>
            {projection ? (
              <div className="space-y-2">
                <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-md bg-surface px-3 py-2">
                    <p className="text-muted-foreground">Receita prevista</p>
                    <p className="font-semibold text-income">
                      {formatCurrency(projection.income)}
                    </p>
                  </div>
                  <div className="rounded-md bg-surface px-3 py-2">
                    <p className="text-muted-foreground">
                      Despesas já lançadas (informativo)
                    </p>
                    <p className="font-semibold text-expense">
                      {formatCurrency(projection.expenses_logged)}
                    </p>
                  </div>
                  <div className="rounded-md bg-surface px-3 py-2">
                    <p className="text-muted-foreground">Despesas fixas</p>
                    <p className="font-semibold text-expense">
                      {formatCurrency(projection.fixed_expenses)}
                    </p>
                  </div>
                  <div className="rounded-md bg-surface px-3 py-2">
                    <p className="text-muted-foreground">Orcamentos variaveis</p>
                    <p className="font-semibold text-warning">
                      {formatCurrency(projection.planned_variable)}
                    </p>
                  </div>
                  <div className="rounded-md bg-surface px-3 py-2 md:col-span-2 xl:col-span-4">
                    <p className="text-muted-foreground">Saldo projetado</p>
                    <p className={`font-semibold ${projectionTone}`}>
                      {formatCurrency(projection.projected_balance)}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Sem projeção disponível.</p>
            )}
          </Card>
        )}

        {step === 4 && (
          <Card className="space-y-3">
            <h3 className="text-lg">5. Confirme o planejamento</h3>
            <p className="text-sm text-muted-foreground">
              Ao confirmar, um snapshot será criado para este mês e você será
              direcionado ao dashboard para acompanhar a execução.
            </p>
            <div className="rounded-full bg-surface px-3 py-2 text-sm">
              Status atual: <strong>{getMonthStatusLabel(status)}</strong>
            </div>
            <Button
              onClick={onCreateSnapshot}
              disabled={busy || status === "COMPLETED"}
            >
              Confirmar planejamento e criar snapshot
            </Button>
            <TransactionSheet
              open={confirmSheetOpen}
              onOpenChange={setConfirmSheetOpen}
              title="Confirmar saldo não positivo"
              description="Seu saldo projetado está negativo ou zerado. Confirme apenas se quiser concluir o planejamento."
            >
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Este mês será fechado com saldo projetado não positivo.
                  Confirme apenas se deseja realmente concluir o planejamento.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={busy}
                    onClick={() => void createSnapshotWithGuard(true)}
                  >
                    {busy ? "Confirmando..." : "Confirmar mesmo assim"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={busy}
                    onClick={() => setConfirmSheetOpen(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </TransactionSheet>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Snapshots do mês</h4>
              <ul className="space-y-2 text-sm text-foreground">
                {snapshots.map((snapshot) => (
                  <li
                    className="rounded-md bg-surface px-3 py-2"
                    key={snapshot.id}
                  >
                    {formatMonthLabel(snapshot.mes)}: saldo projetado {formatCurrency(snapshot.saldo_projetado)}
                  </li>
                ))}
                {snapshots.length === 0 && (
                  <li className="rounded-md bg-surface px-3 py-2 text-muted-foreground">
                    Nenhum snapshot criado para este mês.
                  </li>
                )}
              </ul>
            </div>
          </Card>
        )}

        <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            disabled={!canGoPrev}
            onClick={() => setStep((prev) => prev - 1)}
          >
            Voltar
          </Button>
          <p className="text-xs text-muted-foreground">
            Etapa {step + 1} de {STEPS.length}
          </p>
          <Button
            type="button"
            className="w-full sm:w-auto"
            disabled={!canGoNext}
            onClick={() => setStep((prev) => prev + 1)}
          >
            Próximo
          </Button>
        </Card>
      </section>
    </PlanningLayout>
  );
}
