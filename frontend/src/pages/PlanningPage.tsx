import { useEffect, useMemo, useState } from "react";
import { list as listCategories } from "../apis/categories";
import {
  create as saveBudget,
  list as listBudgets,
} from "../apis/monthlyBudgets";
import {
  create as createSnapshot,
  list as listSnapshots,
} from "../apis/monthlySnapshots";
import { getProjection, getStatus } from "../apis/planning";
import {
  create as saveRecurring,
  list as listRecurring,
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
import PlanningLayout from "../components/PlanningLayout";

const inputClass =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary";

function monthNow() {
  return new Date().toISOString().slice(0, 7);
}

function toNumber(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatMoney(value: unknown) {
  return toNumber(value).toFixed(2);
}

const STEPS = [
  "Mês",
  "Recorrentes",
  "Orçamentos",
  "Projeção",
  "Confirmar",
] as const;

export default function PlanningPage() {
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

  const [budgetForm, setBudgetForm] = useState<BudgetMensal>({
    mes,
    categoria_id: 0,
    valor_planejado: 0,
  });

  const [recurringForm, setRecurringForm] = useState<TransacaoRecorrente>({
    tipo: "expense",
    descricao: "",
    valor: 0,
    frequencia: "mensal",
  });

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
        Array.isArray(categoriesRes.data) ? categoriesRes.data : [],
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
      setRecurringForm({
        tipo: "expense",
        descricao: "",
        valor: 0,
        frequencia: "mensal",
      });
      await reload();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Falha ao salvar recorrente",
      );
    } finally {
      setBusy(false);
    }
  };

  const onCreateSnapshot = async () => {
    setBusy(true);
    try {
      await createSnapshot({ mes });
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao criar snapshot");
    } finally {
      setBusy(false);
    }
  };

  return (
    <PlanningLayout>
      <section className="space-y-4">
        <Card className="space-y-3">
          <h2 className="text-xl">Planejamento mensal</h2>
          <p className="text-sm text-muted-foreground">
            Siga o fluxo em etapas para estruturar seu mês antes de executar
            despesas e receitas.
          </p>
          <div className="grid grid-cols-5 gap-2">
            {STEPS.map((label, idx) => {
              const active = idx === step;
              const done = idx < step;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setStep(idx)}
                  className={`rounded-md px-2 py-2 text-xs ${
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
            <label className="block max-w-52 space-y-1 text-sm">
              <span className="text-muted-foreground">Mês de referência</span>
              <input
                className={inputClass}
                type="month"
                value={mes}
                onChange={(e) => setMes(e.target.value)}
              />
            </label>
            <div className="rounded-md bg-surface px-3 py-2 text-sm">
              Status atual: <strong>{status}</strong>
            </div>
          </Card>
        )}

        {step === 1 && (
          <Card className="space-y-3">
            <h3 className="text-lg">2. Configure transações recorrentes</h3>
            <p className="text-sm text-muted-foreground">
              Registre valores que se repetem todos os meses (ex.: salário,
              aluguel, assinaturas).
            </p>
            <form
              className="grid grid-cols-1 gap-2 sm:grid-cols-4"
              onSubmit={onCreateRecurring}
            >
              <select
                className={inputClass}
                value={recurringForm.tipo}
                onChange={(e) =>
                  setRecurringForm((prev) => ({
                    ...prev,
                    tipo: e.target.value as TransacaoRecorrente["tipo"],
                  }))
                }
              >
                <option value="expense">Despesa</option>
                <option value="income">Receita</option>
              </select>
              <input
                className={inputClass}
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
              />
              <input
                className={inputClass}
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
              />
              <Button type="submit" disabled={busy}>
                Salvar recorrente
              </Button>
            </form>

            <ul className="space-y-2 text-sm text-foreground">
              {recurring.map((item) => (
                <li className="rounded-md bg-surface px-3 py-2" key={item.id}>
                  {item.tipo} - {item.descricao}: R${" "}
                  {Number(item.valor).toFixed(2)}
                  {item.ativo === false ? " (inativo)" : ""}
                </li>
              ))}
              {recurring.length === 0 && (
                <li className="rounded-md bg-surface px-3 py-2 text-muted-foreground">
                  Nenhuma transação recorrente registrada.
                </li>
              )}
            </ul>
          </Card>
        )}

        {step === 2 && (
          <Card className="space-y-3">
            <h3 className="text-lg">3. Defina orçamentos por categoria</h3>
            <p className="text-sm text-muted-foreground">
              Este valor representa o limite planejado para cada categoria no
              mês selecionado.
            </p>
            <form
              className="grid grid-cols-1 gap-2 sm:grid-cols-3"
              onSubmit={onCreateBudget}
            >
              <select
                className={inputClass}
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
              </select>
              <input
                className={inputClass}
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
                  className="rounded-md bg-surface px-3 py-2"
                  key={budget.id || `${budget.mes}-${budget.categoria_id}`}
                >
                  Categoria {budget.categoria_id}: R${" "}
                  {Number(budget.valor_planejado).toFixed(2)}
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
              Revise o impacto estimado das receitas e despesas planejadas antes
              de confirmar.
            </p>
            {projection ? (
              <div className="space-y-2">
                <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                  <div className="rounded-md bg-surface px-3 py-2">
                    <p className="text-muted-foreground">Receita prevista</p>
                    <p className="font-semibold text-income">
                      R$ {formatMoney(projection.income)}
                    </p>
                  </div>
                  <div className="rounded-md bg-surface px-3 py-2">
                    <p className="text-muted-foreground">Despesas lançadas</p>
                    <p className="font-semibold text-expense">
                      R$ {formatMoney(projection.expenses_logged)}
                    </p>
                  </div>
                  <div className="rounded-md bg-surface px-3 py-2">
                    <p className="text-muted-foreground">Despesas fixas</p>
                    <p className="font-semibold text-expense">
                      R$ {formatMoney(projection.fixed_expenses)}
                    </p>
                  </div>
                  <div className="rounded-md bg-surface px-3 py-2">
                    <p className="text-muted-foreground">
                      Orçamentos variáveis
                    </p>
                    <p className="font-semibold text-warning">
                      R$ {formatMoney(projection.planned_variable)}
                    </p>
                  </div>
                  <div className="rounded-md bg-surface px-3 py-2 sm:col-span-2">
                    <p className="text-muted-foreground">Saldo projetado</p>
                    <p className={`font-semibold ${projectionTone}`}>
                      R$ {formatMoney(projection.projected_balance)}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Sem projeção disponível.
              </p>
            )}
          </Card>
        )}

        {step === 4 && (
          <Card className="space-y-3">
            <h3 className="text-lg">5. Confirme o planejamento</h3>
            <p className="text-sm text-muted-foreground">
              Ao confirmar, um snapshot será criado para este mês e o ciclo
              ficará como concluído.
            </p>
            <div className="rounded-md bg-surface px-3 py-2 text-sm">
              Status atual: <strong>{status}</strong>
            </div>
            <Button
              onClick={onCreateSnapshot}
              disabled={busy || status === "COMPLETED"}
            >
              Confirmar planejamento e criar snapshot
            </Button>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Snapshots do mês</h4>
              <ul className="space-y-2 text-sm text-foreground">
                {snapshots.map((snapshot) => (
                  <li
                    className="rounded-md bg-surface px-3 py-2"
                    key={snapshot.id}
                  >
                    {snapshot.mes}: saldo projetado R${" "}
                    {Number(snapshot.saldo_projetado).toFixed(2)}
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

        <Card className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
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
