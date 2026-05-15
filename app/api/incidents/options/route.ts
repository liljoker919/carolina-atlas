/**
 * GET /api/incidents/options
 *
 * Returns distinct CRIME_TYPE and DISTRICT values from the Raleigh ArcGIS
 * FeatureServer for populating Crime Explorer filter dropdowns.
 *
 * Response shape: { crimeTypes: string[], districts: string[] }
 */

import { NextResponse } from "next/server";
import { fetchDistinctValues } from "@/lib/api/incidents";
import { apiErrorFromUnknown } from "@/lib/api/errors";

export async function GET() {
  try {
    const [crimeTypes, districts] = await Promise.all([
      fetchDistinctValues("CRIME_TYPE"),
      fetchDistinctValues("DISTRICT"),
    ]);
    return NextResponse.json({ crimeTypes, districts });
  } catch (err) {
    return apiErrorFromUnknown(err, "Failed to fetch filter options");
  }
}
