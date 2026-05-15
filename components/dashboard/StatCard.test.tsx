import { render, screen } from "@testing-library/react";
import StatCard from "./StatCard";

describe("StatCard", () => {
  it("renders label, value, and upward trend text", () => {
    render(<StatCard label="Incidents" value="42" trend="Updated daily" trendUp />);

    expect(screen.getByText("Incidents")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("↑ Updated daily")).toBeInTheDocument();
  });

  it("renders downward trend when trendUp is false", () => {
    render(<StatCard label="Incidents" value="42" trend="Down this week" trendUp={false} />);

    expect(screen.getByText("↓ Down this week")).toBeInTheDocument();
  });

  it("renders without trend text when trend prop is omitted", () => {
    render(<StatCard label="Districts" value="5" />);

    expect(screen.getByText("Districts")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.queryByText(/↑|↓/)).not.toBeInTheDocument();
  });

  it("renders a numeric value", () => {
    render(<StatCard label="Total" value={1234} />);

    expect(screen.getByText("1234")).toBeInTheDocument();
  });

  it("renders icon when icon prop is provided", () => {
    render(
      <StatCard
        label="Events"
        value="10"
        icon={<svg data-testid="test-icon" />}
      />
    );

    expect(screen.getByTestId("test-icon")).toBeInTheDocument();
  });

  it("does not render icon container when icon prop is omitted", () => {
    const { container } = render(<StatCard label="Events" value="10" />);

    // The icon wrapper span only appears when an icon is passed
    expect(container.querySelector("span.p-2")).not.toBeInTheDocument();
  });

  it("applies a custom className to the card element", () => {
    const { container } = render(
      <StatCard label="X" value="Y" className="my-custom-class" />
    );

    expect(container.firstChild).toHaveClass("my-custom-class");
  });
});
