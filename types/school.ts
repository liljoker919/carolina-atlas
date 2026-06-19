/**
 * Types for NCDPI School Report Card (SRC) data.
 * Field names map directly to rcd_* table columns from the data dictionary.
 */

/** Grade-span category code from rcd_location.category_code */
export type CategoryCode = "E" | "M" | "H" | "A" | "T" | "I";

/** Educational agency designation type from rcd_location.designation_type */
export type DesignationType = "C" | "F" | "L" | "P" | "R" | "O";

/** EVAAS growth status from rcd_acc_spg2.eg_status */
export type GrowthStatus = "Met" | "NotMet" | "Exceeded";

/** SPG letter grade from rcd_acc_spg2.spg_grade */
export type SPGGrade = "A" | "B" | "C" | "D" | "F";

/**
 * A single school record merged from rcd_location, rcd_acc_spg2,
 * rcd_chronic_absent, rcd_sar, and rcd_eq for a given school year.
 */
export interface School {
  // ── Identity (rcd_location) ───────────────────────────────────────────────
  agency_code: string;        // 6-digit DPI school code, e.g. "010303"
  year: string;               // "2024" = SY 2023-24
  name: string;
  lea_code: string;           // Parent LEA agency_code
  district_name: string;      // Resolved from lea_code → rcd_location name
  county: string;
  city: string;
  zip: string;
  grade_span: string;         // e.g. "9:12"
  category_code: CategoryCode;
  designation_type: DesignationType;
  url?: string;
  title_I: boolean;

  // ── Performance (rcd_acc_spg2, subgroup = "ALL") ──────────────────────────
  spg_grade?: SPGGrade;       // Letter grade A–F
  spg_score?: number;         // Final SPG numeric score
  ach_score?: number;         // Academic achievement score
  eg_status?: GrowthStatus;   // EVAAS growth status
  eg_score?: number;          // EVAAS growth score
  spg_masked: boolean;        // True when spg_grade is privacy-masked

  // ── Chronic Absenteeism (rcd_chronic_absent, subgroup = "ALL") ───────────
  chronic_absent_pct?: number; // % of students chronically absent
  chronic_absent_masked: boolean;

  // ── Average Class Size (rcd_sar, averaged across grade levels) ───────────
  avg_class_size?: number;

  // ── Educator Qualifications (rcd_eq) ─────────────────────────────────────
  num_teachers?: number;
  pct_beg_teachers?: number;    // % in first 0-3 years
  pct_nonemer_teachers?: number; // % with full (non-emergent) licenses
}

/** Output shape written to data/dist/schools.json */
export type SchoolMap = Record<string, School>;
