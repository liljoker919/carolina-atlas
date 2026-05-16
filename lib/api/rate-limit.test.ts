import { describe, expect, it, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import {
  __getRateLimitBucketCountForTests,
  __resetRateLimitBucketsForTests,
  enforceApiRateLimit,
} from "./rate-limit";
import { ERROR_CODE_RATE_LIMIT } from "./errors";

describe("enforceApiRateLimit", () => {
  beforeEach(() => {
    __resetRateLimitBucketsForTests();
  });

  it("allows requests under the configured limit", () => {
    const request = new NextRequest("http://localhost/api/incidents", {
      headers: { "x-forwarded-for": "203.0.113.1" },
    });

    const first = enforceApiRateLimit(request, "api/incidents", {
      limit: 2,
      windowMs: 60_000,
      now: 1_000,
    });
    const second = enforceApiRateLimit(request, "api/incidents", {
      limit: 2,
      windowMs: 60_000,
      now: 2_000,
    });

    expect(first).toBeNull();
    expect(second).toBeNull();
  });

  it("blocks requests over the configured limit and returns retry information", async () => {
    const request = new NextRequest("http://localhost/api/incidents", {
      headers: { "x-forwarded-for": "203.0.113.1" },
    });

    enforceApiRateLimit(request, "api/incidents", {
      limit: 1,
      windowMs: 60_000,
      now: 1_000,
    });
    const blocked = enforceApiRateLimit(request, "api/incidents", {
      limit: 1,
      windowMs: 60_000,
      now: 2_000,
    });

    expect(blocked?.status).toBe(429);
    expect(blocked?.headers.get("Retry-After")).toBe("59");
    await expect(blocked?.json()).resolves.toEqual({
      error: {
        message: "Too many requests. Please try again later.",
        code: ERROR_CODE_RATE_LIMIT,
        status: 429,
      },
    });
  });

  it("uses independent buckets per route", () => {
    const request = new NextRequest("http://localhost/api/incidents", {
      headers: { "x-forwarded-for": "203.0.113.1" },
    });

    enforceApiRateLimit(request, "api/incidents", {
      limit: 1,
      windowMs: 60_000,
      now: 1_000,
    });
    const differentRoute = enforceApiRateLimit(request, "api/incidents/options", {
      limit: 1,
      windowMs: 60_000,
      now: 2_000,
    });

    expect(differentRoute).toBeNull();
  });

  it("prunes expired buckets to avoid unbounded memory growth", () => {
    const firstIpRequest = new NextRequest("http://localhost/api/incidents", {
      headers: { "x-forwarded-for": "203.0.113.1" },
    });
    const secondIpRequest = new NextRequest("http://localhost/api/incidents", {
      headers: { "x-forwarded-for": "203.0.113.2" },
    });

    enforceApiRateLimit(firstIpRequest, "api/incidents", {
      limit: 1,
      windowMs: 1_000,
      now: 1_000,
    });
    enforceApiRateLimit(secondIpRequest, "api/incidents", {
      limit: 1,
      windowMs: 1_000,
      now: 1_500,
    });

    expect(__getRateLimitBucketCountForTests()).toBe(2);

    enforceApiRateLimit(firstIpRequest, "api/incidents", {
      limit: 1,
      windowMs: 1_000,
      now: 12_000,
    });

    expect(__getRateLimitBucketCountForTests()).toBe(1);
  });
});
