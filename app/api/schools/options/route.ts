/**
 * GET /api/schools/options
 *
 * Returns distinct filter values for the Schools Explorer dropdowns.
 * Data is derived from the static schools.json at startup and cached
 * for one hour since school metadata changes only once per school year.
 *
 * Response shape:
 *   {
 *     districts: Array<{ lea_code: string; name: string }>,
 *     counties:  string[],
 *     categories: Array<{ code: string; label: string }>
 *   }
 */

import { NextRequest, NextResponse } from "next/server";
import { getSchoolOptions } from "@/lib/api/schools";
import { apiErrorFromUnknown } from "@/lib/api/errors";
import { enforceApiRateLimit } from "@/lib/api/rate-limit";

export async function GET(request: NextRequest) {
  const rateLimitResponse = enforceApiRateLimit(request, "api/schools/options");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const options = getSchoolOptions();
    return NextResponse.json(options, {
      headers: { "Cache-Control": "public, max-age=3600, s-maxage=3600" },
    });
  } catch (err) {
    return apiErrorFromUnknown(err, "Failed to fetch school filter options");
  }
}
