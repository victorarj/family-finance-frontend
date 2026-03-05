import { describe, expect, it } from "vitest";
import { create as createSnapshot } from "../../src/apis/monthlySnapshots";
import { CANONICAL_MONTH, baseIncome, baseSnapshot } from "../fixtures/financialData";
import { buildFinancialEngineMock } from "../mocks/financialEngineMock";
import { server } from "../mocks/server";

describe("snapshots - duplicate prevention", () => {
  it("rejects duplicate snapshot with API error behavior", async () => {
    const engine = buildFinancialEngineMock({
      incomes: [baseIncome({ valor: 2000, data_recebimento: `${CANONICAL_MONTH}-01` })],
      snapshots: [baseSnapshot({ mes: CANONICAL_MONTH })],
    });
    server.use(...engine.handlers);

    await expect(createSnapshot({ mes: CANONICAL_MONTH })).rejects.toMatchObject({
      response: { status: 409 },
    });
    expect(engine.getSnapshots()).toHaveLength(1);
  });
});
