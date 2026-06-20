/**
 * DemographicsSummaryCards — 4-card KPI summary for the Demographics Explorer.
 *
 * When a county is selected the cards reflect that county's key stats.
 * When nothing is selected the cards show NC averages computed from all
 * loaded counties, giving a statewide baseline for comparison.
 */

import type { CountyDemographics } from "@/types/demographics";
import StatCard from "./StatCard";

interface DemographicsSummaryCardsProps {
  counties: CountyDemographics[];
  selectedCounty?: CountyDemographics | null;
  loading?: boolean;
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

export default function DemographicsSummaryCards({
  counties,
  selectedCounty,
  loading = false,
}: DemographicsSummaryCardsProps) {
  const placeholder = loading ? "—" : undefined;

  // ── Selected county mode ───────────────────────────────────────────────────
  if (selectedCounty) {
    const { population, economics, education } = selectedCounty;
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Population"
          value={placeholder ?? population.total.toLocaleString()}
          trend={`Median age ${population.median_age}`}
          trendUp={true}
          icon={<PeopleIcon />}
        />
        <StatCard
          label="Median Income"
          value={
            placeholder ??
            (economics.median_household_income != null
              ? `$${economics.median_household_income.toLocaleString()}`
              : "—")
          }
          trend="household / year"
          trendUp={(economics.median_household_income ?? 0) >= 50000}
          icon={<IncomeIcon />}
        />
        <StatCard
          label="Poverty Rate"
          value={placeholder ?? `${economics.poverty_pct.toFixed(1)}%`}
          trend="below poverty line"
          trendUp={economics.poverty_pct < 15}
          icon={<PovertyIcon />}
        />
        <StatCard
          label="HS or Higher"
          value={placeholder ?? `${education.hs_or_higher_pct.toFixed(1)}%`}
          trend="adults 25 and older"
          trendUp={education.hs_or_higher_pct >= 85}
          icon={<EducationIcon />}
        />
      </div>
    );
  }

  // ── NC statewide averages ──────────────────────────────────────────────────
  const incomeValues = counties
    .map((c) => c.economics.median_household_income)
    .filter((v): v is number => v != null);
  const avgIncome  = incomeValues.length > 0 ? Math.round(avg(incomeValues)) : null;
  const avgPoverty = counties.length > 0 ? avg(counties.map((c) => c.economics.poverty_pct)) : null;
  const avgHs      = counties.length > 0 ? avg(counties.map((c) => c.education.hs_or_higher_pct)) : null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="NC Counties"
        value={placeholder ?? counties.length}
        trend="complete state coverage"
        trendUp={true}
        icon={<MapIcon />}
      />
      <StatCard
        label="Avg Median Income"
        value={placeholder ?? (avgIncome != null ? `$${avgIncome.toLocaleString()}` : "—")}
        trend="household / year"
        trendUp={true}
        icon={<IncomeIcon />}
      />
      <StatCard
        label="Avg Poverty Rate"
        value={placeholder ?? (avgPoverty != null ? `${avgPoverty.toFixed(1)}%` : "—")}
        trend="NC county average"
        trendUp={(avgPoverty ?? 100) < 15}
        icon={<PovertyIcon />}
      />
      <StatCard
        label="Avg HS Graduation"
        value={placeholder ?? (avgHs != null ? `${avgHs.toFixed(1)}%` : "—")}
        trend="adults 25 and older"
        trendUp={(avgHs ?? 0) >= 85}
        icon={<EducationIcon />}
      />
    </div>
  );
}

// ── Inline icon components ─────────────────────────────────────────────────

function PeopleIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function IncomeIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function PovertyIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
    </svg>
  );
}

function EducationIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 14l9-5-9-5-9 5 9 5z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
