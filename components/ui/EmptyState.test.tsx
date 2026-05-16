import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import EmptyState from "./EmptyState";

describe("EmptyState", () => {
  it("renders with default title and description", () => {
    render(<EmptyState />);

    expect(screen.getByText("No results found")).toBeInTheDocument();
    expect(
      screen.getByText(
        "No data matches your current filters. Try adjusting or clearing your search."
      )
    ).toBeInTheDocument();
  });

  it("renders with a custom title", () => {
    render(<EmptyState title="No incidents found" />);

    expect(screen.getByText("No incidents found")).toBeInTheDocument();
  });

  it("renders with a custom description", () => {
    render(<EmptyState description="Try a different crime type." />);

    expect(screen.getByText("Try a different crime type.")).toBeInTheDocument();
  });

  it("has role='status' for screen readers", () => {
    render(<EmptyState />);

    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("has aria-live='polite' for screen readers", () => {
    render(<EmptyState />);

    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
  });

  it("does not render an action button when actionLabel is not provided", () => {
    render(<EmptyState />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders an action button when actionLabel and onAction are provided", () => {
    render(<EmptyState actionLabel="Clear filters" onAction={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Clear filters" })).toBeInTheDocument();
  });

  it("calls onAction when the action button is clicked", () => {
    const onAction = vi.fn();
    render(<EmptyState actionLabel="Clear filters" onAction={onAction} />);

    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));

    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("does not render action button when onAction is missing", () => {
    render(<EmptyState actionLabel="Clear filters" />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
