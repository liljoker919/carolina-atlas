import { NextRequest, NextResponse } from "next/server";
import {
  apiErrorResponse,
  ApiErrorBody,
  ERROR_CODE_RATE_LIMIT,
} from "@/lib/api/errors";

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

interface RateLimitOptions {
  limit?: number;
  windowMs?: number;
  now?: number;
}

const DEFAULT_REQUEST_LIMIT = 60;
const DEFAULT_WINDOW_MS = 60_000;
const PRUNE_INTERVAL_MS = 10_000;
const rateLimitBuckets = new Map<string, RateLimitBucket>();
let lastPrunedAt = 0;

function maybePruneExpiredBuckets(now: number) {
  if (now - lastPrunedAt < PRUNE_INTERVAL_MS) {
    return;
  }

  for (const [key, bucket] of rateLimitBuckets.entries()) {
    if (now >= bucket.resetAt) {
      rateLimitBuckets.delete(key);
    }
  }

  lastPrunedAt = now;
}

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const [firstForwardedEntry] = forwardedFor.split(",");
    const ip = firstForwardedEntry?.trim();
    if (ip) {
      return ip;
    }
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  return realIp || "unknown";
}

export function enforceApiRateLimit(
  request: NextRequest,
  routeKey: string,
  options: RateLimitOptions = {}
): NextResponse<ApiErrorBody> | null {
  const limit = options.limit ?? DEFAULT_REQUEST_LIMIT;
  const windowMs = options.windowMs ?? DEFAULT_WINDOW_MS;
  const now = options.now ?? Date.now();
  maybePruneExpiredBuckets(now);
  const key = `${routeKey}:${getClientIp(request)}`;
  const bucket = rateLimitBuckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }

  if (bucket.count >= limit) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((bucket.resetAt - now) / 1000)
    );
    const response = apiErrorResponse(
      "Too many requests. Please try again later.",
      ERROR_CODE_RATE_LIMIT,
      429
    );
    response.headers.set("Retry-After", String(retryAfterSeconds));
    return response;
  }

  bucket.count += 1;
  return null;
}
