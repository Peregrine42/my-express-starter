import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { Index } from "../../src/pages/Index";

test("displays a greeting", async () => {
  // ARRANGE
  render(<Index />);

  // ASSERT
  expect(screen.getByRole("heading")).toHaveTextContent("Hello");
});
