/**
 * API utility service for Raleigh Police Incidents (ArcGIS FeatureServer)
 * Uses the public Raleigh Daily Police Incidents endpoint.
 *
 * API Docs: https://services.arcgis.com/v400IkDOw1ad7Yad/arcgis/rest/services/Daily_Police_Incidents/FeatureServer/0
 *
 * Privacy: All requests include returnGeometry=false to ensure that precise
 * geographic coordinates are never returned or stored. Only block-level address
 * text (reported_block_address field) is used, which protects individual privacy while still
 * allowing district- and city-level analysis.
 */

import type { ArcGISErrorBody, ArcGISResponse, PoliceIncident } from "@/types";
import { ApiError, ERROR_CODE_UPSTREAM } from "@/lib/api/errors";
import { isValidDateFormat } from "@/lib/validation";
const INCIDENTS_UPSTREAM_ERROR_MESSAGE =
  "Failed to fetch data from the Raleigh incidents service.";

function createIncidentsUpstreamError(): ApiError {
  return new ApiError(INCIDENTS_UPSTREAM_ERROR_MESSAGE, ERROR_CODE_UPSTREAM, 502);
}

export function toDateKey(date: string): number {
  if (!isValidDateFormat(date)) {
    throw new Error(`Invalid date format: "${date}". Expected YYYY-MM-DD.`);
  }

  const [year, month, day] = date.split("-").map(Number);
  return year * 10_000 + month * 100 + day;
}

export function toIncidentDateKey(incident: PoliceIncident): number | null {
  const { reported_year, reported_month, reported_day, reported_date } = incident.attributes;

  if (
    Number.isFinite(reported_year) &&
    Number.isFinite(reported_month) &&
    Number.isFinite(reported_day)
  ) {
    return Number(reported_year) * 10_000 + Number(reported_month) * 100 + Number(reported_day);
  }

  if (!reported_date) {
    return null;
  }

  // Use UTC methods so the decomposed date matches timezone-neutral toDateKey output.
  // local getDate() would shift incidents near UTC midnight to the wrong calendar day
  // in western-hemisphere server environments.
  const date = new Date(reported_date);
  return date.getUTCFullYear() * 10_000 + (date.getUTCMonth() + 1) * 100 + date.getUTCDate();
}

const BASE_URL =
  process.env.NEXT_PUBLIC_RALEIGH_INCIDENTS_API_URL ||
  "https://services.arcgis.com/v400IkDOw1ad7Yad/arcgis/rest/services/Daily_Police_Incidents/FeatureServer/0/query";

/** Default number of records to return when no limit is specified */
const DEFAULT_RESULT_LIMIT = 200;

/**
 * Records requested per HTTP round-trip when paginating through all results.
 * ArcGIS FeatureServer services typically allow up to 1 000–2 000 per request;
 * 1 000 is a safe, broadly-supported value.
 */
const ARCGIS_PAGE_SIZE = 1000;

/**
 * Maximum number of pagination pages allowed per call.
 * Prevents runaway loops if the server misbehaves.
 * At ARCGIS_PAGE_SIZE = 1 000 this caps a single fetchAll call at 50 000 records.
 */
const MAX_PAGES = 50;

export interface FetchIncidentsOptions {
  /** Maximum number of records to return (default: 200). Ignored when fetchAll is true. */
  limit?: number;
  /**
   * When true, fetches every available record by automatically paginating through
   * all exceededTransferLimit responses. The `limit` option is ignored.
   */
  fetchAll?: boolean;
  /** Optional WHERE clause to filter by date, type, district, etc. */
  where?: string;
  /** Comma-separated field names to return (default: *) */
  outFields?: string;
}

/**
 * Fetch police incidents from the Raleigh ArcGIS FeatureServer.
 * Returns an array of PoliceIncident objects (attributes only; geometry is
 * explicitly excluded via returnGeometry=false for privacy).
 *
 * When the server signals exceededTransferLimit the function automatically
 * paginates until all requested records have been retrieved (up to MAX_PAGES
 * round-trips). Pass `fetchAll: true` to bypass the `limit` cap and retrieve
 * every record that matches the WHERE clause.
 */
