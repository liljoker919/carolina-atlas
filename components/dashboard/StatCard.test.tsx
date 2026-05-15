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
});
