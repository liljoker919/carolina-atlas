/**
 * GET /api/incidents/options
 *
 * Returns distinct crime_type and district values from the Raleigh ArcGIS
 * FeatureServer for populating Crime Explorer filter dropdowns.
 *
 * Response shape: { crimeTypes: string[], districts: string[] }
 */

import { NextRequest, NextResponse } from "next/server";
import { fetchDistinctValues } from "@/lib/api/incidents";
import { apiErrorFromUnknown } from "@/lib/api/errors";
import { enforceApiRateLimit } from "@/lib/api/rate-limit";

export async function GET(request: NextRequest) {
  const rateLimitResponse = enforceApiRateLimit(request, "api/incidents/options");
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const [crimeTypes, districts] = await Promise.all([
      fetchDistinctValues("crime_type"),
      fetchDistinctValues("district"),
    ]);
    return NextResponse.json({ crimeTypes, districts });
  } catch (err) {
    return apiErrorFromUnknown(err, "Failed to fetch filter options");
  }
}
