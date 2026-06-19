/**
 * NCDPI School Report Card parse script.
 *
 * Reads the 5 MVP source files from data/raw/, filters to the target school
 * year and school-level records, merges on agency_code, and writes a single
 * schools.json lookup to data/dist/.
 *
 * Usage:
 *   npx tsx scripts/parse-src.ts
 *
 * Required files in data/raw/:
 *   rcd_location.xlsx
 *   rcd_acc_spg2.xlsx
 *   rcd_chronic_absent.xlsx
 *   rcd_sar.xlsx
 *   rcd_eq.xlsx
 */

import * as XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";
import type { School, SchoolMap, SPGGrade, GrowthStatus, CategoryCode, DesignationType } from "../types/school";

const RAW  = path.join(process.cwd(), "data", "raw");
const DIST = path.join(process.cwd(), "data", "dist");

// SY 2023-24 → year field value "2024"
const TARGET_YEAR = "2024";

// LEA codes excluded per the data dictionary general rules
const EXCLUDED_LEA_CODES = new Set([
  "000209", "000269", "000298", "000299",
  "000679", "000996", "000997", "000998", "000999",
]);

// ── Helpers ─────────────────────────────────────────────────────────────────

function readSheet<T extends object>(filename: string): T[] {
  const filepath = path.join(RAW, filename);
  if (!fs.existsSync(filepath)) {
    console.warn(`  ⚠  Missing: ${filename} — skipping this data source`);
    return [];
  }
  const wb = XLSX.readFile(filepath, { cellDates: false });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<T>(ws, { defval: undefined });
  console.log(`  ✓  ${filename}: ${rows.length.toLocaleString()} total rows`);
  return rows;
}

function str(v: unknown): string {
  return v == null ? "" : String(v).trim();
}

function num(v: unknown): number | undefined {
  const n = Number(v);
  return isNaN(n) || v == null || v === "" ? undefined : n;
}

function isMasked(code: unknown): boolean {
  const c = str(code);
  // Masking code 0 = no masking; blank also means no masking
  return c !== "" && c !== "0";
}

// ── Step 1: Build school identity map from rcd_location ─────────────────────

interface LocationRow {
  year?: unknown;
  agency_code?: unknown;
  agency_level?: unknown;
  lea_code?: unknown;
  name?: unknown;
  county?: unknown;
  city?: unknown;
  zip?: unknown;
  grade_span?: unknown;
  category_code?: unknown;
  designation_type?: unknown;
  url?: unknown;
  title_I?: unknown;
}

console.log("\n[1/5] Reading rcd_location …");
const locationRows = readSheet<LocationRow>("rcd_location.xlsx");

// Build LEA name lookup first (agency_level = LEA)
const districtNames: Record<string, string> = {};
for (const row of locationRows) {
  if (str(row.agency_level) === "LEA") {
    districtNames[str(row.agency_code)] = str(row.name);
  }
}

// Build initial school map from school-level records for the target year
const schools: SchoolMap = {};
let locationCount = 0;

for (const row of locationRows) {
  if (
    str(row.year) !== TARGET_YEAR ||
    str(row.agency_level) !== "SCH"
  ) continue;

  const leaCode = str(row.lea_code);
  if (EXCLUDED_LEA_CODES.has(leaCode)) continue;

  const agencyCode = str(row.agency_code);
  if (!agencyCode) continue;

  schools[agencyCode] = {
    agency_code:      agencyCode,
    year:             TARGET_YEAR,
    name:             str(row.name),
    lea_code:         leaCode,
    district_name:    districtNames[leaCode] ?? leaCode,
    county:           str(row.county),
    city:             str(row.city),
    zip:              str(row.zip),
    grade_span:       str(row.grade_span),
    category_code:    (str(row.category_code) || "E") as CategoryCode,
    designation_type: (str(row.designation_type) || "P") as DesignationType,
    url:              str(row.url) || undefined,
    title_I:          str(row.title_I) === "Y",
    spg_masked:           false,
    chronic_absent_masked: false,
  };
  locationCount++;
}

console.log(`     → ${locationCount} schools in SY ${TARGET_YEAR}`);

// ── Step 2: Merge School Performance Grades from rcd_acc_spg2 ───────────────

interface Spg2Row {
  year?: unknown;
  agency_code?: unknown;
  subgroup?: unknown;
  spg_grade?: unknown;
  spg_grade_masking?: unknown;
  spg_score?: unknown;
  spg_score_masking?: unknown;
  ach_score?: unknown;
  eg_status?: unknown;
  eg_score?: unknown;
}

console.log("\n[2/5] Reading rcd_acc_spg2 …");
const spgRows = readSheet<Spg2Row>("rcd_acc_spg2.xlsx");
let spgCount = 0;

