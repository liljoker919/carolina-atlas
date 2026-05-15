/**
 * API utility service for Raleigh Police Incidents (ArcGIS FeatureServer)
 * Uses the public Raleigh Daily Police Incidents endpoint.
 *
 * API Docs: https://services.arcgis.com/v400IkDOw1ad7Yad/arcgis/rest/services/Daily_Police_Incidents/FeatureServer/0
 *
 * Privacy: All requests include returnGeometry=false to ensure that precise
 * geographic coordinates are never returned or stored. Only block-level address
 * text (LOCATION field) is used, which protects individual privacy while still
 * allowing district- and city-level analysis.
 */

import type { ArcGISErrorBody, ArcGISResponse, PoliceIncident } from "@/types";
import { localDateToMs } from "@/lib/utils";

/** Milliseconds in one day — used for inclusive end-of-day date range boundary */
const MS_PER_DAY = 86_400_000;

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

    const res = await fetch(url, {
      // Revalidate every 30 minutes in production, no-store in dev
      next: { revalidate: process.env.NODE_ENV === "production" ? 1800 : 0 },
    });

    if (!res.ok) {
      throw new Error(
        `Failed to fetch incidents: ${res.status} ${res.statusText}`
      );
    }

    const data: ArcGISResponse | ArcGISErrorBody = await res.json();

    // ArcGIS services can return HTTP 200 with a JSON error body.
    if ("error" in data) {
      const { code, message } = data.error;
      throw new Error(`ArcGIS API error ${code}: ${message}`);
    }

    if (!data.features) {
      throw new Error("Unexpected API response: missing features array");
    }

    incidents.push(...data.features);

    if (!data.exceededTransferLimit) {
      break;
    }

    if (data.features.length === 0) {
      throw new Error(
        "Unexpected API response: exceededTransferLimit set but no features returned"
      );
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
 * Fetch incidents with a date range filter.
 * Dates should be ISO date strings like "2024-01-01".
 * Date boundaries are computed using the runtime's local timezone so that
 * "2024-01-15" means midnight–midnight in local time, not UTC.
 */
export async function fetchIncidentsByDateRange(
  dateFrom: string,
  dateTo: string,
  limit?: number
): Promise<PoliceIncident[]> {
  // Parse dates as local-timezone midnight to match user intent
  const fromMs = localDateToMs(dateFrom);
  const MS_PER_DAY = 86_400_000;
  const toMs = localDateToMs(dateTo) + MS_PER_DAY; // include full last day
  const where = `INC_DATETIME >= ${fromMs} AND INC_DATETIME <= ${toMs}`;
  return fetchIncidents({ where, limit });
}

/**
 * Returns a sorted, deduplicated list of crime types from an array of incidents.
 */
export function extractCrimeTypes(incidents: PoliceIncident[]): string[] {
  const types = new Set<string>();
  for (const incident of incidents) {
    const type = incident.attributes.CRIME_TYPE?.trim();
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
    const district = incident.attributes.DISTRICT?.trim();
    if (district) districts.add(district);
  }
  return Array.from(districts).sort();
}

export interface IncidentQueryFilters {
  crimeType?: string;
  district?: string;
  dateFrom?: string;
  dateTo?: string;
  /** Free-text keyword applied across LOCATION, CRIME_TYPE, INC_NO, CRIME_CATEGORY, DISTRICT */
  searchQuery?: string;
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
    parts.push(`CRIME_TYPE = '${safe}'`);
  }

  if (filters.district) {
    const safe = filters.district.replace(/'/g, "''");
    parts.push(`DISTRICT = '${safe}'`);
  }

  if (filters.dateFrom) {
    parts.push(`INC_DATETIME >= ${localDateToMs(filters.dateFrom)}`);
  }

  if (filters.dateTo) {
    parts.push(`INC_DATETIME <= ${localDateToMs(filters.dateTo) + MS_PER_DAY - 1}`);
  }

  if (filters.searchQuery) {
    const q = filters.searchQuery.replace(/'/g, "''");
    const likeExpr = [
      `LOCATION LIKE '%${q}%'`,
      `CRIME_TYPE LIKE '%${q}%'`,
      `INC_NO LIKE '%${q}%'`,
      `CRIME_CATEGORY LIKE '%${q}%'`,
      `DISTRICT LIKE '%${q}%'`,
    ].join(" OR ");
    parts.push(`(${likeExpr})`);
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

  const res = await fetch(url, {
    next: { revalidate: process.env.NODE_ENV === "production" ? 3600 : 0 },
  });

  if (!res.ok) {
    throw new Error(
      `Failed to fetch distinct ${field} values: ${res.status} ${res.statusText}`
    );
  }

  const data: ArcGISResponse | ArcGISErrorBody = await res.json();

  if ("error" in data) {
    const { code, message } = data.error;
    throw new Error(`ArcGIS API error ${code}: ${message}`);
  }

  if (!data.features) {
    throw new Error("Unexpected API response: missing features array");
  }

  return data.features
    .map((f) => {
      const value = f.attributes[field as keyof typeof f.attributes];

      if (value == null) {
        return "";
      }

      return typeof value === "string" ? value.trim() : String(value).trim();
    })
    .filter(Boolean)
    .sort();
}
