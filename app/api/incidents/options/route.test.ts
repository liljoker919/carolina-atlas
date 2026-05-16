import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";
import { fetchDistinctValues } from "@/lib/api/incidents";
import {
  ERROR_CODE_RATE_LIMIT,
  apiErrorResponse,
} from "@/lib/api/errors";
import { enforceApiRateLimit } from "@/lib/api/rate-limit";

vi.mock("@/lib/api/incidents", () => ({
  fetchDistinctValues: vi.fn(),
}));

vi.mock("@/lib/api/rate-limit", () => ({
  enforceApiRateLimit: vi.fn(() => null),
}));

describe("GET /api/incidents/options", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(enforceApiRateLimit).mockReturnValue(null);
  });

  it("returns options from distinct value lookups", async () => {
    vi.mocked(fetchDistinctValues)
      .mockResolvedValueOnce(["THEFT", "ASSAULT"])
      .mockResolvedValueOnce(["NORTH", "WEST"]);

    const response = await GET(
      new NextRequest("http://localhost/api/incidents/options")
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      crimeTypes: ["THEFT", "ASSAULT"],
      districts: ["NORTH", "WEST"],
    });
  });

  it("returns 429 when the request rate limit is exceeded", async () => {
    vi.mocked(enforceApiRateLimit).mockReturnValue(
      apiErrorResponse(
        "Too many requests. Please try again later.",
        ERROR_CODE_RATE_LIMIT,
        429
      )
    );

    const response = await GET(
      new NextRequest("http://localhost/api/incidents/options")
    );
    const body = (await response.json()) as {
      error: { code: string };
    };

    expect(response.status).toBe(429);
    expect(body.error.code).toBe(ERROR_CODE_RATE_LIMIT);
    expect(fetchDistinctValues).not.toHaveBeenCalled();
  });
});