for (const row of spgRows) {
  if (str(row.year) !== TARGET_YEAR) continue;
  if (str(row.subgroup) !== "ALL") continue;

  const s = schools[str(row.agency_code)];
  if (!s) continue;

  s.spg_grade   = str(row.spg_grade) as SPGGrade || undefined;
  s.spg_score   = num(row.spg_score);
  s.ach_score   = num(row.ach_score);
  s.eg_status   = str(row.eg_status) as GrowthStatus || undefined;
  s.eg_score    = num(row.eg_score);
  s.spg_masked  = isMasked(row.spg_grade_masking) || isMasked(row.spg_score_masking);
  spgCount++;
}

console.log(`     → ${spgCount} SPG records merged`);

// ── Step 3: Merge Chronic Absenteeism from rcd_chronic_absent ───────────────

interface AbsentRow {
  year?: unknown;
  agency_code?: unknown;
  subgroup?: unknown;
  pct?: unknown;
  masking?: unknown;
}

console.log("\n[3/5] Reading rcd_chronic_absent …");
const absentRows = readSheet<AbsentRow>("rcd_chronic_absent.xlsx");
let absentCount = 0;

for (const row of absentRows) {
  if (str(row.year) !== TARGET_YEAR) continue;
  if (str(row.subgroup) !== "ALL") continue;

  const s = schools[str(row.agency_code)];
  if (!s) continue;

  // pct is stored as a decimal proportion in Excel (e.g. 0.1722 = 17.22%)
  const rawPct = num(row.pct);
  s.chronic_absent_pct    = rawPct != null ? Math.round(rawPct * 1000) / 10 : undefined;
  s.chronic_absent_masked = isMasked(row.masking);
  absentCount++;
}

console.log(`     → ${absentCount} absenteeism records merged`);

// ── Step 4: Merge Average Class Size from rcd_sar ───────────────────────────

interface SarRow {
  year?: unknown;
  agency_code?: unknown;
  avg_size?: unknown;
}

console.log("\n[4/5] Reading rcd_sar …");
const sarRows = readSheet<SarRow>("rcd_sar.xlsx");

// Accumulate per school to average across grade levels
const sarAccum: Record<string, { sum: number; count: number }> = {};
let sarCount = 0;

for (const row of sarRows) {
  if (str(row.year) !== TARGET_YEAR) continue;

  const code = str(row.agency_code);
  if (!schools[code]) continue;

  const size = num(row.avg_size);
  if (size == null || size <= 0) continue;

  if (!sarAccum[code]) sarAccum[code] = { sum: 0, count: 0 };
  sarAccum[code].sum   += size;
  sarAccum[code].count += 1;
  sarCount++;
}

for (const [code, { sum, count }] of Object.entries(sarAccum)) {
  schools[code].avg_class_size = Math.round((sum / count) * 10) / 10;
}

console.log(`     → ${sarCount} class size rows averaged across ${Object.keys(sarAccum).length} schools`);

// ── Step 5: Merge Educator Qualifications from rcd_eq ───────────────────────

interface EqRow {
  year?: unknown;
  agency_code?: unknown;
  number_of_teachers?: unknown;
  beg_teacher?: unknown;
  pct_beg_teachers?: unknown;
  nonemer_teachers?: unknown;
  pct_nonemer_teachers?: unknown;
}

console.log("\n[5/5] Reading rcd_eq …");
const eqRows = readSheet<EqRow>("rcd_eq.xlsx");
let eqCount = 0;

for (const row of eqRows) {
  if (str(row.year) !== TARGET_YEAR) continue;

  const s = schools[str(row.agency_code)];
  if (!s) continue;

  // pct fields are decimal proportions in Excel (0.2029 = 20.29%)
  const rawBeg    = num(row.pct_beg_teachers);
  const rawNonEm  = num(row.pct_nonemer_teachers);
  s.num_teachers         = num(row.number_of_teachers);
  s.pct_beg_teachers     = rawBeg   != null ? Math.round(rawBeg   * 1000) / 10 : undefined;
  s.pct_nonemer_teachers = rawNonEm != null ? Math.round(rawNonEm * 1000) / 10 : undefined;
  eqCount++;
}

console.log(`     → ${eqCount} educator qualification records merged`);

// ── Write output ─────────────────────────────────────────────────────────────

if (!fs.existsSync(DIST)) fs.mkdirSync(DIST, { recursive: true });

const outputPath = path.join(DIST, "schools.json");
const total = Object.keys(schools).length;
fs.writeFileSync(outputPath, JSON.stringify(schools, null, 2), "utf-8");

const sizeKb = Math.round(fs.statSync(outputPath).size / 1024);
console.log(`\n✅  Wrote ${total} schools → data/dist/schools.json (${sizeKb} KB)\n`);