export async function fetchIncidents(
  options: FetchIncidentsOptions = {}
): Promise<PoliceIncident[]> {
  const {
    limit = DEFAULT_RESULT_LIMIT,
    fetchAll = false,
    where = "1=1",
    outFields = "*",
  } = options;

  const incidents: PoliceIncident[] = [];
  let resultOffset = 0;
  let pages = 0;

  while (fetchAll || incidents.length < limit) {
    pages++;
    if (pages > MAX_PAGES) {
      console.warn(
        `[fetchIncidents] Pagination safety limit reached (${MAX_PAGES} pages). ` +
          `Returning ${incidents.length} records fetched so far.`
      );
      break;
    }

    const pageSize = fetchAll
      ? ARCGIS_PAGE_SIZE
      : Math.min(limit - incidents.length, ARCGIS_PAGE_SIZE);

    if (process.env.NODE_ENV !== "production" && pages === 1) {
      console.info(`[fetchIncidents] ArcGIS WHERE clause: ${where}`);
    }

    const params = new URLSearchParams({
      where,
      outFields,
      returnGeometry: "false",
      resultRecordCount: String(pageSize),
      resultOffset: String(resultOffset),
      orderByFields: "OBJECTID ASC",
      f: "json",
    });

    const url = `${BASE_URL}?${params.toString()}`;

    let res: Response;
    try {
      res = await fetch(url, {
        // Revalidate every 30 minutes in production, no-store in dev
        next: { revalidate: process.env.NODE_ENV === "production" ? 1800 : 0 },
      });
    } catch {
      throw createIncidentsUpstreamError();
    }

    if (!res.ok) {
      throw createIncidentsUpstreamError();
    }

    const data: ArcGISResponse | ArcGISErrorBody = await res.json();

    // ArcGIS services can return HTTP 200 with a JSON error body.
    if ("error" in data) {
      throw createIncidentsUpstreamError();
    }

    if (!data.features) {
      throw createIncidentsUpstreamError();
    }

    incidents.push(...data.features);

    if (!data.exceededTransferLimit) {
      break;
    }

    if (data.features.length === 0) {
      throw createIncidentsUpstreamError();
    }

    if (process.env.NODE_ENV !== "production") {
      console.info(
        `[fetchIncidents] exceededTransferLimit at offset ${resultOffset} (page ${pages}); ` +
          `fetching next page.`
      );
    }

    resultOffset += data.features.length;
  }

  // Cap results at limit when not fetching all records.
  // Only slice when the array actually exceeds the limit (avoids an unnecessary copy).
  return fetchAll ? incidents : incidents.length > limit ? incidents.slice(0, limit) : incidents;
}

/**
 * Returns a sorted, deduplicated list of crime types from an array of incidents.
 */
export function extractCrimeTypes(incidents: PoliceIncident[]): string[] {
  const types = new Set<string>();
  for (const incident of incidents) {
    const type = incident.attributes.crime_type?.trim();
    if (type) types.add(type);
  }
  return Array.from(types).sort();
}

/**
 * Returns a sorted, deduplicated list of police districts from an array of incidents.
 */
export function extractDistricts(incidents: PoliceIncident[]): string[] {
  const districts = new Set<string>();
  for (const incident of incidents) {
    const district = incident.attributes.district?.trim();
    if (district) districts.add(district);
  }
  return Array.from(districts).sort();
}

export interface IncidentQueryFilters {
  crimeType?: string;
  district?: string;
  dateFrom?: string;
  dateTo?: string;
  /** Free-text keyword applied across reported_block_address, crime_type, case_number, crime_category, district */
  searchQuery?: string;
}

/**
 * Filters incidents using ArcGIS numeric date part fields.
 * Falls back to reported_date when date parts are unavailable.
 */
