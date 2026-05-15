import { render, screen } from "@testing-library/react";
import ComingSoon from "./ComingSoon";

describe("ComingSoon", () => {
  it("renders the title", () => {
    render(<ComingSoon title="Analytics Dashboard" />);

    expect(screen.getByText("Analytics Dashboard")).toBeInTheDocument();
  });

  it("renders the default description when no description prop is provided", () => {
    render(<ComingSoon title="Analytics Dashboard" />);

    expect(
      screen.getByText(
        "This feature is under development and will be available in a future release."
      )
    ).toBeInTheDocument();
  });

  it("renders a custom description", () => {
    render(
      <ComingSoon
        title="Analytics Dashboard"
        description="Check back next quarter for live data."
      />
    );

    expect(
      screen.getByText("Check back next quarter for live data.")
    ).toBeInTheDocument();
  });

  it("renders the 'Coming Soon' badge", () => {
    render(<ComingSoon title="Analytics Dashboard" />);

    expect(screen.getByText("Coming Soon")).toBeInTheDocument();
  });

  it("renders a custom icon when icon prop is provided", () => {
    render(
      <ComingSoon
        title="Analytics Dashboard"
        icon={<svg data-testid="custom-icon" />}
      />
    );

    expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
  });

  it("renders the default icon when no icon prop is provided", () => {
    const { container } = render(<ComingSoon title="Analytics Dashboard" />);

    expect(screen.queryByTestId("custom-icon")).not.toBeInTheDocument();
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});
