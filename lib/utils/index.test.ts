import { describe, expect, it } from "vitest";
import type { IncidentFilters, PoliceIncident } from "@/types";
import { filterIncidents } from "./index";

function makeIncident(
  objectId: number,
  overrides: Partial<PoliceIncident["attributes"]> = {}
): PoliceIncident {
  return {
    attributes: {
      OBJECTID: objectId,
      crime_type: "THEFT",
      district: "NORTH",
      ...overrides,
    },
  };
}

const EMPTY_FILTERS: IncidentFilters = {
  searchQuery: "",
  crimeType: "",
  district: "",
  dateFrom: "",
  dateTo: "",
};

describe("filterIncidents", () => {
  it("filters by reported_year/reported_month/reported_day inclusively", () => {
    const incidents = [
      makeIncident(1, { reported_year: 2026, reported_month: 5, reported_day: 1 }),
      makeIncident(2, { reported_year: 2026, reported_month: 5, reported_day: 2 }),
      makeIncident(3, { reported_year: 2026, reported_month: 5, reported_day: 3 }),
    ];

    const result = filterIncidents(incidents, {
      ...EMPTY_FILTERS,
      dateFrom: "2026-05-01",
      dateTo: "2026-05-02",
    });

    expect(result.map((incident) => incident.attributes.OBJECTID)).toEqual([1, 2]);
  });

  it("falls back to reported_date when numeric date parts are unavailable", () => {
    const incidents = [
      makeIncident(1, { reported_date: new Date(2026, 4, 14, 12, 0, 0).getTime() }),
      makeIncident(2, { reported_date: new Date(2026, 4, 15, 12, 0, 0).getTime() }),
    ];

    const result = filterIncidents(incidents, {
      ...EMPTY_FILTERS,
      dateFrom: "2026-05-14",
      dateTo: "2026-05-14",
    });

    expect(result.map((incident) => incident.attributes.OBJECTID)).toEqual([1]);
  });

  it("excludes incidents without any usable date fields when date filters are active", () => {
    const incidents = [makeIncident(1)];

    const result = filterIncidents(incidents, {
      ...EMPTY_FILTERS,
      dateFrom: "2026-05-14",
      dateTo: "2026-05-14",
    });

    expect(result).toEqual([]);
  });
});
