import { render, screen } from "@testing-library/react";
import IncidentCard from "./IncidentCard";
import type { PoliceIncident } from "@/types";

const baseIncident: PoliceIncident = {
  attributes: {
    OBJECTID: 1,
    INC_NO: "2024-001",
    LOCATION: "100 MAIN ST",
    CRIME_TYPE: "THEFT",
    CRIME_CATEGORY: "PROPERTY",
    DISTRICT: "2",
    INC_DATETIME: 1700000000000,
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

  it("renders 'Unknown' when CRIME_TYPE is missing", () => {
    const incident: PoliceIncident = {
      attributes: { ...baseIncident.attributes, CRIME_TYPE: undefined },
    };
    render(<IncidentCard incident={incident} />);

    expect(screen.getByText("Unknown")).toBeInTheDocument();
  });

  it("renders 'Location unavailable' when LOCATION is missing", () => {
    const incident: PoliceIncident = {
      attributes: { ...baseIncident.attributes, LOCATION: undefined },
    };
    render(<IncidentCard incident={incident} />);

    expect(screen.getByText("Location unavailable")).toBeInTheDocument();
  });

  it("does not render district when DISTRICT is missing", () => {
    const incident: PoliceIncident = {
      attributes: { ...baseIncident.attributes, DISTRICT: undefined },
    };
    render(<IncidentCard incident={incident} />);

    expect(screen.queryByText(/District/)).not.toBeInTheDocument();
  });

  it("does not render case number row when INC_NO is missing", () => {
    const incident: PoliceIncident = {
      attributes: { ...baseIncident.attributes, INC_NO: undefined },
    };
    render(<IncidentCard incident={incident} />);

    expect(screen.queryByText(/Case #/)).not.toBeInTheDocument();
  });

  it("does not render crime category when CRIME_CATEGORY is missing", () => {
    const incident: PoliceIncident = {
      attributes: { ...baseIncident.attributes, CRIME_CATEGORY: undefined },
    };
    render(<IncidentCard incident={incident} />);

    expect(screen.queryByText("PROPERTY")).not.toBeInTheDocument();
  });
});
