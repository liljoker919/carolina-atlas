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
      INC_NO: "INC-001",
      CRIME_TYPE: "THEFT",
      DISTRICT: "NORTH",
      INC_DATETIME: 1_700_000_000_000,
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

    await fetchIncidents({ where: "CRIME_TYPE = 'THEFT'" });

    const calledUrl: string = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("where=CRIME_TYPE+%3D+%27THEFT%27");
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
    // The WHERE clause should reference reported_date with numeric epoch timestamps
    expect(calledUrl).toContain("reported_date");
  });

  it("includes the full last day in the date range", async () => {
    const mockFetch = mockFetchOnce(makeArcGISResponse([]));
    vi.stubGlobal("fetch", mockFetch);

    await fetchIncidentsByDateRange("2024-01-01", "2024-01-01");

    const calledUrl: string = mockFetch.mock.calls[0][0] as string;
    // URLSearchParams encodes spaces as + and > / < as %3E / %3C — replace both
    const decodedUrl = decodeURIComponent(calledUrl).replace(/\+/g, " ");
    // The end timestamp should be the final millisecond of the dateTo day.
    const match = decodedUrl.match(/reported_date >= (\d+) AND reported_date <= (\d+)/);
    expect(match).not.toBeNull();
    const fromMs = Number(match![1]);
    const toMs = Number(match![2]);
    expect(toMs - fromMs).toBe(86_399_999);
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
      makeIncident({ CRIME_TYPE: "THEFT" }),
      makeIncident({ CRIME_TYPE: "ASSAULT" }),
      makeIncident({ CRIME_TYPE: "THEFT" }),
    ];
    expect(extractCrimeTypes(incidents)).toEqual(["ASSAULT", "THEFT"]);
  });

  it("trims whitespace from crime types", () => {
    const incidents = [
      makeIncident({ CRIME_TYPE: "  THEFT  " }),
      makeIncident({ CRIME_TYPE: "THEFT" }),
    ];
    expect(extractCrimeTypes(incidents)).toEqual(["THEFT"]);
  });

  it("ignores incidents with null or undefined CRIME_TYPE", () => {
    const incidents = [
      makeIncident({ CRIME_TYPE: undefined }),
      makeIncident({ CRIME_TYPE: "ROBBERY" }),
    ];
    expect(extractCrimeTypes(incidents)).toEqual(["ROBBERY"]);
  });

  it("ignores blank CRIME_TYPE strings", () => {
    const incidents = [makeIncident({ CRIME_TYPE: "   " })];
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
      makeIncident({ DISTRICT: "SOUTH" }),
      makeIncident({ DISTRICT: "NORTH" }),
      makeIncident({ DISTRICT: "SOUTH" }),
    ];
    expect(extractDistricts(incidents)).toEqual(["NORTH", "SOUTH"]);
  });

  it("trims whitespace from district names", () => {
    const incidents = [
      makeIncident({ DISTRICT: "  EAST  " }),
      makeIncident({ DISTRICT: "EAST" }),
    ];
    expect(extractDistricts(incidents)).toEqual(["EAST"]);
  });

  it("ignores incidents with null or undefined DISTRICT", () => {
    const incidents = [
      makeIncident({ DISTRICT: undefined }),
      makeIncident({ DISTRICT: "WEST" }),
    ];
    expect(extractDistricts(incidents)).toEqual(["WEST"]);
  });

  it("ignores blank DISTRICT strings", () => {
    const incidents = [makeIncident({ DISTRICT: "   " })];
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

  it("builds a CRIME_TYPE clause", () => {
    expect(buildWhereClause({ crimeType: "THEFT" })).toBe("CRIME_TYPE = 'THEFT'");
  });

  it("builds a DISTRICT clause", () => {
    expect(buildWhereClause({ district: "NORTH" })).toBe("DISTRICT = 'NORTH'");
  });

  it("builds a dateFrom clause with epoch milliseconds", () => {
    const result = buildWhereClause({ dateFrom: "2024-01-15" });
    expect(result).toMatch(/^reported_date >= \d+$/);
  });

  it("builds a dateTo clause with epoch milliseconds (inclusive end of day)", () => {
    const result = buildWhereClause({ dateTo: "2024-01-15" });
    expect(result).toMatch(/^reported_date <= \d+$/);
  });

  it("builds a searchQuery LIKE clause across multiple fields", () => {
    const result = buildWhereClause({ searchQuery: "Oak" });
    expect(result).toContain("LOCATION LIKE '%Oak%'");
    expect(result).toContain("CRIME_TYPE LIKE '%Oak%'");
    expect(result).toContain("INC_NO LIKE '%Oak%'");
    expect(result).toContain("CRIME_CATEGORY LIKE '%Oak%'");
    expect(result).toContain("DISTRICT LIKE '%Oak%'");
    expect(result).toMatch(/^\(/);
  });

  it("combines multiple filters with AND", () => {
    const result = buildWhereClause({ crimeType: "THEFT", district: "NORTH" });
    expect(result).toBe("CRIME_TYPE = 'THEFT' AND DISTRICT = 'NORTH'");
  });

  it("escapes single quotes in crimeType to prevent SQL injection", () => {
    const result = buildWhereClause({ crimeType: "O'CONNELL ASSAULT" });
    expect(result).toBe("CRIME_TYPE = 'O''CONNELL ASSAULT'");
  });

  it("escapes single quotes in district", () => {
    const result = buildWhereClause({ district: "D'TOWN" });
    expect(result).toBe("DISTRICT = 'D''TOWN'");
  });

  it("escapes single quotes in searchQuery", () => {
    const result = buildWhereClause({ searchQuery: "O'Brien" });
    expect(result).toContain("LOCATION LIKE '%O''Brien%'");
  });

  it("dateFrom <= dateTo epoch values when same day", () => {
    const result = buildWhereClause({ dateFrom: "2024-06-01", dateTo: "2024-06-01" });
    const fromMatch = result.match(/reported_date >= (\d+)/);
    const toMatch = result.match(/reported_date <= (\d+)/);
    expect(fromMatch).not.toBeNull();
    expect(toMatch).not.toBeNull();
    expect(Number(fromMatch![1])).toBeLessThanOrEqual(Number(toMatch![1]));
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
        { attributes: { OBJECTID: 1, DISTRICT: "SOUTH" } },
        { attributes: { OBJECTID: 2, DISTRICT: "NORTH" } },
        { attributes: { OBJECTID: 3, DISTRICT: "EAST" } },
      ],
    };
    vi.stubGlobal("fetch", mockFetchOnce(response));

    const result = await fetchDistinctValues("DISTRICT");
    expect(result).toEqual(["EAST", "NORTH", "SOUTH"]);
  });

  it("filters out null values from the response", async () => {
    const response: ArcGISResponse = {
      features: [
        { attributes: { OBJECTID: 1, DISTRICT: "NORTH" } },
        { attributes: { OBJECTID: 2, DISTRICT: null as unknown as string } },
      ],
    };
    vi.stubGlobal("fetch", mockFetchOnce(response));

    const result = await fetchDistinctValues("DISTRICT");
    expect(result).toEqual(["NORTH"]);
  });

  it("filters out empty string values from the response", async () => {
    const response: ArcGISResponse = {
      features: [
        { attributes: { OBJECTID: 1, DISTRICT: "NORTH" } },
        { attributes: { OBJECTID: 2, DISTRICT: "  " } },
      ],
    };
    vi.stubGlobal("fetch", mockFetchOnce(response));

    const result = await fetchDistinctValues("DISTRICT");
    expect(result).toEqual(["NORTH"]);
  });

  it("returns an empty array when there are no features", async () => {
    vi.stubGlobal("fetch", mockFetchOnce(makeArcGISResponse([])));

    const result = await fetchDistinctValues("DISTRICT");
    expect(result).toEqual([]);
  });

  it("throws when the HTTP response is not OK", async () => {
    vi.stubGlobal("fetch", mockFetchOnce({}, false, 500));

    await expect(fetchDistinctValues("DISTRICT")).rejects.toMatchObject({
      message: "Failed to fetch data from the Raleigh incidents service.",
      code: ERROR_CODE_UPSTREAM,
      status: 502,
    } satisfies Partial<ApiError>);
  });

  it("throws a safe upstream error when fetch itself fails", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new TypeError("fetch failed"))));

    await expect(fetchDistinctValues("DISTRICT")).rejects.toMatchObject({
      message: "Failed to fetch data from the Raleigh incidents service.",
      code: ERROR_CODE_UPSTREAM,
      status: 502,
    } satisfies Partial<ApiError>);
  });

  it("throws when the ArcGIS response contains an error body", async () => {
    vi.stubGlobal("fetch", mockFetchOnce(makeArcGISError(499, "Field not found")));

    await expect(fetchDistinctValues("DISTRICT")).rejects.toMatchObject({
      message: "Failed to fetch data from the Raleigh incidents service.",
      code: ERROR_CODE_UPSTREAM,
      status: 502,
    } satisfies Partial<ApiError>);
  });

  it("throws when features array is missing from the response", async () => {
    vi.stubGlobal("fetch", mockFetchOnce({ objectIdField: "OBJECTID" }));

    await expect(fetchDistinctValues("DISTRICT")).rejects.toMatchObject({
      message: "Failed to fetch data from the Raleigh incidents service.",
      code: ERROR_CODE_UPSTREAM,
      status: 502,
    } satisfies Partial<ApiError>);
  });

  it("trims whitespace from returned values", async () => {
    const response: ArcGISResponse = {
      features: [{ attributes: { OBJECTID: 1, DISTRICT: "  NORTH  " } }],
    };
    vi.stubGlobal("fetch", mockFetchOnce(response));

    const result = await fetchDistinctValues("DISTRICT");
    expect(result).toEqual(["NORTH"]);
  });
});
