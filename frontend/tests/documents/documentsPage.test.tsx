import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { vi } from "vitest";
import { server } from "../mocks/server";
import DocumentsPage from "../../src/features/documents/DocumentsPage";
import { renderWithProviders } from "../utils/renderWithProviders";

vi.mock("../../src/features/documents/DocumentLibrary", async () => {
  const React = await import("react");

  return {
    default: function MockDocumentLibrary({
      onDocumentsChange,
    }: {
      onDocumentsChange?: (
        documents: Array<{
          id: number;
          filename: string;
          source_type: "payslip" | "bill";
          status: "ready" | "failed";
          uploaded_at: string;
          processed_at: string | null;
        }>,
      ) => void;
    }) {
      const documents = [
        {
          id: 11,
          filename: "March Payslip.pdf",
          source_type: "payslip" as const,
          status: "ready" as const,
          uploaded_at: "2026-03-11T10:00:00.000Z",
          processed_at: "2026-03-11T10:05:00.000Z",
        },
        {
          id: 12,
          filename: "Power Bill.pdf",
          source_type: "bill" as const,
          status: "failed" as const,
          uploaded_at: "2026-03-11T11:00:00.000Z",
          processed_at: null,
        },
      ];

      React.useEffect(() => {
        onDocumentsChange?.(documents);
      }, [onDocumentsChange]);

      return (
        <div>
          <p>{documents[0].filename}</p>
          <p>{documents[1].filename}</p>
        </div>
      );
    },
  };
});

describe("DocumentsPage", () => {
  it("passes ready documents into AI chat and sends filtered AI queries", async () => {
    const user = userEvent.setup();

    server.use(
      http.post("/api/v1/ai/query", async ({ request }) => {
        const body = (await request.json()) as { question: string; document_ids?: number[] };
        expect(body.question).toBe("Summarize my payslip");
        expect(body.document_ids).toEqual([11]);
        return HttpResponse.json({
          answer: "Your payslip shows a net increase.",
          sources: [
            {
              document_id: 11,
              chunk_index: 0,
              content_preview: "Net pay increased by 10%",
            },
          ],
        });
      }),
    );

    renderWithProviders(<DocumentsPage />);

    expect(await screen.findByText("March Payslip.pdf")).toBeInTheDocument();
    expect(screen.getByText("Power Bill.pdf")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /filter ready documents/i }));
    await user.click(screen.getByLabelText("March Payslip.pdf"));
    await user.type(screen.getByLabelText(/ask the assistant a question/i), "Summarize my payslip{enter}");

    expect(await screen.findByText("Your payslip shows a net increase.")).toBeInTheDocument();

    const sources = screen.getByText("Sources").closest("details");
    expect(sources).not.toBeNull();
    if (sources) {
      const scoped = within(sources);
      await user.click(scoped.getByText("Sources"));
      await waitFor(() => expect(scoped.getByText(/Document #11/i)).toBeInTheDocument());
    }
  });
});
