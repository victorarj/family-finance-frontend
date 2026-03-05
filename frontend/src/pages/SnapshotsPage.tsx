import { useEffect, useState } from "react";
import Card from "../components/Card";
import Container from "../components/Container";
import Button from "../components/Button";
import TransactionSheet from "../components/TransactionSheet";
import { getDetails, list } from "../apis/monthlySnapshots";
import type { SnapshotDetails, SnapshotMensal } from "../types";

function formatMoney(value: unknown) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount.toFixed(2) : "0.00";
}

export default function SnapshotsPage() {
  const [snapshots, setSnapshots] = useState<SnapshotMensal[]>([]);
  const [selected, setSelected] = useState<SnapshotDetails | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSnapshots = async () => {
      try {
        setLoading(true);
        const response = await list();
        setSnapshots(Array.isArray(response.data) ? response.data : []);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Falha ao carregar snapshots",
        );
      } finally {
        setLoading(false);
      }
    };
    void loadSnapshots();
  }, []);

  const onViewDetails = async (id?: number) => {
    if (!id) return;
    setSelectedId(id);
    setDetailsLoading(true);
    try {
      const response = await getDetails(id);
      setSelected(response.data);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Falha ao carregar detalhes",
      );
      setSelected(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <Container>
      <section className="space-y-4">
        <Card>
          <h2 className="text-xl">Snapshots</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Historico mensal do planejamento fechado.
          </p>
        </Card>

        {error && (
          <p className="rounded-md bg-expense-soft px-3 py-2 text-sm text-expense">
            {error}
          </p>
        )}

        <Card className="space-y-3">
          <h3 className="text-lg">Historico</h3>
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : snapshots.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum snapshot encontrado.
            </p>
          ) : (
            <ul className="space-y-2">
              {snapshots.map((snapshot) => (
                <li
                  key={snapshot.id}
                  className="flex items-center justify-between rounded-md bg-surface px-3 py-2"
                >
                  <div className="text-sm">
                    <p className="font-medium">{snapshot.mes}</p>
                    <p className="text-muted-foreground">Completed</p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void onViewDetails(snapshot.id)}
                  >
                    View
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      <TransactionSheet
        open={selectedId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedId(null);
            setSelected(null);
          }
        }}
        title={
          selected?.snapshot?.mes
            ? `Snapshot: ${selected.snapshot.mes}`
            : "Detalhes do snapshot"
        }
        description="Comparativo entre planejamento fechado e execucao real do mes."
      >
        {detailsLoading || !selected ? (
          <p className="text-sm text-muted-foreground">Carregando detalhes...</p>
        ) : (
          <div className="space-y-3 text-sm">
            <div className="rounded-md bg-surface px-3 py-2">
              <p className="text-muted-foreground">Income planned</p>
              <p className="font-semibold text-income">
                R$ {formatMoney(selected.planned_income)}
              </p>
            </div>
            <div className="rounded-md bg-surface px-3 py-2">
              <p className="text-muted-foreground">Expenses planned</p>
              <p className="font-semibold text-expense">
                R$ {formatMoney(selected.planned_expenses)}
              </p>
            </div>
            <div className="rounded-md bg-surface px-3 py-2">
              <p className="text-muted-foreground">Projected balance</p>
              <p className="font-semibold">
                R$ {formatMoney(selected.projected_balance)}
              </p>
            </div>
            <div className="rounded-md bg-surface px-3 py-2">
              <p className="text-muted-foreground">Actual income</p>
              <p className="font-semibold text-income">
                R$ {formatMoney(selected.actual_income)}
              </p>
            </div>
            <div className="rounded-md bg-surface px-3 py-2">
              <p className="text-muted-foreground">Actual expenses</p>
              <p className="font-semibold text-expense">
                R$ {formatMoney(selected.actual_expenses)}
              </p>
            </div>
            <div className="rounded-md bg-surface px-3 py-2">
              <p className="text-muted-foreground">
                Difference (planned vs actual)
              </p>
              <p
                className={`font-semibold ${
                  selected.planned_vs_actual_diff >= 0
                    ? "text-income"
                    : "text-expense"
                }`}
              >
                R$ {formatMoney(selected.planned_vs_actual_diff)}
              </p>
            </div>
          </div>
        )}
      </TransactionSheet>
    </Container>
  );
}
