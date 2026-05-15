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
 *
 * Validation:
 *   • All string params are trimmed; whitespace-only values are treated as absent.
 *   • dateFrom / dateTo must match YYYY-MM-DD and be real calendar dates.
 *   • dateFrom must not be later than dateTo when both are supplied.
 *   • Invalid dates or an inverted range produce HTTP 400.
 */

import { NextRequest, NextResponse } from "next/server";
import { buildWhereClause, fetchIncidents } from "@/lib/api/incidents";
import { isValidDateFormat, sanitizeParam } from "@/lib/utils/validation";

const DEFAULT_LIMIT = 500;
const MAX_LIMIT = 2000;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  // Trim whitespace from all string parameters; whitespace-only → empty string.
  const crimeType   = sanitizeParam(searchParams.get("crimeType")   ?? "");
  const district    = sanitizeParam(searchParams.get("district")    ?? "");
  const dateFrom    = sanitizeParam(searchParams.get("dateFrom")    ?? "");
  const dateTo      = sanitizeParam(searchParams.get("dateTo")      ?? "");
  const searchQuery = sanitizeParam(searchParams.get("searchQuery") ?? "");

  // Validate date formats and reject with HTTP 400 if malformed.
  if (dateFrom && !isValidDateFormat(dateFrom)) {
    return NextResponse.json(
      { error: `Invalid dateFrom: "${dateFrom}". Expected YYYY-MM-DD format.` },
      { status: 400 }
    );
  }

  if (dateTo && !isValidDateFormat(dateTo)) {
    return NextResponse.json(
      { error: `Invalid dateTo: "${dateTo}". Expected YYYY-MM-DD format.` },
      { status: 400 }
    );
  }

  // Validate that the date range is logically ordered.
  if (dateFrom && dateTo && dateFrom > dateTo) {
    return NextResponse.json(
      { error: `dateFrom (${dateFrom}) must not be later than dateTo (${dateTo}).` },
      { status: 400 }
    );
  }

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
