"use client";

/**
 * CrimeExplorer — Crime Explorer for Raleigh Police Incidents.
 *
 * Fetches filtered data from the /api/incidents server-side route.
 * Filtering (crime type, district, date range, free-text search) is applied
 * server-side via ArcGIS WHERE clauses — only matching records are sent to
 * the client. The free-text search is debounced to avoid excess round-trips.
 *
 * Dropdown options (crime types, districts) are loaded once from
 * /api/incidents/options and remain stable across filter changes.
 *
 * Toggle between card and table views.
 * Includes placeholders for future map and chart integrations.
 */

import { useState, useEffect } from "react";
import type { PoliceIncident, IncidentFilters } from "@/types";
import IncidentCard from "@/components/dashboard/IncidentCard";
import IncidentTable from "@/components/dashboard/IncidentTable";
import IncidentSummaryCards from "@/components/dashboard/IncidentSummaryCards";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorMessage from "@/components/ui/ErrorMessage";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import ComingSoon from "@/components/ui/ComingSoon";

// ── Shared Tailwind utility for every filter control ────────────────────────
const INPUT_CLS =
  "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm " +
  "focus:outline-none focus:ring-2 focus:ring-[#4B9CD3] focus:border-transparent";

// ── Local filter-control components ─────────────────────────────────────────

interface FilterSelectProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
}

function FilterSelect({ id, label, value, onChange, options, placeholder }: FilterSelectProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1" htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={INPUT_CLS}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

interface FilterDateInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function FilterDateInput({ id, label, value, onChange }: FilterDateInputProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={INPUT_CLS}
      />
    </div>
  );
}

// ── Constants ────────────────────────────────────────────────────────────────

const EMPTY_FILTERS: IncidentFilters = {
  searchQuery: "",
  crimeType: "",
  district: "",
  dateFrom: "",
  dateTo: "",
};

/** Delay (ms) before a free-text search triggers a server fetch. */
const SEARCH_DEBOUNCE_MS = 400;

