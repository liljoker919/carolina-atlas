"use client";

/**
 * SchoolExplorer — NC Schools Dashboard explorer.
 *
 * Fetches filtered school data from /api/schools. Filters include free-text
 * search, district (by LEA code), county, school category, and SPG grade.
 * Dropdown options are loaded once from /api/schools/options.
 *
 * Displays up to 200 results sorted by SPG score descending. Shows total
 * match count so users know when to narrow filters.
 *
 * Toggle between card and table views.
 */

import { useState, useEffect } from "react";
import type { School } from "@/types/school";
import SchoolCard from "@/components/dashboard/SchoolCard";
import SchoolTable from "@/components/dashboard/SchoolTable";
import SchoolSummaryCards from "@/components/dashboard/SchoolSummaryCards";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorMessage from "@/components/ui/ErrorMessage";
import PageHeader from "@/components/ui/PageHeader";

// ── Shared Tailwind class for every filter control ───────────────────────────
const INPUT_CLS =
  "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm " +
  "focus:outline-none focus:ring-2 focus:ring-[#4B9CD3] focus:border-transparent";

// ── Delay before a free-text search triggers a fetch ────────────────────────
const SEARCH_DEBOUNCE_MS = 400;

/** Default result cap — high enough to be useful, low enough to render fast. */
const LIMIT = 200;

// ── Filter state types ───────────────────────────────────────────────────────

interface SchoolFilters {
  search: string;
  leaCode: string;
  county: string;
  category: string;
  spgGrade: string;
}

const EMPTY_FILTERS: SchoolFilters = {
  search:   "",
  leaCode:  "",
  county:   "",
  category: "",
  spgGrade: "",
};

// ── Options response type (from /api/schools/options) ───────────────────────

interface DistrictOption { lea_code: string; name: string; }
interface CategoryOption  { code: string;    label: string; }

interface SchoolOptions {
  districts:  DistrictOption[];
  counties:   string[];
  categories: CategoryOption[];
}

// ── API response type ────────────────────────────────────────────────────────

interface SchoolsResponse {
  schools: School[];
  total:   number;
  limit:   number;
}

// ── Local sub-components ─────────────────────────────────────────────────────

