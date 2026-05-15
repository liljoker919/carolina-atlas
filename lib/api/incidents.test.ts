/**
 * Unit tests for lib/api/incidents.ts
 *
 * Covers:
 *  - fetchIncidents: mocked API responses, pagination, HTTP errors, ArcGIS error bodies,
 *    malformed/missing features, pagination safety cap
 *  - fetchIncidentsByDateRange: verifies correct WHERE clause generation
 *  - extractCrimeTypes: deduplication, sorting, blank/null handling
 *  - extractDistricts: deduplication, sorting, blank/null handling
 *  - buildWhereClause: all individual filters and combinations
 *  - fetchDistinctValues: mocked responses, HTTP errors, ArcGIS error bodies,
 *    missing features, null value filtering
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ArcGISErrorBody, ArcGISResponse, PoliceIncident } from "@/types";
import { ApiError, ERROR_CODE_UPSTREAM } from "@/lib/api/errors";
import {
  buildWhereClause,
  extractCrimeTypes,
  extractDistricts,
  fetchDistinctValues,
  fetchIncidents,
  fetchIncidentsByDateRange,
} from "./incidents";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeIncident(
  overrides: Partial<PoliceIncident["attributes"]> = {}
): PoliceIncident {
  return {
    attributes: {
      OBJECTID: 1,
      case_number: "INC-001",
      crime_type: "THEFT",
      district: "NORTH",
      reported_date: 1_700_000_000_000,
      ...overrides,
    },
  };
}

function makeArcGISResponse(
  incidents: PoliceIncident[],
  exceededTransferLimit = false
): ArcGISResponse {
  return { features: incidents, exceededTransferLimit };
}

function makeArcGISError(code = 400, message = "Bad request"): ArcGISErrorBody {
  return { error: { code, message } };
}

/** Returns a mock fetch that responds with successive JSON payloads in order. */
function mockFetchSequence(...payloads: unknown[]) {
  let call = 0;
  return vi.fn(() => {
    const body = payloads[call] ?? payloads[payloads.length - 1];
    call++;
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(body),
    });
  });
}

/** Returns a mock fetch that always responds with a single JSON payload. */
function mockFetchOnce(payload: unknown, ok = true, status = 200) {
  return vi.fn(() =>
    Promise.resolve({
      ok,
      status,
      statusText: ok ? "OK" : "Internal Server Error",
      json: () => Promise.resolve(payload),
    })
  );
}

// ---------------------------------------------------------------------------
// fetchIncidents
// ---------------------------------------------------------------------------

