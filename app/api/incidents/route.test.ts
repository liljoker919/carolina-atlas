import { describe, expect, it, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";
import { buildWhereClause, fetchIncidents, filterIncidentsByDateParts } from "@/lib/api/incidents";
import {
  ApiError,
  ERROR_CODE_RATE_LIMIT,
  ERROR_CODE_UPSTREAM,
  ERROR_CODE_VALIDATION,
  apiErrorResponse,
} from "@/lib/api/errors";
import { enforceApiRateLimit } from "@/lib/api/rate-limit";

vi.mock("@/lib/api/incidents", () => ({
  buildWhereClause: vi.fn(() => "1=1"),
  fetchIncidents: vi.fn(),
  filterIncidentsByDateParts: vi.fn((incidents) => incidents),
}));

vi.mock("@/lib/api/rate-limit", () => ({
  enforceApiRateLimit: vi.fn(() => null),
}));

describe("GET /api/incidents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(buildWhereClause).mockReturnValue("1=1");
    vi.mocked(enforceApiRateLimit).mockReturnValue(null);
  });

  it("returns 429 when the request rate limit is exceeded", async () => {
    vi.mocked(enforceApiRateLimit).mockReturnValue(
      apiErrorResponse(
        "Too many requests. Please try again later.",
        ERROR_CODE_RATE_LIMIT,
        429
      )
    );

    const request = new NextRequest("http://localhost/api/incidents");
    const response = await GET(request);
    const body = (await response.json()) as {
      error: { code: string; status: number };
    };

    expect(response.status).toBe(429);
    expect(body.error.code).toBe(ERROR_CODE_RATE_LIMIT);
    expect(fetchIncidents).not.toHaveBeenCalled();
  });

  it("returns a safe 400 response for invalid date input", async () => {
    const request = new NextRequest(
      "http://localhost/api/incidents?dateFrom=bad-date&dateTo=2025-01-07"
    );

    const response = await GET(request);
    const body = (await response.json()) as {
      error: { message: string; code: string; status: number };
    };

    expect(response.status).toBe(400);
    expect(body.error.code).toBe(ERROR_CODE_VALIDATION);
    expect(fetchIncidents).not.toHaveBeenCalled();
  });

  it("returns an empty result set for a valid future date range", async () => {
    vi.mocked(fetchIncidents).mockResolvedValue([]);

    const request = new NextRequest(
      "http://localhost/api/incidents?dateFrom=2026-05-01&dateTo=2026-05-10"
    );

    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(vi.mocked(buildWhereClause)).toHaveBeenCalledWith({
      crimeType: "",
      district: "",
      dateFrom: "2026-05-01",
      dateTo: "2026-05-10",
      searchQuery: "",
    });
    expect(vi.mocked(fetchIncidents)).toHaveBeenCalledWith({
      where: "1=1",
      limit: 500,
      fetchAll: true,
    });
    expect(vi.mocked(filterIncidentsByDateParts)).toHaveBeenCalledWith(
      [],
      "2026-05-01",
      "2026-05-10"
    );
    await expect(response.json()).resolves.toEqual([]);
  });

  it("returns a safe upstream error response when ArcGIS rejects the query", async () => {
    vi.mocked(fetchIncidents).mockRejectedValue(
      new ApiError(
        "Failed to fetch data from the Raleigh incidents service.",
        ERROR_CODE_UPSTREAM,
        502
      )
    );

    const request = new NextRequest(
      "http://localhost/api/incidents?dateFrom=2025-01-01&dateTo=2025-01-07"
    );

    const response = await GET(request);
    const body = (await response.json()) as {
      error: { message: string; code: string; status: number };
    };

    expect(response.status).toBe(502);
    expect(body.error).toEqual({
      message: "Failed to fetch data from the Raleigh incidents service.",
      code: ERROR_CODE_UPSTREAM,
      status: 502,
    });
    expect(body.error.message).not.toContain("ArcGIS API error 400");
  });
});
