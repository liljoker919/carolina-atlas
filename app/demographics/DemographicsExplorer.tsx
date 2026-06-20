"use client";

/**
 * DemographicsExplorer — NC Demographics Dashboard.
 *
 * Loads all 100 NC county records from /api/demographics on mount.
 * County list is filtered client-side (no re-fetch needed for a 100-row dataset).
 * Clicking a county row selects it and opens a detail panel with 5 category tabs:
 * Population, Economics, Housing, Education, and Race / Ethnicity.
 *
 * selectedFips is modelled as an array to support future county-comparison features.
 */

import { useState, useEffect, useRef } from "react";
import type { CountyDemographics } from "@/types/demographics";
import DemographicsSummaryCards from "@/components/dashboard/DemographicsSummaryCards";
import StatCard from "@/components/dashboard/StatCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorMessage from "@/components/ui/ErrorMessage";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";

// ── Shared Tailwind class for every filter/search control ────────────────────
const INPUT_CLS =
  "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm " +
  "focus:outline-none focus:ring-2 focus:ring-[#4B9CD3] focus:border-transparent";

// ── Tab definitions ──────────────────────────────────────────────────────────

type TabKey = "population" | "economics" | "housing" | "education" | "race";

const TABS: { key: TabKey; label: string }[] = [
  { key: "population", label: "Population" },
  { key: "economics",  label: "Economics" },
  { key: "housing",    label: "Housing" },
  { key: "education",  label: "Education" },
  { key: "race",       label: "Race / Ethnicity" },
];

// ── API response type ────────────────────────────────────────────────────────

interface DemographicsResponse {
  counties: CountyDemographics[];
  total:    number;
}

// ── Formatting helpers ────────────────────────────────────────────────────────

function fmtNum(n: number | null | undefined): string {
  if (n == null) return "—";
  return n.toLocaleString();
}

function fmtPct(n: number | null | undefined): string {
  if (n == null) return "—";
  return `${n.toFixed(1)}%`;
}

function fmtUSD(n: number | null | undefined): string {
  if (n == null) return "—";
  return `$${n.toLocaleString()}`;
}

// ── Race / Ethnicity bar row ──────────────────────────────────────────────────

function RaceBar({ label, value }: { label: string; value: number | null }) {
  const pct = value ?? 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-48 text-sm text-gray-600 flex-shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2.5">
        <div
          className="bg-[#4B9CD3] h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <span className="w-12 text-sm font-semibold text-[#123047] text-right">
        {fmtPct(value)}
      </span>
    </div>
  );
}

// ── Tab content sub-components ────────────────────────────────────────────────

function PopulationTab({ county }: { county: CountyDemographics }) {
  const { population } = county;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Total Population"
        value={fmtNum(population.total)}
        trend="residents"
        trendUp={true}
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        }
      />
      <StatCard
        label="Median Age"
        value={population.median_age}
        trend="years"
        trendUp={true}
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        }
      />
      <StatCard
        label="Under 18"
        value={fmtPct(population.under18_pct)}
        trend="of total population"
        trendUp={true}
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        }
      />
      <StatCard
        label="65 and Over"
        value={fmtPct(population.over65_pct)}
        trend="of total population"
        trendUp={true}
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        }
      />
    </div>
  );
}

function EconomicsTab({ county }: { county: CountyDemographics }) {
  const { economics } = county;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <StatCard
        label="Median Household Income"
        value={fmtUSD(economics.median_household_income)}
        trend="annual"
        trendUp={(economics.median_household_income ?? 0) >= 50000}
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />
      <StatCard
        label="Poverty Rate"
        value={fmtPct(economics.poverty_pct)}
        trend="below poverty line"
        trendUp={economics.poverty_pct < 15}
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
          </svg>
        }
      />
      <StatCard
        label="Unemployment Rate"
        value={fmtPct(economics.unemployment_pct)}
        trend="civilian labor force"
        trendUp={economics.unemployment_pct < 5}
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        }
      />
    </div>
  );
}

