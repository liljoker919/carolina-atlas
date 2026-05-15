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

export async function GET() {
  try {
    const [crimeTypes, districts] = await Promise.all([
      fetchDistinctValues("CRIME_TYPE"),
      fetchDistinctValues("DISTRICT"),
    ]);
    return NextResponse.json({ crimeTypes, districts });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch filter options";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