describe("fetchIncidents", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("returns an empty array when the API returns no features", async () => {
    vi.stubGlobal("fetch", mockFetchOnce(makeArcGISResponse([])));

    const result = await fetchIncidents();
    expect(result).toEqual([]);
  });

  it("returns incidents from a successful single-page response", async () => {
    const incidents = [makeIncident({ OBJECTID: 1 }), makeIncident({ OBJECTID: 2 })];
    vi.stubGlobal("fetch", mockFetchOnce(makeArcGISResponse(incidents)));

    const result = await fetchIncidents({ limit: 10 });
    expect(result).toHaveLength(2);
    expect(result[0].attributes.OBJECTID).toBe(1);
    expect(result[1].attributes.OBJECTID).toBe(2);
  });

  it("respects the limit option and caps results", async () => {
    const incidents = Array.from({ length: 5 }, (_, i) =>
      makeIncident({ OBJECTID: i + 1 })
    );
    vi.stubGlobal("fetch", mockFetchOnce(makeArcGISResponse(incidents)));

    const result = await fetchIncidents({ limit: 3 });
    expect(result).toHaveLength(3);
  });

  it("paginates automatically when exceededTransferLimit is true", async () => {
    const page1 = Array.from({ length: 3 }, (_, i) => makeIncident({ OBJECTID: i + 1 }));
    const page2 = Array.from({ length: 2 }, (_, i) => makeIncident({ OBJECTID: i + 4 }));

    vi.stubGlobal(
      "fetch",
      mockFetchSequence(
        makeArcGISResponse(page1, true),
        makeArcGISResponse(page2, false)
      )
    );

    const result = await fetchIncidents({ limit: 100 });
    expect(result).toHaveLength(5);
  });

  it("throws when the HTTP response is not OK", async () => {
    vi.stubGlobal("fetch", mockFetchOnce({}, false, 503));

    await expect(fetchIncidents()).rejects.toMatchObject({
      message: "Failed to fetch data from the Raleigh incidents service.",
      code: ERROR_CODE_UPSTREAM,
      status: 502,
    } satisfies Partial<ApiError>);
  });

  it("throws a safe upstream error when fetch itself fails", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new TypeError("fetch failed"))));

    await expect(fetchIncidents()).rejects.toMatchObject({
      message: "Failed to fetch data from the Raleigh incidents service.",
      code: ERROR_CODE_UPSTREAM,
      status: 502,
    } satisfies Partial<ApiError>);
  });

  it("throws when the ArcGIS response contains an error body", async () => {
    vi.stubGlobal("fetch", mockFetchOnce(makeArcGISError(400, "Invalid WHERE clause")));

    await expect(fetchIncidents()).rejects.toMatchObject({
      message: "Failed to fetch data from the Raleigh incidents service.",
      code: ERROR_CODE_UPSTREAM,
      status: 502,
    } satisfies Partial<ApiError>);
  });

  it("throws when features array is missing from the response", async () => {
    vi.stubGlobal("fetch", mockFetchOnce({ /* no features key */ }));

    await expect(fetchIncidents()).rejects.toMatchObject({
      message: "Failed to fetch data from the Raleigh incidents service.",
      code: ERROR_CODE_UPSTREAM,
      status: 502,
    } satisfies Partial<ApiError>);
  });

  it("throws when exceededTransferLimit is true but features is empty", async () => {
    vi.stubGlobal("fetch", mockFetchOnce(makeArcGISResponse([], true)));

    await expect(fetchIncidents()).rejects.toMatchObject({
      message: "Failed to fetch data from the Raleigh incidents service.",
      code: ERROR_CODE_UPSTREAM,
      status: 502,
    } satisfies Partial<ApiError>);
  });

  it("passes the custom where clause to the request URL", async () => {
    const mockFetch = mockFetchOnce(makeArcGISResponse([]));
    vi.stubGlobal("fetch", mockFetch);

    await fetchIncidents({ where: "crime_type = 'THEFT'" });

    const calledUrl: string = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("where=crime_type+%3D+%27THEFT%27");
  });

  it("does not double-encode the where parameter", async () => {
    const mockFetch = mockFetchOnce(makeArcGISResponse([]));
    vi.stubGlobal("fetch", mockFetch);

    await fetchIncidents({ where: "crime_type = 'THEFT'" });

    const calledUrl: string = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).not.toContain("where=where%3D");
  });

  it("fetches all records when fetchAll is true", async () => {
    const page1 = Array.from({ length: 2 }, (_, i) => makeIncident({ OBJECTID: i + 1 }));
    const page2 = Array.from({ length: 1 }, (_, i) => makeIncident({ OBJECTID: i + 3 }));

    vi.stubGlobal(
      "fetch",
      mockFetchSequence(
        makeArcGISResponse(page1, true),
        makeArcGISResponse(page2, false)
      )
    );

    const result = await fetchIncidents({ fetchAll: true });
    expect(result).toHaveLength(3);
  });

  it("stops after the pagination safety cap and returns records gathered so far", async () => {
    let objectId = 0;
    const mockFetch = vi.fn(async () => ({
      ok: true,
      json: async () =>
        makeArcGISResponse([makeIncident({ OBJECTID: ++objectId })], true),
    }));

    vi.stubGlobal("fetch", mockFetch);

    const result = await fetchIncidents({ fetchAll: true });

    expect(result).toHaveLength(50);
    expect(mockFetch).toHaveBeenCalledTimes(50);
  });
});

// ---------------------------------------------------------------------------
// fetchIncidentsByDateRange
// ---------------------------------------------------------------------------