export default function CrimeExplorer() {
  // ── Data state ──────────────────────────────────────────────────────────
  const [incidents, setIncidents] = useState<PoliceIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Options state (crime types / districts for dropdowns) ───────────────
  const [crimeTypes, setCrimeTypes] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);

  // ── UI state ────────────────────────────────────────────────────────────
  const [filters, setFilters] = useState<IncidentFilters>(EMPTY_FILTERS);
  const [viewMode, setViewMode] = useState<"cards" | "table">("table");

  // Debounced search — only used for the server fetch; the input reflects `filters.searchQuery` immediately.
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Tracks whether the *completed* fetch was driven by active filters.
  // Used for the result count label so it always describes the data that is
  // currently displayed, not the filter state the user may be mid-editing.
  const [fetchedWithFilters, setFetchedWithFilters] = useState(false);

  // Retry counter — incrementing triggers a re-fetch
  const [retryCount, setRetryCount] = useState(0);

  // ── Debounce free-text search ────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedSearch(filters.searchQuery),
      SEARCH_DEBOUNCE_MS
    );
    return () => clearTimeout(timer);
  }, [filters.searchQuery]);

  // ── Load dropdown options once on mount ──────────────────────────────────
  useEffect(() => {
    async function loadOptions() {
      try {
        const res = await fetch("/api/incidents/options");
        if (!res.ok) return; // non-fatal — dropdowns will be empty
        const data = await res.json() as { crimeTypes: string[]; districts: string[] };
        setCrimeTypes(data.crimeTypes ?? []);
        setDistricts(data.districts ?? []);
      } catch {
        // non-fatal — dropdowns will be empty
      }
    }
    loadOptions();
  }, []);

  // ── Fetch incidents from server whenever effective filters change ─────────
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (filters.crimeType) params.set("crimeType",   filters.crimeType);
        if (filters.district)  params.set("district",    filters.district);
        if (filters.dateFrom)  params.set("dateFrom",    filters.dateFrom);
        if (filters.dateTo)    params.set("dateTo",      filters.dateTo);
        if (debouncedSearch)   params.set("searchQuery", debouncedSearch);

        const res = await fetch(`/api/incidents?${params.toString()}`);
        if (!res.ok) {
          const body = await res.json().catch((parseErr: unknown) => {
            console.error("[CrimeExplorer] Failed to parse error response:", parseErr);
            return {} as { error?: { message?: string } };
          }) as { error?: { message?: string } };
          throw new Error(body.error?.message ?? `Server error: ${res.status}`);
        }
        const data = await res.json() as PoliceIncident[];
        if (!cancelled) {
          setIncidents(data);
          // Record whether the completed fetch used any active filter so the
          // count label always matches the data that is actually shown.
          setFetchedWithFilters(
            Boolean(
              filters.crimeType ||
              filters.district  ||
              filters.dateFrom  ||
              filters.dateTo    ||
              debouncedSearch
            )
          );
        }
      } catch (err) {
        if (!cancelled)
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load incident data. Please try again."
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [
    filters.crimeType,
    filters.district,
    filters.dateFrom,
    filters.dateTo,
    debouncedSearch,
    retryCount,
  ]);

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleFilterChange = (key: keyof IncidentFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => setFilters(EMPTY_FILTERS);

  const handleRetry = () => setRetryCount((n) => n + 1);

  // Used exclusively to control "Clear all filters" button visibility —
  // updates instantly on keystroke so the button appears without waiting for
  // the debounce to fire.
  const hasActiveFilters = Object.values(filters).some(Boolean);

  return (
    <div>
      <PageHeader
        badge="Live Data"
        title="Raleigh Crime Explorer"
        subtitle="Browse daily police incident data from the Raleigh Police Department. Data is fetched live from the city's public ArcGIS service."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* ── Summary Cards ───────────────────────────────────────────── */}
        <section>
          <h2 className="text-lg font-semibold text-[#123047] mb-3">
            Summary
          </h2>
          {error ? (
            <ErrorMessage message={error} />
          ) : (
            <IncidentSummaryCards incidents={incidents} loading={loading} />
          )}
        </section>

        {/* ── Geographic View ──────────────────────────────────────────── */}
        <section>
          <ComingSoon
            title="Geographic View"
            description="An interactive map will visualize incidents by district and location. Coming in a future release."
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            }
          />
        </section>

        {/* ── Filters ─────────────────────────────────────────────────── */}
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#123047]">
              Search &amp; Filter
            </h2>
            {hasActiveFilters && (
              <button
                onClick={handleReset}
                className="text-sm text-[#4B9CD3] hover:text-[#123047] transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Search */}
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-xs font-medium text-gray-500 mb-1" htmlFor="search">
                Search
              </label>
              <input
                id="search"
                type="text"
                placeholder="Location, crime type, case #…"
                value={filters.searchQuery}
                onChange={(e) => handleFilterChange("searchQuery", e.target.value)}
                className={INPUT_CLS}
              />
            </div>

            <FilterSelect
              id="crime-type"
              label="Crime Type"
              value={filters.crimeType}
              onChange={(v) => handleFilterChange("crimeType", v)}
              options={crimeTypes}
              placeholder="All types"
            />

            <FilterSelect
              id="district"
              label="District"
              value={filters.district}
              onChange={(v) => handleFilterChange("district", v)}
              options={districts}
              placeholder="All districts"
            />

            <FilterDateInput
              id="date-from"
              label="Date From"
              value={filters.dateFrom}
              onChange={(v) => handleFilterChange("dateFrom", v)}
            />

            <FilterDateInput
              id="date-to"
              label="Date To"
              value={filters.dateTo}
              onChange={(v) => handleFilterChange("dateTo", v)}
            />
          </div>
        </section>

        {/* ── Analytics ───────────────────────────────────────────────── */}
        <section>
          <ComingSoon
            title="Analytics"
            description="Charts and trend analysis for incidents by crime type and district will be available in a future release."
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          />
        </section>

        {/* ── Results ─────────────────────────────────────────────────── */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-[#123047]">
                Incidents
              </h2>
              {!loading && !error && (
                <p className="text-sm text-gray-500">
                  {fetchedWithFilters ? (
                    <>
                      <span className="font-medium text-[#123047]">
                        {incidents.length}
                      </span>{" "}
                      matching incidents
                    </>
                  ) : (
                    <>
                      Showing{" "}
                      <span className="font-medium text-[#123047]">
                        {incidents.length}
                      </span>{" "}
                      incidents
                    </>
                  )}
                </p>
              )}
            </div>

            {/* View toggle */}
            <div className="flex rounded-lg border border-gray-200 overflow-hidden self-start">
              <button
                onClick={() => setViewMode("table")}
                className={`px-4 py-2 text-xs font-medium transition-colors ${
                  viewMode === "table"
                    ? "bg-[#123047] text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
                aria-pressed={viewMode === "table"}
              >
                Table
              </button>
              <button
                onClick={() => setViewMode("cards")}
                className={`px-4 py-2 text-xs font-medium transition-colors ${
                  viewMode === "cards"
                    ? "bg-[#123047] text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
                aria-pressed={viewMode === "cards"}
              >
                Cards
              </button>
            </div>
          </div>

          {loading && <LoadingSpinner label="Fetching incident data from Raleigh PD…" />}

          {error && !loading && (
            <ErrorMessage
              title="Failed to load incidents"
              message={error}
              onRetry={handleRetry}
            />
          )}

          {!loading && !error && viewMode === "table" && (
            <IncidentTable incidents={incidents} onReset={handleReset} />
          )}

          {!loading && !error && viewMode === "cards" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {incidents.length === 0 ? (
                <div className="col-span-full">
                  <EmptyState
                    title="No incidents found"
                    description="No incidents match your current filters. Try adjusting or clearing your search."
                    actionLabel={hasActiveFilters ? "Clear filters" : undefined}
                    onAction={hasActiveFilters ? handleReset : undefined}
                  />
                </div>
              ) : (
                incidents.map((incident, idx) => (
                  <IncidentCard
                    key={incident.attributes.OBJECTID ?? idx}
                    incident={incident}
                  />
                ))
              )}
            </div>
          )}
        </section>

        {/* ── Data transparency note ───────────────────────────────────── */}
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
          <strong>Data note:</strong> This data is sourced directly from the
          Raleigh Police Department via the City of Raleigh&apos;s open data
          ArcGIS service. Only block-level addresses are displayed. No personally
          identifiable information is shown.
        </div>
      </div>
    </div>
  );
}
