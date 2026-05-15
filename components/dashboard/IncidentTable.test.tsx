import { render, screen } from "@testing-library/react";
import IncidentTable from "./IncidentTable";
import type { PoliceIncident } from "@/types";

const makeIncident = (overrides: Partial<PoliceIncident["attributes"]> = {}): PoliceIncident => ({
  attributes: {
    OBJECTID: 1,
    INC_NO: "2024-001",
    LOCATION: "100 MAIN ST",
    CRIME_TYPE: "THEFT",
    DISTRICT: "2",
    INC_DATETIME: 1700000000000,
    ...overrides,
  },
});

describe("IncidentTable", () => {
  it("renders table column headers", () => {
    render(<IncidentTable incidents={[makeIncident()]} />);

    expect(screen.getByText("Date/Time")).toBeInTheDocument();
    expect(screen.getByText("Crime Type")).toBeInTheDocument();
    expect(screen.getByText("Location")).toBeInTheDocument();
    expect(screen.getByText("District")).toBeInTheDocument();
    expect(screen.getByText("Case #")).toBeInTheDocument();
  });

  it("renders a row for each incident", () => {
    const incidents = [
      makeIncident({ OBJECTID: 1, CRIME_TYPE: "THEFT", LOCATION: "100 MAIN ST" }),
      makeIncident({ OBJECTID: 2, CRIME_TYPE: "ASSAULT", LOCATION: "200 ELM ST" }),
    ];
    render(<IncidentTable incidents={incidents} />);

    expect(screen.getByText("THEFT")).toBeInTheDocument();
    expect(screen.getByText("100 MAIN ST")).toBeInTheDocument();
    expect(screen.getByText("ASSAULT")).toBeInTheDocument();
    expect(screen.getByText("200 ELM ST")).toBeInTheDocument();
  });

  it("renders '—' for missing location", () => {
    render(<IncidentTable incidents={[makeIncident({ LOCATION: undefined })]} />);

    // At least one em-dash placeholder should be present
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThan(0);
  });

  it("renders 'Unknown' when CRIME_TYPE is missing", () => {
    render(<IncidentTable incidents={[makeIncident({ CRIME_TYPE: undefined })]} />);

    expect(screen.getByText("Unknown")).toBeInTheDocument();
  });

  it("shows empty state message when incidents array is empty", () => {
    render(<IncidentTable incidents={[]} />);

    expect(
      screen.getByText("No incidents found matching your filters.")
    ).toBeInTheDocument();
  });

  it("does not render the table when incidents array is empty", () => {
    render(<IncidentTable incidents={[]} />);

    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});
