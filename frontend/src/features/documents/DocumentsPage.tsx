import { Link } from "react-router-dom";
import Container from "../../components/Container";
import { ChevronLeftIcon } from "../../components/Icons";
import DocumentLibrary from "./DocumentLibrary";

export default function DocumentsPage() {
  return (
    <Container size="xl">
      <div className="space-y-6 px-4 py-4 md:px-0 md:py-6 lg:space-y-8">
        <div className="space-y-2">
          <Link
            to="/configuracoes"
            className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-primary md:hidden"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            <span>Configurações</span>
          </Link>
          <h2 className="text-2xl text-foreground">Inteligência de documentos</h2>
          <p className="text-sm text-muted-foreground">
            Envie documentos financeiros e acompanhe o processamento dos arquivos.
          </p>
        </div>

        <DocumentLibrary />
      </div>
    </Container>
  );
}
