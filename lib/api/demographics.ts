/**
 * Core data access and filtering logic for NC county demographics.
 *
 * Reads data/dist/demographics.json once at module load and caches it in memory.
 * All filtering is done in-process — no upstream API calls needed.
 */

import { readFileSync } from "fs";
import { join } from "path";
import type { CountyDemographics, DemographicsMap } from "@/types/demographics";

const DEMOGRAPHICS_PATH = join(process.cwd(), "data", "dist", "demographics.json");

let _cache: CountyDemographics[] | null = null;

function getDemographics(): CountyDemographics[] {
  if (_cache) return _cache;
  const raw = readFileSync(DEMOGRAPHICS_PATH, "utf-8");
  const map = JSON.parse(raw) as DemographicsMap;
  _cache = Object.values(map).sort((a, b) => a.county.localeCompare(b.county));
  return _cache;
}

// ── Filters ──────────────────────────────────────────────────────────────────

export interface DemographicsFilters {
  search?: string;
  fips?: string[];
}

export function filterDemographics(filters: DemographicsFilters = {}): CountyDemographics[] {
  let results = getDemographics();

  const { search, fips } = filters;

  if (fips && fips.length > 0) {
    const fipsSet = new Set(fips);
    results = results.filter((c) => fipsSet.has(c.fips));
  }

  if (search) {
    const q = search.toLowerCase();
    results = results.filter((c) => c.county.toLowerCase().includes(q));
  }

  return results;
}