export function filterIncidentsByDateParts(
  incidents: PoliceIncident[],
  dateFrom?: string,
  dateTo?: string
): PoliceIncident[] {
  const fromKey = dateFrom ? toDateKey(dateFrom) : null;
  const toKey = dateTo ? toDateKey(dateTo) : null;

  if (fromKey == null && toKey == null) {
    return incidents;
  }

  return incidents.filter((incident) => {
    const incidentKey = toIncidentDateKey(incident);
    if (incidentKey == null) {
      return false;
    }
    if (fromKey != null && incidentKey < fromKey) {
      return false;
    }
    if (toKey != null && incidentKey > toKey) {
      return false;
    }
    return true;
  });
}

/**
 * Builds an ArcGIS SQL WHERE clause from UI filter values.
 * Returns "1=1" (match everything) when no filters are active.
 *
 * Single quotes inside user-supplied strings are escaped by doubling them,
 * which is the standard SQL escaping approach supported by the ArcGIS REST API.
 */
export function buildWhereClause(filters: IncidentQueryFilters): string {
  const parts: string[] = [];

  if (filters.crimeType) {
    const safe = filters.crimeType.replace(/'/g, "''");
    parts.push(`crime_type = '${safe}'`);
  }

  if (filters.district) {
    const safe = filters.district.replace(/'/g, "''");
    parts.push(`district = '${safe}'`);
  }

  if (filters.searchQuery) {
    const q = filters.searchQuery.replace(/'/g, "''");
    const likeExpr = [
      `reported_block_address LIKE '%${q}%'`,
      `crime_type LIKE '%${q}%'`,
      `case_number LIKE '%${q}%'`,
      `crime_category LIKE '%${q}%'`,
      `district LIKE '%${q}%'`,
    ].join(" OR ");
    parts.push(`(${likeExpr})`);
  }

  // Filter on the always-populated reported_date epoch-ms field rather than the
  // reported_year/month/day integer fields, which are NULL for many ArcGIS records.
  // UTC boundaries ensure alignment with how ArcGIS stores the timestamp.
  if (filters.dateFrom) {
    const [y, m, d] = filters.dateFrom.split("-").map(Number);
    parts.push(`reported_date >= ${Date.UTC(y, m - 1, d, 0, 0, 0, 0)}`);
  }

  if (filters.dateTo) {
    const [y, m, d] = filters.dateTo.split("-").map(Number);
    parts.push(`reported_date <= ${Date.UTC(y, m - 1, d, 23, 59, 59, 999)}`);
  }

  return parts.length > 0 ? parts.join(" AND ") : "1=1";
}

/**
 * Fetches all distinct non-null values for a single ArcGIS field.
 * Returns a sorted array of strings suitable for populating filter dropdowns.
 */
export async function fetchDistinctValues(field: string): Promise<string[]> {
  const params = new URLSearchParams({
    where: "1=1",
    outFields: field,
    returnDistinctValues: "true",
    returnGeometry: "false",
    orderByFields: field,
    resultRecordCount: "2000",
    f: "json",
  });

  const url = `${BASE_URL}?${params.toString()}`;

  let res: Response;
  try {
    res = await fetch(url, {
      next: { revalidate: process.env.NODE_ENV === "production" ? 3600 : 0 },
    });
  } catch {
    throw createIncidentsUpstreamError();
  }

  if (!res.ok) {
    throw createIncidentsUpstreamError();
  }

  const data: ArcGISResponse | ArcGISErrorBody = await res.json();

  if ("error" in data) {
    throw createIncidentsUpstreamError();
  }

  if (!data.features) {
    throw createIncidentsUpstreamError();
  }

  return data.features
    .map((f) => {
      const value = f.attributes[field as keyof typeof f.attributes];

      if (value == null) {
        return "";
      }

      return typeof value === "string" ? value.trim() : String(value).trim();
    })
    .filter((value) => value && value !== "NULL")
    .sort();
}
