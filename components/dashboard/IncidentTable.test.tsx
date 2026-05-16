import { render, screen } from "@testing-library/react";
import IncidentTable from "./IncidentTable";
import type { PoliceIncident } from "@/types";

const makeIncident = (overrides: Partial<PoliceIncident["attributes"]> = {}): PoliceIncident => ({
  attributes: {
    OBJECTID: 1,
    case_number: "2024-001",
    reported_block_address: "100 MAIN ST",
    crime_type: "THEFT",
    district: "2",
    reported_date: 1700000000000,
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
      makeIncident({ OBJECTID: 1, crime_type: "THEFT", reported_block_address: "100 MAIN ST" }),
      makeIncident({ OBJECTID: 2, crime_type: "ASSAULT", reported_block_address: "200 ELM ST" }),
    ];
    render(<IncidentTable incidents={incidents} />);

    expect(screen.getByText("THEFT")).toBeInTheDocument();
    expect(screen.getByText("100 MAIN ST")).toBeInTheDocument();
    expect(screen.getByText("ASSAULT")).toBeInTheDocument();
    expect(screen.getByText("200 ELM ST")).toBeInTheDocument();
  });

  it("renders '—' for missing reported_block_address", () => {
    const incident = makeIncident({ reported_block_address: undefined });
    render(<IncidentTable incidents={[incident]} />);

    const caseCell = screen.getByText(incident.attributes.case_number!);
    const row = caseCell.closest("tr");
    expect(row).not.toBeNull();

    const cells = row?.querySelectorAll("td");
    expect(cells).toHaveLength(5);
    expect(cells?.[2]).toHaveTextContent("—");
  });

  it("renders 'Unknown' when crime_type is missing", () => {
    render(<IncidentTable incidents={[makeIncident({ crime_type: undefined })]} />);

    expect(screen.getByText("Unknown")).toBeInTheDocument();
  });

  it("shows empty state message when incidents array is empty", () => {
    render(<IncidentTable incidents={[]} />);

    expect(
      screen.getByText("No incidents found")
    ).toBeInTheDocument();
  });

  it("does not render the table when incidents array is empty", () => {
    render(<IncidentTable incidents={[]} />);

    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});
