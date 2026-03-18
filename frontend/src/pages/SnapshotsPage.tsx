import axios from "axios";
import { useEffect, useRef, useState } from "react";
import Card from "../components/Card";
import Container from "../components/Container";
import EmptyState from "../components/EmptyState";
import LoadingState from "../components/LoadingState";
import Button from "../components/Button";
import TransactionSheet from "../components/TransactionSheet";
import { RetryIcon } from "../components/Icons";
import { getDetails, list } from "../apis/monthlySnapshots";
import type { SnapshotDetails, SnapshotMensal } from "../types";
import { getApiErrorMessage } from "../utils/apiError";
import { formatCurrency, formatMonthLabel } from "../utils/formatters";

export default function SnapshotsPage() {
  const [snapshots, setSnapshots] = useState<SnapshotMensal[]>([]);
  const [selected, setSelected] = useState<SnapshotDetails | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const detailsControllerRef = useRef<AbortController | null>(null);

  const loadSnapshots = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      setLoadingTimedOut(false);
      const response = await list(undefined, { signal });
      setSnapshots(Array.isArray(response.data) ? response.data : []);
      setError(null);
    } catch (err) {
      if (axios.isCancel(err)) return;
      setError(getApiErrorMessage(err, "Não foi possível carregar os snapshots."));
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    void loadSnapshots(controller.signal);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!loading || snapshots.length > 0) return undefined;
    const timeoutId = window.setTimeout(() => {
      setLoadingTimedOut(true);
      setLoading(false);
      setError("O carregamento demorou demais. Tente novamente.");
    }, 5000);
    return () => window.clearTimeout(timeoutId);
  }, [loading, snapshots.length]);

  const onViewDetails = async (id?: number) => {
    if (!id) return;
    detailsControllerRef.current?.abort();
    const controller = new AbortController();
    detailsControllerRef.current = controller;
    setSelectedId(id);
    setDetailsLoading(true);
    try {
      const response = await getDetails(id, { signal: controller.signal });
      setSelected(response.data);
      setError(null);
    } catch (err) {
      if (axios.isCancel(err)) return;
      setError(getApiErrorMessage(err, "Não foi possível carregar os detalhes do snapshot."));
      setSelected(null);
    } finally {
      if (detailsControllerRef.current === controller) {
        detailsControllerRef.current = null;
      }
      if (!controller.signal.aborted) {
        setDetailsLoading(false);
      }
    }
  };

  return (
    <Container size="lg">
      <section className="space-y-5 lg:space-y-6">
        <Card>
          <h2 className="text-xl">Snapshots</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Histórico mensal do planejamento fechado.
          </p>
        </Card>

        {error && (
          <p className="rounded-md bg-expense-soft px-3 py-2 text-sm text-expense">
            {error}
          </p>
        )}

        <Card className="space-y-3">
          <h3 className="text-lg">Histórico</h3>
          {loading ? (
            <LoadingState label="Carregando snapshots..." />
          ) : loadingTimedOut ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Não foi possível carregar o histórico.</p>
              <Button leftIcon={<RetryIcon className="h-4 w-4" />} size="sm" variant="outline" onClick={() => void loadSnapshots()}>
                Tentar novamente
              </Button>
            </div>
          ) : snapshots.length === 0 ? (
            <EmptyState
              title="Nenhum snapshot encontrado"
              description="Finalize o planejamento do mês para gerar o primeiro snapshot."
            />
          ) : (
            <ul className="space-y-2">
              {snapshots.map((snapshot) => (
                <li
                  key={snapshot.id}
                  className="flex flex-col gap-3 rounded-md bg-surface px-3 py-3 md:flex-row md:items-center md:justify-between"
                >
                  <div className="text-sm">
                    <p className="font-medium">{formatMonthLabel(snapshot.mes)}</p>
                    <p className="text-muted-foreground">Concluído</p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void onViewDetails(snapshot.id)}
                  >
                    Ver detalhes
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
            detailsControllerRef.current?.abort();
            detailsControllerRef.current = null;
            setSelectedId(null);
            setSelected(null);
            setDetailsLoading(false);
          }
        }}
        title={
          selected?.snapshot?.mes
            ? `Snapshot: ${formatMonthLabel(selected.snapshot.mes)}`
            : "Detalhes do snapshot"
        }
        description="Comparativo entre planejamento fechado e execução real do mês."
      >
        {detailsLoading || !selected ? (
          <LoadingState label="Carregando detalhes..." />
        ) : (
          <div className="space-y-3 text-sm">
            <div className="rounded-md bg-surface px-3 py-2">
              <p className="text-muted-foreground">Receita planejada</p>
              <p className="font-semibold text-income">
                {formatCurrency(selected.planned_income)}
              </p>
            </div>
            <div className="rounded-md bg-surface px-3 py-2">
              <p className="text-muted-foreground">Despesas planejadas</p>
              <p className="font-semibold text-expense">
                {formatCurrency(selected.planned_expenses)}
              </p>
            </div>
            <div className="rounded-md bg-surface px-3 py-2">
              <p className="text-muted-foreground">Saldo projetado</p>
              <p className="font-semibold">
                {formatCurrency(selected.projected_balance)}
              </p>
            </div>
            <div className="rounded-md bg-surface px-3 py-2">
              <p className="text-muted-foreground">Receita realizada</p>
              <p className="font-semibold text-income">
                {formatCurrency(selected.actual_income)}
              </p>
            </div>
            <div className="rounded-md bg-surface px-3 py-2">
              <p className="text-muted-foreground">Despesas realizadas</p>
              <p className="font-semibold text-expense">
                {formatCurrency(selected.actual_expenses)}
              </p>
            </div>
            <div className="rounded-md bg-surface px-3 py-2">
              <p className="text-muted-foreground">
                Diferença (planejado vs realizado)
              </p>
              <p
                className={`font-semibold ${
                  selected.planned_vs_actual_diff >= 0
                    ? "text-income"
                    : "text-expense"
                }`}
              >
                {formatCurrency(selected.planned_vs_actual_diff)}
              </p>
            </div>
          </div>
        )}
      </TransactionSheet>
    </Container>
  );
}
