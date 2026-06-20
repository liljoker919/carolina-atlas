/**
 * GET /api/demographics
 *
 * Returns NC county demographics from ACS 2023 5-Year Estimates
 * (data/dist/demographics.json).
 *
 * Query parameters:
 *   search  — case-insensitive partial match on county name
 *   fips    — comma-separated 5-digit FIPS codes (e.g. "37183,37119");
 *             filters to exact county matches and composes with search
 *
 * Response shape:
 *   { counties: CountyDemographics[], total: number }
 */

import { NextRequest, NextResponse } from "next/server";
import { filterDemographics } from "@/lib/api/demographics";
import { sanitizeSearch, sanitizeParam } from "@/lib/validation";
import { apiErrorFromUnknown } from "@/lib/api/errors";
import { enforceApiRateLimit } from "@/lib/api/rate-limit";

const FIPS_RE = /^\d{5}$/;

export async function GET(request: NextRequest) {
  const rateLimitResponse = enforceApiRateLimit(request, "api/demographics");
  if (rateLimitResponse) return rateLimitResponse;

  const { searchParams } = request.nextUrl;

  const search  = sanitizeSearch(searchParams.get("search") ?? "");
  const fipsRaw = sanitizeParam(searchParams.get("fips")   ?? "");

  // Parse comma-separated FIPS codes; silently drop any that aren't 5-digit numeric.
  const fips = fipsRaw
    ? fipsRaw.split(",").map((f) => f.trim()).filter((f) => FIPS_RE.test(f))
    : [];

  try {
    const counties = filterDemographics({
      search: search || undefined,
      fips:   fips.length > 0 ? fips : undefined,
    });
    return NextResponse.json({ counties, total: counties.length });
  } catch (err) {
    return apiErrorFromUnknown(err, "Failed to fetch demographics data");
  }
}
