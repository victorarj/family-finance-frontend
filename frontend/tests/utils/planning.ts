import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

export async function goToPlanningStep(stepNumber: number) {
  for (let i = 1; i < stepNumber; i += 1) {
    await userEvent.click(screen.getByRole("button", { name: "Próximo" }));
  }
}