function HousingTab({ county }: { county: CountyDemographics }) {
  const { housing } = county;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Median Home Value"
        value={fmtUSD(housing.median_home_value)}
        trend="owner-occupied"
        trendUp={true}
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        }
      />
      <StatCard
        label="Median Gross Rent"
        value={fmtUSD(housing.median_gross_rent)}
        trend="monthly"
        trendUp={true}
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        }
      />
      <StatCard
        label="Owner Occupied"
        value={fmtPct(housing.owner_occupied_pct)}
        trend="of housing units"
        trendUp={housing.owner_occupied_pct >= 60}
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        }
      />
      <StatCard
        label="Renter Occupied"
        value={fmtPct(housing.renter_occupied_pct)}
        trend="of housing units"
        trendUp={housing.renter_occupied_pct < 40}
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        }
      />
    </div>
  );
}

function EducationTab({ county }: { county: CountyDemographics }) {
  const { education } = county;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
      <StatCard
        label="HS Diploma or Higher"
        value={fmtPct(education.hs_or_higher_pct)}
        trend="adults 25 and older"
        trendUp={education.hs_or_higher_pct >= 85}
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 14l9-5-9-5-9 5 9 5z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
          </svg>
        }
      />
      <StatCard
        label="Bachelor's or Higher"
        value={fmtPct(education.bachelors_or_higher_pct)}
        trend="adults 25 and older"
        trendUp={education.bachelors_or_higher_pct >= 30}
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />
    </div>
  );
}

function RaceTab({ county }: { county: CountyDemographics }) {
  const { race } = county;
  const rows = [
    { label: "White alone",                    value: race.white_pct },
    { label: "Black or African American",      value: race.black_pct },
    { label: "Hispanic or Latino",             value: race.hispanic_pct },
    { label: "Asian",                          value: race.asian_pct },
    { label: "Two or more races",              value: race.multiracial_pct },
    { label: "Some other race",                value: race.other_pct },
    { label: "Am. Indian / Alaska Native",     value: race.aian_pct },
    { label: "Native Hawaiian / Pac. Islander", value: race.nhpi_pct },
  ].sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

  return (
    <div className="bg-[#F5F7FA] rounded-xl p-6">
      <p className="text-xs text-gray-400 mb-5">
        Hispanic / Latino is an ethnicity category that may overlap with any racial group.
        Percentages are calculated from total population.
      </p>
      <div className="space-y-4">
        {rows.map(({ label, value }) => (
          <RaceBar key={label} label={label} value={value} />
        ))}
      </div>
    </div>
  );
}

// ── County results table ──────────────────────────────────────────────────────

interface CountyTableProps {
  counties: CountyDemographics[];
  selectedFips: string[];
  onSelect: (fips: string) => void;
  onClearSearch: () => void;
  hasSearch: boolean;
}

