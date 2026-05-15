import { render, screen } from "@testing-library/react";
import IncidentCard from "./IncidentCard";
import type { PoliceIncident } from "@/types";

const baseIncident: PoliceIncident = {
  attributes: {
    OBJECTID: 1,
    case_number: "2024-001",
    reported_block_address: "100 MAIN ST",
    crime_type: "THEFT",
    crime_category: "PROPERTY",
    district: "2",
    reported_date: 1700000000000,
  },
};

describe("IncidentCard", () => {
  it("renders the crime type badge", () => {
    render(<IncidentCard incident={baseIncident} />);

    expect(screen.getByText("THEFT")).toBeInTheDocument();
  });

  it("renders the location", () => {
    render(<IncidentCard incident={baseIncident} />);

    expect(screen.getByText("100 MAIN ST")).toBeInTheDocument();
  });

  it("renders the crime category", () => {
    render(<IncidentCard incident={baseIncident} />);

    expect(screen.getByText("PROPERTY")).toBeInTheDocument();
  });

  it("renders the district", () => {
    render(<IncidentCard incident={baseIncident} />);

    expect(screen.getByText("District 2")).toBeInTheDocument();
  });

  it("renders the case number", () => {
    render(<IncidentCard incident={baseIncident} />);

    expect(screen.getByText("Case #2024-001")).toBeInTheDocument();
  });

  it("renders 'Unknown' when crime_type is missing", () => {
    const incident: PoliceIncident = {
      attributes: { ...baseIncident.attributes, crime_type: undefined },
    };
    render(<IncidentCard incident={incident} />);

    expect(screen.getByText("Unknown")).toBeInTheDocument();
  });

  it("renders 'Location unavailable' when reported_block_address is missing", () => {
    const incident: PoliceIncident = {
      attributes: { ...baseIncident.attributes, reported_block_address: undefined },
    };
    render(<IncidentCard incident={incident} />);

    expect(screen.getByText("Location unavailable")).toBeInTheDocument();
  });

  it("does not render district when district is missing", () => {
    const incident: PoliceIncident = {
      attributes: { ...baseIncident.attributes, district: undefined },
    };
    render(<IncidentCard incident={incident} />);

    expect(screen.queryByText(/District/)).not.toBeInTheDocument();
  });

  it("does not render case number row when case_number is missing", () => {
    const incident: PoliceIncident = {
      attributes: { ...baseIncident.attributes, case_number: undefined },
    };
    render(<IncidentCard incident={incident} />);

    expect(screen.queryByText(/Case #/)).not.toBeInTheDocument();
  });

  it("does not render crime category when crime_category is missing", () => {
    const incident: PoliceIncident = {
      attributes: { ...baseIncident.attributes, crime_category: undefined },
    };
    render(<IncidentCard incident={incident} />);

    expect(screen.queryByText("PROPERTY")).not.toBeInTheDocument();
  });
});
