import { Link } from "react-router-dom";
import Card from "../../components/Card";
import Container from "../../components/Container";
import { ChevronLeftIcon } from "../../components/Icons";
import DocumentLibrary from "./DocumentLibrary";

export default function DocumentsPage() {
  return (
    <Container size="xl">
      <div className="space-y-6 px-4 py-4 md:px-0 md:py-6 lg:space-y-8">
        <Card className="space-y-3">
          <Link
            to="/configuracoes"
            className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-primary md:hidden"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            <span>Configurações</span>
          </Link>
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-primary">Configurações</p>
            <h2 className="mt-2 text-2xl">Inteligência de documentos</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Envie documentos financeiros e acompanhe o processamento dos arquivos.
            </p>
          </div>
        </Card>

        <DocumentLibrary />
      </div>
    </Container>
  );
}
