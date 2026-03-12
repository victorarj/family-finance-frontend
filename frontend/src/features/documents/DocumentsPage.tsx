import { useState } from "react";
import Container from "../../components/Container";
import type { Document } from "./documents.types";
import AiChat from "./AiChat";
import DocumentLibrary from "./DocumentLibrary";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);

  return (
    <Container>
      <div className="space-y-6 py-6">
        <div className="space-y-2">
          <h2 className="text-2xl text-foreground">Document Intelligence</h2>
          <p className="text-sm text-muted-foreground">
            Upload financial documents, monitor processing, and ask AI questions across ready files.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <DocumentLibrary onDocumentsChange={setDocuments} />
          <AiChat documents={documents} />
        </div>
      </div>
    </Container>
  );
}
