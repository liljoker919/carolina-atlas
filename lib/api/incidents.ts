/**
 * API utility service for Raleigh Police Incidents (ArcGIS FeatureServer)
 * Uses the public Raleigh Daily Police Incidents endpoint.
 *
 * API Docs: https://services.arcgis.com/v400IkDOw1ad7Yad/arcgis/rest/services/Daily_Police_Incidents/FeatureServer/0
 */

import type { ArcGISResponse, PoliceIncident } from "@/types";

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
  /** Spatial reference for coordinates (default: 4326 = WGS84) */
  outSR?: number;
}

/**
 * Fetch police incidents from the Raleigh ArcGIS FeatureServer.
 * Returns an array of PoliceIncident objects (attributes + optional geometry).
 */
export async function fetchIncidents(
  options: FetchIncidentsOptions = {}
): Promise<PoliceIncident[]> {
  const {
    limit = DEFAULT_RESULT_LIMIT,
    where = "1=1",
    outFields = "*",
    outSR = 4326,
  } = options;

  const params = new URLSearchParams({
    where,
    outFields,
    outSR: String(outSR),
    resultRecordCount: String(limit),
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

  const data: ArcGISResponse = await res.json();

  if (!data.features) {
    throw new Error("Unexpected API response: no features field");
  }

  return data.features;
}

/**
 * Fetch incidents with a date range filter.
 * Dates should be ISO date strings like "2024-01-01".
 */
export async function fetchIncidentsByDateRange(
  dateFrom: string,
  dateTo: string,
  limit?: number
): Promise<PoliceIncident[]> {
  // ArcGIS timestamp filter uses epoch milliseconds
  const fromMs = new Date(dateFrom).getTime();
  const MS_PER_DAY = 86_400_000;
  const toMs = new Date(dateTo).getTime() + MS_PER_DAY; // include full last day
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
