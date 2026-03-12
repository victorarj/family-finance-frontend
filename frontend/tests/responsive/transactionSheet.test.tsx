import { render, screen } from "@testing-library/react";
import TransactionSheet from "../../src/components/TransactionSheet";
import { mockViewport } from "../utils/mockViewport";

describe("TransactionSheet responsive behavior", () => {
  it("renders as a drawer on mobile", () => {
    mockViewport(390);

    render(
      <TransactionSheet open onOpenChange={() => {}} title="Nova entrada">
        <div>Sheet content</div>
      </TransactionSheet>,
    );

    expect(screen.getByText("Sheet content").closest("[data-sheet-mode='drawer']")).toBeInTheDocument();
  });

  it("renders as a dialog-like panel on desktop", () => {
    mockViewport(1280);

    render(
      <TransactionSheet open onOpenChange={() => {}} title="Nova entrada">
        <div>Sheet content</div>
      </TransactionSheet>,
    );

    expect(screen.getByText("Sheet content").closest("[data-sheet-mode='dialog']")).toBeInTheDocument();
  });
});
