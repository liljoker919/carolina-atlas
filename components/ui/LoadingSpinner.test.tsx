import { render, screen } from "@testing-library/react";
import LoadingSpinner from "./LoadingSpinner";

describe("LoadingSpinner", () => {
  it("renders with the default label", () => {
    render(<LoadingSpinner />);

    expect(screen.getByText("Loading data…")).toBeInTheDocument();
  });

  it("renders with a custom label", () => {
    render(<LoadingSpinner label="Fetching incidents…" />);

    expect(screen.getByText("Fetching incidents…")).toBeInTheDocument();
  });

  it("has role='status' for screen readers", () => {
    render(<LoadingSpinner />);

    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("has aria-live='polite' for screen readers", () => {
    render(<LoadingSpinner />);

    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
  });

  it("renders the spinner element with aria-hidden", () => {
    const { container } = render(<LoadingSpinner />);

    const spinnerEl = container.querySelector("[aria-hidden='true']");
    expect(spinnerEl).toBeInTheDocument();
  });

  it("applies 'sm' size class to the spinner element", () => {
    const { container } = render(<LoadingSpinner size="sm" />);

    const spinnerEl = container.querySelector("[aria-hidden='true']");
    expect(spinnerEl).toHaveClass("w-6", "h-6");
  });

  it("applies 'md' size class to the spinner element", () => {
    const { container } = render(<LoadingSpinner size="md" />);

    const spinnerEl = container.querySelector("[aria-hidden='true']");
    expect(spinnerEl).toHaveClass("w-10", "h-10");
  });

  it("applies 'lg' size class to the spinner element", () => {
    const { container } = render(<LoadingSpinner size="lg" />);

    const spinnerEl = container.querySelector("[aria-hidden='true']");
    expect(spinnerEl).toHaveClass("w-16", "h-16");
  });
});
