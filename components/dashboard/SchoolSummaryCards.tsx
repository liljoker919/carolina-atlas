/**
 * SchoolSummaryCards — dashboard summary cards for the current school view.
 * Computes stats from the visible slice of schools (after API filtering).
 */

import type { School } from "@/types/school";
import StatCard from "./StatCard";

interface SchoolSummaryCardsProps {
  schools: School[];
  total: number;
  loading?: boolean;
}

export default function SchoolSummaryCards({
  schools,
  total,
  loading = false,
}: SchoolSummaryCardsProps) {
  const placeholder = loading ? "—" : undefined;

  // % with A or B grade among schools that have a grade
  const graded = schools.filter((s) => s.spg_grade && !s.spg_masked);
  const abGrade = graded.filter((s) => s.spg_grade === "A" || s.spg_grade === "B").length;
  const abPct = graded.length > 0
    ? Math.round((abGrade / graded.length) * 100)
    : null;

  // Average SPG score
  const scored = schools.filter((s) => s.spg_score != null && !s.spg_masked);
  const avgScore = scored.length > 0
    ? Math.round(scored.reduce((sum, s) => sum + s.spg_score!, 0) / scored.length)
    : null;

  // Average chronic absenteeism
  const withAbsent = schools.filter(
    (s) => s.chronic_absent_pct != null && !s.chronic_absent_masked
  );
  const avgAbsent = withAbsent.length > 0
    ? (withAbsent.reduce((sum, s) => sum + s.chronic_absent_pct!, 0) / withAbsent.length)
        .toFixed(1)
    : null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Schools */}
      <StatCard
        label="Schools"
        value={placeholder ?? total}
        trend={loading ? undefined : "in current view"}
        trendUp={total > 0}
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 14l9-5-9-5-9 5 9 5z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
          </svg>
        }
      />

      {/* A/B Grade % */}
      <StatCard
        label="A or B Grade"
        value={placeholder ?? (abPct != null ? `${abPct}%` : "—")}
        trend={loading ? undefined : (graded.length > 0 ? `of ${graded.length} graded schools` : undefined)}
        trendUp={(abPct ?? 0) >= 50}
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />

      {/* Average SPG Score */}
      <StatCard
        label="Avg SPG Score"
        value={placeholder ?? (avgScore != null ? avgScore : "—")}
        trend={loading ? undefined : (scored.length > 0 ? `out of 100` : undefined)}
        trendUp={(avgScore ?? 0) >= 55}
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        }
      />

      {/* Avg Chronic Absenteeism */}
      <StatCard
        label="Avg Absenteeism"
        value={placeholder ?? (avgAbsent != null ? `${avgAbsent}%` : "—")}
        trend={loading ? undefined : (withAbsent.length > 0 ? "chronically absent" : undefined)}
        trendUp={(parseFloat(avgAbsent ?? "100")) < 15}
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
