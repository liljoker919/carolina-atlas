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

import type { ArcGISResponse, PoliceIncident } from "@/types";
import { localDateToMs } from "@/lib/utils";

const BASE_URL =
  process.env.NEXT_PUBLIC_RALEIGH_INCIDENTS_API_URL ||
  "https://services.arcgis.com/v400IkDOw1ad7Yad/arcgis/rest/services/Daily_Police_Incidents/FeatureServer/0/query";

/** Default number of records to fetch per request */
const DEFAULT_RESULT_LIMIT = 200;

export interface FetchIncidentsOptions {
  /** Maximum number of records to return (default: 200) */
  limit?: number;
  /** Optional WHERE clause to filter by date, type, district, etc. */
  where?: string;
  /** Comma-separated field names to return (default: *) */
  outFields?: string;
}

/**
 * Fetch police incidents from the Raleigh ArcGIS FeatureServer.
 * Returns an array of PoliceIncident objects (attributes only; geometry is
 * explicitly excluded via returnGeometry=false for privacy).
 */
export async function fetchIncidents(
  options: FetchIncidentsOptions = {}
): Promise<PoliceIncident[]> {
  const {
    limit = DEFAULT_RESULT_LIMIT,
    where = "1=1",
    outFields = "*",
  } = options;

  const incidents: PoliceIncident[] = [];
  let resultOffset = 0;

  while (incidents.length < limit) {
    const remaining = limit - incidents.length;
    const params = new URLSearchParams({
      where,
      outFields,
      returnGeometry: "false",
      resultRecordCount: String(remaining),
      resultOffset: String(resultOffset),
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

    const data: ArcGISResponse & { exceededTransferLimit?: boolean } =
      await res.json();

    if (!data.features) {
      throw new Error("Unexpected API response: no features field");
    }

    incidents.push(...data.features);

    if (!data.exceededTransferLimit) {
      break;
    }

    if (data.features.length === 0) {
      throw new Error(
        "Unexpected API response: exceededTransferLimit was set but no additional features were returned"
      );
    }

    resultOffset += data.features.length;
  }

  return incidents;
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
