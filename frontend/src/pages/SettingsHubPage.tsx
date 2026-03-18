import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import Card from "../components/Card";
import Container from "../components/Container";
import {
  BankCardIcon,
  ChevronRightIcon,
  CoinsIcon,
  DocumentIcon,
  TagIcon,
} from "../components/Icons";

type SettingsCardProps = {
  to: string;
  title: string;
  subtitle: string;
  icon: ReactNode;
};

function SettingsCard({ to, title, subtitle, icon }: SettingsCardProps) {
  return (
    <Link
      to={to}
      replace
      state={{ fromSettingsHub: true }}
      className="group block rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
          {icon}
        </div>
        <ChevronRightIcon className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-foreground" />
      </div>
      <h3 className="mt-4 text-lg text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
    </Link>
  );
}

export default function SettingsHubPage() {
  return (
    <Container size="lg">
      <div className="space-y-4 px-4 py-4 md:px-0 md:py-6">
        <Card className="space-y-3">
          <p className="text-sm uppercase tracking-[0.2em] text-primary">Configurações</p>
          <h2 className="text-2xl">Configurações</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie suas preferências e integrações
          </p>
        </Card>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-2">
          <SettingsCard
            to="/configuracoes/documentos"
            icon={<DocumentIcon className="h-5 w-5" />}
            title="Document Intelligence"
            subtitle="Faça upload de extratos, holerites e contas para consultar com IA"
          />
          <SettingsCard
            to="/configuracoes/contas-bancarias"
            icon={<BankCardIcon className="h-5 w-5" />}
            title="Contas Bancárias"
            subtitle="Gerencie suas contas bancárias e carteiras"
          />
          <SettingsCard
            to="/configuracoes/categorias"
            icon={<TagIcon className="h-5 w-5" />}
            title="Categorias"
            subtitle="Gerencie as categorias usadas em despesas e receitas"
          />
          <SettingsCard
            to="/configuracoes/moedas"
            icon={<CoinsIcon className="h-5 w-5" />}
            title="Moedas"
            subtitle="Gerencie as moedas disponíveis para contas e transações"
          />
        </div>
      </div>
    </Container>
  );
}
