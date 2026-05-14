import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import ErrorMessage from "./ErrorMessage";

describe("ErrorMessage", () => {
  it("renders message with default title", () => {
    render(<ErrorMessage message="Failed to load incidents" />);

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("Failed to load incidents")).toBeInTheDocument();
  });

  it("calls retry callback when retry button is clicked", () => {
    const onRetry = vi.fn();

    render(<ErrorMessage message="Failed to load incidents" onRetry={onRetry} />);
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
