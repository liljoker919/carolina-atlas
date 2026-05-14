/**
 * Shared utility functions for Carolina Atlas
 */

import type { PoliceIncident, IncidentFilters } from "@/types";

/** Milliseconds in one day — used for inclusive date range filtering */
const MS_PER_DAY = 86_400_000;

/**
 * Formats an epoch millisecond timestamp to a human-readable date/time string.
 * Returns "N/A" for falsy values.
 */
export function formatDateTime(epochMs: number | undefined | null): string {
  if (!epochMs) return "N/A";
  return new Date(epochMs).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Formats an epoch millisecond timestamp to a date-only string (YYYY-MM-DD).
 * Returns "" for falsy values — useful for <input type="date"> default values.
 */
export function formatDateInput(epochMs: number | undefined | null): string {
  if (!epochMs) return "";
  return new Date(epochMs).toISOString().slice(0, 10);
}

/**
 * Capitalizes the first letter of each word (title case).
 */
export function toTitleCase(str: string | undefined | null): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Applies client-side filters to a list of incidents.
 * Used for filtering the already-fetched dataset.
 */
export function filterIncidents(
  incidents: PoliceIncident[],
  filters: IncidentFilters
): PoliceIncident[] {
  const { searchQuery, crimeType, district, dateFrom, dateTo } = filters;

  const query = searchQuery.toLowerCase().trim();
  const fromMs = dateFrom ? new Date(dateFrom).getTime() : null;
  const toMs = dateTo ? new Date(dateTo).getTime() + MS_PER_DAY : null;

  return incidents.filter((incident) => {
    const attr = incident.attributes;

    // Full-text search across key fields
    if (query) {
      const searchable = [
        attr.LOCATION,
        attr.CRIME_TYPE,
        attr.CRIME_CATEGORY,
        attr.DISTRICT,
        attr.INC_NO,
      ]
        .join(" ")
        .toLowerCase();
      if (!searchable.includes(query)) return false;
    }

    // Crime type filter
    if (crimeType && attr.CRIME_TYPE !== crimeType) return false;

    // District filter
    if (district && attr.DISTRICT !== district) return false;

    // Date range filter
    if (fromMs && attr.INC_DATETIME && attr.INC_DATETIME < fromMs) return false;
    if (toMs && attr.INC_DATETIME && attr.INC_DATETIME > toMs) return false;

    return true;
  });
}

/**
 * Groups an array of incidents by a given attribute key.
 * Returns a Map of key → count.
 */
export function groupIncidentsBy(
  incidents: PoliceIncident[],
  key: keyof typeof incidents[0]["attributes"]
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const incident of incidents) {
    const value = String(incident.attributes[key] ?? "Unknown");
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return counts;
}

/**
 * Returns the top N entries from a Map<string, number> sorted by count (descending).
 */
export function topN(
  map: Map<string, number>,
  n: number
): Array<{ label: string; count: number }> {
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([label, count]) => ({ label, count }));
}

/**
 * Returns a badge color class based on crime category string.
 * Uses a simple heuristic; expand as needed.
 */
export function getCrimeBadgeColor(crimeType: string | undefined): string {
  const type = crimeType?.toUpperCase() ?? "";
  if (type.includes("HOMICIDE") || type.includes("ASSAULT") || type.includes("ROBBERY")) {
    return "bg-red-100 text-red-800";
  }
  if (type.includes("THEFT") || type.includes("BURGLARY") || type.includes("LARCENY")) {
    return "bg-amber-100 text-amber-800";
  }
  if (type.includes("DRUG") || type.includes("NARCOTIC")) {
    return "bg-purple-100 text-purple-800";
  }
  if (type.includes("TRAFFIC") || type.includes("DWI") || type.includes("DUI")) {
    return "bg-blue-100 text-blue-800";
  }
  return "bg-gray-100 text-gray-700";
}