function FilterSelect({
  id, label, value, onChange, placeholder, children,
}: {
  id: string; label: string; value: string;
  onChange: (v: string) => void; placeholder: string;
  children: React.ReactNode;
}) {
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
        {children}
      </select>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function SchoolExplorer() {
  // ── Data state ─────────────────────────────────────────────────────────
  const [schools, setSchools]     = useState<School[]>([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  // ── Options state ──────────────────────────────────────────────────────
  const [options, setOptions] = useState<SchoolOptions>({
    districts: [], counties: [], categories: [],
  });

  // ── UI state ───────────────────────────────────────────────────────────
  const [filters, setFilters]     = useState<SchoolFilters>(EMPTY_FILTERS);
  const [viewMode, setViewMode]   = useState<"cards" | "table">("table");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [retryCount, setRetryCount]           = useState(0);

  // ── Debounce free-text search ──────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedSearch(filters.search),
      SEARCH_DEBOUNCE_MS
    );
    return () => clearTimeout(timer);
  }, [filters.search]);

  // ── Load dropdown options once on mount ───────────────────────────────
  useEffect(() => {
    async function loadOptions() {
      try {
        const res = await fetch("/api/schools/options");
        if (!res.ok) return;
        const data = await res.json() as SchoolOptions;
        setOptions(data);
      } catch {
        // non-fatal — dropdowns will be empty
      }
    }
    loadOptions();
  }, []);

  // ── Fetch schools whenever filters change ─────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (debouncedSearch)    params.set("search",   debouncedSearch);
        if (filters.leaCode)    params.set("leaCode",  filters.leaCode);
        if (filters.county)     params.set("county",   filters.county);
        if (filters.category)   params.set("category", filters.category);
        if (filters.spgGrade)   params.set("spgGrade", filters.spgGrade);
        params.set("limit", String(LIMIT));

        const res = await fetch(`/api/schools?${params.toString()}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({} as { error?: { message?: string } })) as { error?: { message?: string } };
          throw new Error(body.error?.message ?? `Server error: ${res.status}`);
        }
        const data = await res.json() as SchoolsResponse;
        if (!cancelled) {
          setSchools(data.schools ?? []);
          setTotal(data.total ?? 0);
        }
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to load school data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [
    debouncedSearch,
    filters.leaCode,
    filters.county,
    filters.category,
    filters.spgGrade,
    retryCount,
  ]);

  // ── Handlers ──────────────────────────────────────────────────────────
  const handleFilterChange = (key: keyof SchoolFilters, value: string) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const handleReset  = () => setFilters(EMPTY_FILTERS);
  const handleRetry  = () => setRetryCount((n) => n + 1);

  const hasActiveFilters = Object.values(filters).some(Boolean);
  const truncated = total > schools.length;

  return (
    <div>
      <PageHeader
        badge="SY 2023–24"
        title="NC Schools Dashboard"
        subtitle="School performance grades, chronic absenteeism, and educator data for all 2,700+ North Carolina public schools. Source: NCDPI School Report Card."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* ── Summary Cards ─────────────────────────────────────────────── */}
        <section>
          <h2 className="text-lg font-semibold text-[#123047] mb-3">Summary</h2>
          {error ? (
            <ErrorMessage message={error} />
          ) : (
            <SchoolSummaryCards schools={schools} total={total} loading={loading} />
          )}
        </section>

        {/* ── Filters ───────────────────────────────────────────────────── */}
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
              <label className="block text-xs font-medium text-gray-500 mb-1" htmlFor="school-search">
                Search
              </label>
              <input
                id="school-search"
                type="text"
                placeholder="School name, district, city…"
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className={INPUT_CLS}
              />
            </div>

            {/* District */}
            <FilterSelect
              id="district"
              label="District"
              value={filters.leaCode}
              onChange={(v) => handleFilterChange("leaCode", v)}
              placeholder="All districts"
            >
              {options.districts.map((d) => (
                <option key={d.lea_code} value={d.lea_code}>{d.name}</option>
              ))}
            </FilterSelect>

            {/* County */}
            <FilterSelect
              id="county"
              label="County"
              value={filters.county}
              onChange={(v) => handleFilterChange("county", v)}
              placeholder="All counties"
            >
              {options.counties.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </FilterSelect>

            {/* School Category */}
            <FilterSelect
              id="category"
              label="School Type"
              value={filters.category}
              onChange={(v) => handleFilterChange("category", v)}
              placeholder="All types"
            >
              {options.categories.map((cat) => (
                <option key={cat.code} value={cat.code}>{cat.label}</option>
              ))}
            </FilterSelect>

            {/* SPG Grade */}
            <FilterSelect
              id="spg-grade"
              label="SPG Grade"
              value={filters.spgGrade}
              onChange={(v) => handleFilterChange("spgGrade", v)}
              placeholder="All grades"
            >
              {["A", "B", "C", "D", "F"].map((g) => (
                <option key={g} value={g}>Grade {g}</option>
              ))}
            </FilterSelect>
          </div>
        </section>

        {/* ── Results ───────────────────────────────────────────────────── */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-[#123047]">Schools</h2>
              {!loading && !error && (
                <p className="text-sm text-gray-500">
                  {truncated ? (
                    <>
                      Showing{" "}
                      <span className="font-medium text-[#123047]">{schools.length}</span>
                      {" "}of{" "}
                      <span className="font-medium text-[#123047]">{total.toLocaleString()}</span>
                      {" "}schools — use filters to narrow results
                    </>
                  ) : (
                    <>
                      <span className="font-medium text-[#123047]">{total.toLocaleString()}</span>
                      {" "}{total === 1 ? "school" : "schools"}{hasActiveFilters ? " matching filters" : ""}
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

          {loading && <LoadingSpinner label="Loading school data…" />}

          {error && !loading && (
            <ErrorMessage
              title="Failed to load schools"
              message={error}
              onRetry={handleRetry}
            />
          )}

          {!loading && !error && viewMode === "table" && (
            <SchoolTable schools={schools} onReset={hasActiveFilters ? handleReset : undefined} />
          )}

          {!loading && !error && viewMode === "cards" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {schools.map((school) => (
                <SchoolCard key={school.agency_code} school={school} />
              ))}
            </div>
          )}
        </section>

        {/* ── Data note ─────────────────────────────────────────────────── */}
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
          <strong>Data note:</strong> School data is sourced from the{" "}
          <a
            href="https://www.dpi.nc.gov/data-reports/school-report-cards"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-blue-900"
          >
            NCDPI School Report Card
          </a>{" "}
          for School Year 2023–24. SPG grades combine academic achievement and growth scores.
          Values suppressed for privacy are shown as —.
        </div>
      </div>
    </div>
  );
}
