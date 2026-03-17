import { useState } from "react";
import { Link } from "react-router-dom";
import Container from "../../components/Container";
import { ChevronLeftIcon } from "../../components/Icons";
import type { Document } from "./documents.types";
import AiChat from "./AiChat";
import DocumentLibrary from "./DocumentLibrary";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);

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
            Envie documentos financeiros, acompanhe o processamento e faça perguntas com IA.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <DocumentLibrary onDocumentsChange={setDocuments} />
          <AiChat documents={documents} />
        </div>
      </div>
    </Container>
  );
}