function CountyTable({ counties, selectedFips, onSelect, onClearSearch, hasSearch }: CountyTableProps) {
  if (counties.length === 0) {
    return (
      <EmptyState
        title="No counties found"
        description="No counties match your search. Try a different spelling or clear the search."
        actionLabel={hasSearch ? "Clear search" : undefined}
        onAction={hasSearch ? onClearSearch : undefined}
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-sm">
      <table className="min-w-full divide-y divide-gray-100 bg-white text-sm">
        <thead className="bg-[#F5F7FA]">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              County
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Population
            </th>
            <th className="hidden sm:table-cell px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Median Income
            </th>
            <th className="hidden sm:table-cell px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Poverty Rate
            </th>
            <th className="hidden md:table-cell px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
              HS Grad %
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {counties.map((c) => {
            const isSelected = selectedFips.includes(c.fips);
            return (
              <tr
                key={c.fips}
                onClick={() => onSelect(c.fips)}
                className={`cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-[#EAF2FB]"
                    : "hover:bg-[#F5F7FA]"
                }`}
              >
                <td className="px-4 py-3 font-medium text-[#123047]">
                  <span className="flex items-center gap-2">
                    {isSelected && (
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#4B9CD3] flex-shrink-0" />
                    )}
                    {c.county} County
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-gray-700">
                  {fmtNum(c.population.total)}
                </td>
                <td className="hidden sm:table-cell px-4 py-3 text-right text-gray-700">
                  {fmtUSD(c.economics.median_household_income)}
                </td>
                <td className="hidden sm:table-cell px-4 py-3 text-right text-gray-700">
                  {fmtPct(c.economics.poverty_pct)}
                </td>
                <td className="hidden md:table-cell px-4 py-3 text-right text-gray-700">
                  {fmtPct(c.education.hs_or_higher_pct)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function DemographicsExplorer() {
  // ── Data state ─────────────────────────────────────────────────────────
  const [allCounties, setAllCounties]   = useState<CountyDemographics[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);

  // ── UI state ───────────────────────────────────────────────────────────
  const [search, setSearch]             = useState("");
  const [selectedFips, setSelectedFips] = useState<string[]>([]);
  const [activeTab, setActiveTab]       = useState<TabKey>("population");
  const [retryCount, setRetryCount]     = useState(0);

  const detailRef = useRef<HTMLDivElement>(null);

  // ── Fetch all counties once on mount (and on retry) ───────────────────
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/demographics");
        if (!res.ok) {
          const body = await res.json().catch(
            () => ({} as { error?: { message?: string } })
          ) as { error?: { message?: string } };
          throw new Error(body.error?.message ?? `Server error: ${res.status}`);
        }
        const data = await res.json() as DemographicsResponse;
        if (!cancelled) setAllCounties(data.counties ?? []);
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to load demographics data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [retryCount]);

  // ── Scroll detail panel into view when a county is selected ──────────
  useEffect(() => {
    if (selectedFips.length > 0) {
      detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedFips]);

  // ── Client-side county filter (instant — no re-fetch for 100 rows) ───
  const filteredCounties = search.trim()
    ? allCounties.filter((c) =>
        c.county.toLowerCase().includes(search.trim().toLowerCase())
      )
    : allCounties;

  // ── Selected county detail ─────────────────────────────────────────────
  const selectedCounty =
    selectedFips.length === 1
      ? (allCounties.find((c) => c.fips === selectedFips[0]) ?? null)
      : null;

  // ── Handlers ──────────────────────────────────────────────────────────
  const handleCountySelect = (fips: string) => {
    setSelectedFips((prev) => prev.includes(fips) ? [] : [fips]);
    setActiveTab("population");
  };

  const handleClearSelection = () => setSelectedFips([]);
  const handleClearSearch    = () => setSearch("");
  const handleRetry          = () => setRetryCount((n) => n + 1);

  return (
    <div>
      <PageHeader
        badge="ACS 2023"
        title="NC Demographics"
        subtitle="Population, economics, housing, education, and race data for all 100 North Carolina counties. Source: US Census Bureau American Community Survey 5-Year Estimates."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* ── Summary Cards ─────────────────────────────────────────────── */}
        <section>
          <h2 className="text-lg font-semibold text-[#123047] mb-3">
            {selectedCounty ? `${selectedCounty.county} County` : "North Carolina Overview"}
          </h2>
          {error ? (
            <ErrorMessage message={error} />
          ) : (
            <DemographicsSummaryCards
              counties={allCounties}
              selectedCounty={selectedCounty}
              loading={loading}
            />
          )}
        </section>

        {/* ── Search & Select ────────────────────────────────────────────── */}
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#123047]">
              Search &amp; Select County
            </h2>
            {selectedCounty && (
              <button
                onClick={handleClearSelection}
                className="text-sm text-[#4B9CD3] hover:text-[#123047] transition-colors"
              >
                Clear selection
              </button>
            )}
          </div>

          <div className="max-w-sm">
            <label className="block text-xs font-medium text-gray-500 mb-1" htmlFor="county-search">
              County name
            </label>
            <input
              id="county-search"
              type="text"
              placeholder="Search all 100 NC counties…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={INPUT_CLS}
            />
          </div>

          {selectedCounty && (
            <p className="mt-3 text-sm text-[#4B9CD3]">
              Viewing:{" "}
              <strong className="text-[#123047]">{selectedCounty.county} County</strong>
              {" "}— click the highlighted row again or use{" "}
              <button
                onClick={handleClearSelection}
                className="underline hover:text-[#123047] transition-colors"
              >
                Clear selection
              </button>
              {" "}to deselect.
            </p>
          )}
        </section>

        {/* ── County Table ──────────────────────────────────────────────── */}
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-[#123047]">Counties</h2>
            {!loading && !error && (
              <p className="text-sm text-gray-500">
                <span className="font-medium text-[#123047]">{filteredCounties.length}</span>
                {filteredCounties.length === 1 ? " county" : " counties"}
                {search.trim() ? " matching search" : " — click a row to explore"}
              </p>
            )}
          </div>

          {loading && <LoadingSpinner label="Loading county data…" />}

          {error && !loading && (
            <ErrorMessage
              title="Failed to load demographics"
              message={error}
              onRetry={handleRetry}
            />
          )}

          {!loading && !error && (
            <CountyTable
              counties={filteredCounties}
              selectedFips={selectedFips}
              onSelect={handleCountySelect}
              onClearSearch={handleClearSearch}
              hasSearch={search.trim().length > 0}
            />
          )}
        </section>

        {/* ── County Detail Panel ───────────────────────────────────────── */}
        {selectedCounty && (
          <section
            ref={detailRef}
            className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
          >
            {/* Detail header */}
            <div className="bg-[#123047] text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">{selectedCounty.county} County</h2>
                <p className="text-blue-200 text-sm mt-0.5">
                  Population: {fmtNum(selectedCounty.population.total)}
                  {" · "}ACS {selectedCounty.year} 5-Year Estimates
                </p>
              </div>
              <button
                onClick={handleClearSelection}
                className="text-blue-300 hover:text-white transition-colors text-sm font-medium"
                aria-label="Close county detail panel"
              >
                ✕ Close
              </button>
            </div>

            {/* Tab bar */}
            <div className="border-b border-gray-100 px-6 overflow-x-auto">
              <div className="flex -mb-px min-w-max">
                {TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                      activeTab === tab.key
                        ? "border-[#4B9CD3] text-[#4B9CD3]"
                        : "border-transparent text-gray-500 hover:text-[#123047] hover:border-gray-200"
                    }`}
                    aria-pressed={activeTab === tab.key}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab content */}
            <div className="p-6">
              {activeTab === "population" && <PopulationTab county={selectedCounty} />}
              {activeTab === "economics"  && <EconomicsTab  county={selectedCounty} />}
              {activeTab === "housing"    && <HousingTab    county={selectedCounty} />}
              {activeTab === "education"  && <EducationTab  county={selectedCounty} />}
              {activeTab === "race"       && <RaceTab       county={selectedCounty} />}
            </div>
          </section>
        )}

        {/* ── Data note ─────────────────────────────────────────────────── */}
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
          <strong>Data note:</strong> Demographics data is sourced from the{" "}
          <a
            href="https://www.census.gov/programs-surveys/acs"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-blue-900"
          >
            US Census Bureau American Community Survey
          </a>{" "}
          2023 5-Year Estimates (2019–2023). Values reflect county-level estimates;
          suppressed values are shown as —. Hispanic / Latino is an ethnicity category
          that may overlap with any racial group.
        </div>

      </div>
    </div>
  );
}
