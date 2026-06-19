/**
 * IncidentSummaryCards — dashboard summary cards for police incidents.
 * Displays total incidents, most common crime type, district summary,
 * and recent incidents (last 7 days) computed from the current incident list.
 */

import type { PoliceIncident } from "@/types";
import StatCard from "./StatCard";

interface IncidentSummaryCardsProps {
  incidents: PoliceIncident[];
  loading?: boolean;
}

/** ArcGIS null-sentinel strings that should never be surfaced as real values. */
const NULL_SENTINELS = new Set(["NULL", "null", "N/A", "UNKNOWN"]);

/** Returns the most-frequent non-null value in an array, or a fallback string. */
function topValue(values: (string | undefined)[], fallback = "—"): string {
  const counts = new Map<string, number>();
  for (const v of values) {
    const cleaned = v?.trim();
    if (cleaned && !NULL_SENTINELS.has(cleaned)) {
      counts.set(cleaned, (counts.get(cleaned) ?? 0) + 1);
    }
  }
  let best = fallback;
  let max = 0;
  for (const [key, count] of counts) {
    if (count > max) { max = count; best = key; }
  }
  return best;
}

/** Count incidents reported within the last `days` rolling 24-hour periods. */
function countRecent(incidents: PoliceIncident[], days = 7): number {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return incidents.filter(
    (i) => (i.attributes.reported_date ?? 0) >= cutoff
  ).length;
}

export default function IncidentSummaryCards({
  incidents,
  loading = false,
}: IncidentSummaryCardsProps) {
  const total = incidents.length;
  const mostCommonCrime = topValue(incidents.map((i) => i.attributes.crime_type));
  const uniqueDistricts = new Set(
    incidents.map((i) => i.attributes.district).filter(Boolean)
  ).size;
  const recentCount = countRecent(incidents, 7);

  const placeholder = loading ? "—" : undefined;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Incidents */}
      <StatCard
        label="Total Incidents"
        value={placeholder ?? total}
        trend={loading ? undefined : "in current view"}
        trendUp={total > 0}
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        }
      />

      {/* Most Common Crime Type */}
      <StatCard
        label="Top Crime Type"
        value={placeholder ?? mostCommonCrime}
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        }
      />

      {/* District Summary */}
      <StatCard
        label="Districts"
        value={placeholder ?? uniqueDistricts}
        trend={loading ? undefined : "unique districts"}
        trendUp={uniqueDistricts > 0}
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        }
      />

      {/* Recent Incidents (last 7 days) */}
      <StatCard
        label="Last 7 Days"
        value={placeholder ?? recentCount}
        trend={loading ? undefined : "recent incidents"}
        trendUp={recentCount > 0}
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        }
      />
    </div>
  );
}
