/**
 * Core data access and filtering logic for NC Schools data.
 *
 * Reads data/dist/schools.json once at module load and caches it in memory.
 * All filtering is done in-process — no upstream API calls needed.
 */

import { readFileSync } from "fs";
import { join } from "path";
import type { School, SchoolMap, CategoryCode, SPGGrade } from "@/types/school";

const SCHOOLS_PATH = join(process.cwd(), "data", "dist", "schools.json");

let _cache: School[] | null = null;

function getSchools(): School[] {
  if (_cache) return _cache;
  const raw = readFileSync(SCHOOLS_PATH, "utf-8");
  const map = JSON.parse(raw) as SchoolMap;
  _cache = Object.values(map);
  return _cache;
}

// ── Filters ──────────────────────────────────────────────────────────────────

export interface SchoolFilters {
  search?: string;
  leaCode?: string;
  county?: string;
  category?: CategoryCode;
  spgGrade?: SPGGrade;
}

export function filterSchools(filters: SchoolFilters): School[] {
  let results = getSchools();

  const { search, leaCode, county, category, spgGrade } = filters;

  if (search) {
    const q = search.toLowerCase();
    results = results.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.district_name.toLowerCase().includes(q) ||
        s.county.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q)
    );
  }

  if (leaCode) {
    results = results.filter((s) => s.lea_code === leaCode);
  }

  if (county) {
    results = results.filter((s) => s.county === county);
  }

  if (category) {
    results = results.filter((s) => s.category_code === category);
  }

  if (spgGrade) {
    results = results.filter((s) => s.spg_grade === spgGrade);
  }

  // Sort: SPG score descending; schools without a score fall to the end.
  return results.slice().sort((a, b) => {
    if (a.spg_score != null && b.spg_score != null) return b.spg_score - a.spg_score;
    if (a.spg_score != null) return -1;
    if (b.spg_score != null) return 1;
    return a.name.localeCompare(b.name);
  });
}

// ── Options (for filter dropdowns) ───────────────────────────────────────────

export const CATEGORY_LABELS: Record<CategoryCode, string> = {
  E: "Elementary",
  M: "Middle School",
  H: "High School",
  A: "K-12 / All Grades",
  T: "Alternative",
  I: "Early College",
};

export interface DistrictOption {
  lea_code: string;
  name: string;
}

export interface CategoryOption {
  code: CategoryCode;
  label: string;
}

export interface SchoolOptions {
  districts: DistrictOption[];
  counties: string[];
  categories: CategoryOption[];
}

export function getSchoolOptions(): SchoolOptions {
  const schools = getSchools();

  const districtMap = new Map<string, string>();
  const countySet = new Set<string>();
  const categorySet = new Set<CategoryCode>();

  for (const s of schools) {
    districtMap.set(s.lea_code, s.district_name);
    if (s.county) countySet.add(s.county);
    categorySet.add(s.category_code);
  }

  const districts = Array.from(districtMap.entries())
    .map(([lea_code, name]) => ({ lea_code, name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const counties = Array.from(countySet).sort();

  const categories = Array.from(categorySet)
    .map((code) => ({ code, label: CATEGORY_LABELS[code] ?? code }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return { districts, counties, categories };
}
