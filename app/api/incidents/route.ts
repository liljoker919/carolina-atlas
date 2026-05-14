/**
 * GET /api/incidents
 *
 * Server-side proxy for Raleigh Police Incidents with filter support.
 * Converts UI filter parameters into an ArcGIS SQL WHERE clause and
 * fetches only the matching records from the upstream FeatureServer.
 *
 * Query parameters:
 *   crimeType   — exact CRIME_TYPE match
 *   district    — exact DISTRICT match
 *   dateFrom    — inclusive start date (YYYY-MM-DD)
 *   dateTo      — inclusive end date   (YYYY-MM-DD)
 *   searchQuery — free-text search across location, crime type, case #, etc.
 *   limit       — max records to return (default 500, max 2000)
 */

import { NextRequest, NextResponse } from "next/server";
import { buildWhereClause, fetchIncidents } from "@/lib/api/incidents";

const DEFAULT_LIMIT = 500;
const MAX_LIMIT = 2000;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const crimeType   = searchParams.get("crimeType")   ?? "";
  const district    = searchParams.get("district")    ?? "";
  const dateFrom    = searchParams.get("dateFrom")    ?? "";
  const dateTo      = searchParams.get("dateTo")      ?? "";
  const searchQuery = searchParams.get("searchQuery") ?? "";

  const rawLimit = parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10);
  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(rawLimit, 1), MAX_LIMIT)
    : DEFAULT_LIMIT;

  const where = buildWhereClause({ crimeType, district, dateFrom, dateTo, searchQuery });

  try {
    const incidents = await fetchIncidents({ where, limit });
    return NextResponse.json(incidents);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch incidents";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
