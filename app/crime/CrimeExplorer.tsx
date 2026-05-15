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
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorMessage from "@/components/ui/ErrorMessage";
import PageHeader from "@/components/ui/PageHeader";
import MapPlaceholder from "@/components/maps/MapPlaceholder";
import ChartPlaceholder from "@/components/charts/ChartPlaceholder";

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
        if (!cancelled) setIncidents(data);
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

  const hasActiveFilters = Object.values(filters).some(Boolean);

  return (
    <div>
      <PageHeader
        badge="Live Data"
        title="Raleigh Crime Explorer"
        subtitle="Browse daily police incident data from the Raleigh Police Department. Data is fetched live from the city's public ArcGIS service."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* ── Map Placeholder ─────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-[#123047]">
              Geographic View
            </h2>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
              Coming Soon
            </span>
          </div>
          <MapPlaceholder />
        </section>

        {/* ── Filters ─────────────────────────────────────────────────── */}
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
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
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4B9CD3] focus:border-transparent"
              />
            </div>

            {/* Crime Type */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1" htmlFor="crime-type">
                Crime Type
              </label>
              <select
                id="crime-type"
                value={filters.crimeType}
                onChange={(e) => handleFilterChange("crimeType", e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4B9CD3] focus:border-transparent"
              >
                <option value="">All types</option>
                {crimeTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* District */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1" htmlFor="district">
                District
              </label>
              <select
                id="district"
                value={filters.district}
                onChange={(e) => handleFilterChange("district", e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4B9CD3] focus:border-transparent"
              >
                <option value="">All districts</option>
                {districts.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Date From */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1" htmlFor="date-from">
                Date From
              </label>
              <input
                id="date-from"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4B9CD3] focus:border-transparent"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1" htmlFor="date-to">
                Date To
              </label>
              <input
                id="date-to"
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4B9CD3] focus:border-transparent"
              />
            </div>
          </div>
        </section>

        {/* ── Chart Placeholders ──────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-[#123047]">
              Analytics
            </h2>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
              Coming Soon
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ChartPlaceholder title="Incidents by Crime Type" />
            <ChartPlaceholder title="Incidents by District" />
          </div>
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
                  {hasActiveFilters ? (
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
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  viewMode === "table"
                    ? "bg-[#123047] text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                Table
              </button>
              <button
                onClick={() => setViewMode("cards")}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  viewMode === "cards"
                    ? "bg-[#123047] text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
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
            <IncidentTable incidents={incidents} />
          )}

          {!loading && !error && viewMode === "cards" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {incidents.length === 0 ? (
                <div className="col-span-full text-center py-12 text-gray-500">
                  No incidents found matching your filters.
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