describe("fetchIncidentsByDateRange", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calls fetchIncidents with a date-range WHERE clause", async () => {
    const incidents = [makeIncident()];
    const mockFetch = mockFetchOnce(makeArcGISResponse(incidents));
    vi.stubGlobal("fetch", mockFetch);

    const result = await fetchIncidentsByDateRange("2024-01-01", "2024-01-31");

    expect(result).toEqual(incidents);

    const calledUrl: string = mockFetch.mock.calls[0][0] as string;
    const decodedUrl = decodeURIComponent(calledUrl).replace(/\+/g, " ");
    expect(decodedUrl).toContain(
      "where=reported_date >= DATE '2024-01-01' AND reported_date <= DATE '2024-01-31'"
    );
  });

  it("uses DATE literals for an inclusive same-day date range", async () => {
    const mockFetch = mockFetchOnce(makeArcGISResponse([]));
    vi.stubGlobal("fetch", mockFetch);

    await fetchIncidentsByDateRange("2024-01-01", "2024-01-01");

    const calledUrl: string = mockFetch.mock.calls[0][0] as string;
    const decodedUrl = decodeURIComponent(calledUrl).replace(/\+/g, " ");
    expect(decodedUrl).toContain(
      "where=reported_date >= DATE '2024-01-01' AND reported_date <= DATE '2024-01-01'"
    );
  });

  it("rejects invalid dates before executing an ArcGIS request", async () => {
    const mockFetch = mockFetchOnce(makeArcGISResponse([]));
    vi.stubGlobal("fetch", mockFetch);

    await expect(fetchIncidentsByDateRange("2024-99-01", "2024-01-31")).rejects.toThrow(
      'Invalid date format: "2024-99-01". Expected YYYY-MM-DD.'
    );
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// extractCrimeTypes
// ---------------------------------------------------------------------------

describe("extractCrimeTypes", () => {
  it("returns an empty array for an empty incidents list", () => {
    expect(extractCrimeTypes([])).toEqual([]);
  });

  it("returns sorted unique crime types", () => {
    const incidents = [
      makeIncident({ crime_type: "THEFT" }),
      makeIncident({ crime_type: "ASSAULT" }),
      makeIncident({ crime_type: "THEFT" }),
    ];
    expect(extractCrimeTypes(incidents)).toEqual(["ASSAULT", "THEFT"]);
  });

  it("trims whitespace from crime types", () => {
    const incidents = [
      makeIncident({ crime_type: "  THEFT  " }),
      makeIncident({ crime_type: "THEFT" }),
    ];
    expect(extractCrimeTypes(incidents)).toEqual(["THEFT"]);
  });

  it("ignores incidents with null or undefined crime_type", () => {
    const incidents = [
      makeIncident({ crime_type: undefined }),
      makeIncident({ crime_type: "ROBBERY" }),
    ];
    expect(extractCrimeTypes(incidents)).toEqual(["ROBBERY"]);
  });

  it("ignores blank crime_type strings", () => {
    const incidents = [makeIncident({ crime_type: "   " })];
    expect(extractCrimeTypes(incidents)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// extractDistricts
// ---------------------------------------------------------------------------

describe("extractDistricts", () => {
  it("returns an empty array for an empty incidents list", () => {
    expect(extractDistricts([])).toEqual([]);
  });

  it("returns sorted unique districts", () => {
    const incidents = [
      makeIncident({ district: "SOUTH" }),
      makeIncident({ district: "NORTH" }),
      makeIncident({ district: "SOUTH" }),
    ];
    expect(extractDistricts(incidents)).toEqual(["NORTH", "SOUTH"]);
  });

  it("trims whitespace from district names", () => {
    const incidents = [
      makeIncident({ district: "  EAST  " }),
      makeIncident({ district: "EAST" }),
    ];
    expect(extractDistricts(incidents)).toEqual(["EAST"]);
  });

  it("ignores incidents with null or undefined district", () => {
    const incidents = [
      makeIncident({ district: undefined }),
      makeIncident({ district: "WEST" }),
    ];
    expect(extractDistricts(incidents)).toEqual(["WEST"]);
  });

  it("ignores blank district strings", () => {
    const incidents = [makeIncident({ district: "   " })];
    expect(extractDistricts(incidents)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// buildWhereClause
// ---------------------------------------------------------------------------

describe("buildWhereClause", () => {
  it('returns "1=1" when no filters are provided', () => {
    expect(buildWhereClause({})).toBe("1=1");
  });

  it("builds a crime_type clause", () => {
    expect(buildWhereClause({ crimeType: "THEFT" })).toBe("crime_type = 'THEFT'");
  });

  it("builds a district clause", () => {
    expect(buildWhereClause({ district: "NORTH" })).toBe("district = 'NORTH'");
  });

  it("builds a dateFrom clause with ArcGIS DATE syntax", () => {
    const result = buildWhereClause({ dateFrom: "2024-01-15" });
    expect(result).toBe("reported_date >= DATE '2024-01-15'");
  });

  it("builds a dateTo clause with ArcGIS DATE syntax", () => {
    const result = buildWhereClause({ dateTo: "2024-01-15" });
    expect(result).toBe("reported_date <= DATE '2024-01-15'");
  });

  it("builds a searchQuery LIKE clause across multiple fields", () => {
    const result = buildWhereClause({ searchQuery: "Oak" });
    expect(result).toContain("reported_block_address LIKE '%Oak%'");
    expect(result).toContain("crime_type LIKE '%Oak%'");
    expect(result).toContain("case_number LIKE '%Oak%'");
    expect(result).toContain("crime_category LIKE '%Oak%'");
    expect(result).toContain("district LIKE '%Oak%'");
    expect(result).toMatch(/^\(/);
  });

  it("combines multiple filters with AND", () => {
    const result = buildWhereClause({ crimeType: "THEFT", district: "NORTH" });
    expect(result).toBe("crime_type = 'THEFT' AND district = 'NORTH'");
  });

  it("escapes single quotes in crimeType to prevent SQL injection", () => {
    const result = buildWhereClause({ crimeType: "O'CONNELL ASSAULT" });
    expect(result).toBe("crime_type = 'O''CONNELL ASSAULT'");
  });

  it("escapes single quotes in district", () => {
    const result = buildWhereClause({ district: "D'TOWN" });
    expect(result).toBe("district = 'D''TOWN'");
  });

  it("escapes single quotes in searchQuery", () => {
    const result = buildWhereClause({ searchQuery: "O'Brien" });
    expect(result).toContain("reported_block_address LIKE '%O''Brien%'");
  });

  it("builds dateFrom/dateTo DATE literals for same-day ranges", () => {
    const result = buildWhereClause({ dateFrom: "2024-06-01", dateTo: "2024-06-01" });
    expect(result).toBe(
      "reported_date >= DATE '2024-06-01' AND reported_date <= DATE '2024-06-01'"
    );
  });

  it("throws for invalid date filters before building WHERE clauses", () => {
    expect(() => buildWhereClause({ dateFrom: "2024-02-30" })).toThrow(
      'Invalid date format: "2024-02-30". Expected YYYY-MM-DD.'
    );
  });
});

// ---------------------------------------------------------------------------
// fetchDistinctValues
// ---------------------------------------------------------------------------

describe("fetchDistinctValues", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns sorted non-null distinct values for a field", async () => {
    const response: ArcGISResponse = {
      features: [
        { attributes: { OBJECTID: 1, district: "SOUTH" } },
        { attributes: { OBJECTID: 2, district: "NORTH" } },
        { attributes: { OBJECTID: 3, district: "EAST" } },
      ],
    };
    vi.stubGlobal("fetch", mockFetchOnce(response));

    const result = await fetchDistinctValues("district");
    expect(result).toEqual(["EAST", "NORTH", "SOUTH"]);
  });

  it("filters out null values from the response", async () => {
    const response: ArcGISResponse = {
      features: [
        { attributes: { OBJECTID: 1, district: "NORTH" } },
        { attributes: { OBJECTID: 2, district: null as unknown as string } },
      ],
    };
    vi.stubGlobal("fetch", mockFetchOnce(response));

    const result = await fetchDistinctValues("district");
    expect(result).toEqual(["NORTH"]);
  });

  it("filters out empty string values from the response", async () => {
    const response: ArcGISResponse = {
      features: [
        { attributes: { OBJECTID: 1, district: "NORTH" } },
        { attributes: { OBJECTID: 2, district: "  " } },
      ],
    };
    vi.stubGlobal("fetch", mockFetchOnce(response));

    const result = await fetchDistinctValues("district");
    expect(result).toEqual(["NORTH"]);
  });

  it("returns an empty array when there are no features", async () => {
    vi.stubGlobal("fetch", mockFetchOnce(makeArcGISResponse([])));

    const result = await fetchDistinctValues("district");
    expect(result).toEqual([]);
  });

  it("throws when the HTTP response is not OK", async () => {
    vi.stubGlobal("fetch", mockFetchOnce({}, false, 500));

    await expect(fetchDistinctValues("district")).rejects.toMatchObject({
      message: "Failed to fetch data from the Raleigh incidents service.",
      code: ERROR_CODE_UPSTREAM,
      status: 502,
    } satisfies Partial<ApiError>);
  });

  it("throws a safe upstream error when fetch itself fails", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new TypeError("fetch failed"))));

    await expect(fetchDistinctValues("district")).rejects.toMatchObject({
      message: "Failed to fetch data from the Raleigh incidents service.",
      code: ERROR_CODE_UPSTREAM,
      status: 502,
    } satisfies Partial<ApiError>);
  });

  it("throws when the ArcGIS response contains an error body", async () => {
    vi.stubGlobal("fetch", mockFetchOnce(makeArcGISError(499, "Field not found")));

    await expect(fetchDistinctValues("district")).rejects.toMatchObject({
      message: "Failed to fetch data from the Raleigh incidents service.",
      code: ERROR_CODE_UPSTREAM,
      status: 502,
    } satisfies Partial<ApiError>);
  });

  it("throws when features array is missing from the response", async () => {
    vi.stubGlobal("fetch", mockFetchOnce({ objectIdField: "OBJECTID" }));

    await expect(fetchDistinctValues("district")).rejects.toMatchObject({
      message: "Failed to fetch data from the Raleigh incidents service.",
      code: ERROR_CODE_UPSTREAM,
      status: 502,
    } satisfies Partial<ApiError>);
  });

  it("trims whitespace from returned values", async () => {
    const response: ArcGISResponse = {
      features: [{ attributes: { OBJECTID: 1, district: "  NORTH  " } }],
    };
    vi.stubGlobal("fetch", mockFetchOnce(response));

    const result = await fetchDistinctValues("district");
    expect(result).toEqual(["NORTH"]);
  });
});
