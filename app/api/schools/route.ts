/**
 * GET /api/schools
 *
 * Returns filtered NC school records from the locally-parsed NCDPI
 * School Report Card dataset (data/dist/schools.json).
 *
 * Query parameters:
 *   search    — full-text match across name, district, county, city
 *   leaCode   — exact LEA code match (e.g. "100LEA")
 *   county    — exact county name match (e.g. "Wake")
 *   category  — school category code: E | M | H | A | T | I
 *   spgGrade  — SPG letter grade filter: A | B | C | D | F
 *   limit     — max records to return (default 100, max 500)
 *
 * Response shape:
 *   { schools: School[], total: number, limit: number }
 *
 *   `total` is the untruncated match count; `schools` is at most `limit` items,
 *   sorted by SPG score descending.
 */

import { NextRequest, NextResponse } from "next/server";
import { filterSchools } from "@/lib/api/schools";
import type { CategoryCode, SPGGrade } from "@/types/school";
import {
  sanitizeParam,
  sanitizeSearch,
  validateLimit,
} from "@/lib/validation";
import {
  apiErrorResponse,
  apiErrorFromUnknown,
  ERROR_CODE_VALIDATION,
} from "@/lib/api/errors";
import { enforceApiRateLimit } from "@/lib/api/rate-limit";

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;

const VALID_CATEGORIES = new Set(["E", "M", "H", "A", "T", "I"]);
const VALID_SPG_GRADES = new Set(["A", "B", "C", "D", "F"]);

export async function GET(request: NextRequest) {
  const rateLimitResponse = enforceApiRateLimit(request, "api/schools");
  if (rateLimitResponse) return rateLimitResponse;

  const { searchParams } = request.nextUrl;

  const search   = sanitizeSearch(searchParams.get("search")   ?? "");
  const leaCode  = sanitizeParam(searchParams.get("leaCode")   ?? "");
  const county   = sanitizeParam(searchParams.get("county")    ?? "");
  const category = sanitizeParam(searchParams.get("category")  ?? "");
  const spgGrade = sanitizeParam(searchParams.get("spgGrade")  ?? "");
  const limit    = validateLimit(searchParams.get("limit"), DEFAULT_LIMIT, MAX_LIMIT);

  if (category && !VALID_CATEGORIES.has(category)) {
    return apiErrorResponse(
      `Invalid category "${category}". Must be one of: E, M, H, A, T, I.`,
      ERROR_CODE_VALIDATION,
      400
    );
  }

  if (spgGrade && !VALID_SPG_GRADES.has(spgGrade)) {
    return apiErrorResponse(
      `Invalid spgGrade "${spgGrade}". Must be one of: A, B, C, D, F.`,
      ERROR_CODE_VALIDATION,
      400
    );
  }

  try {
    const all = filterSchools({
      search:   search   || undefined,
      leaCode:  leaCode  || undefined,
      county:   county   || undefined,
      category: (category || undefined) as CategoryCode | undefined,
      spgGrade: (spgGrade || undefined) as SPGGrade | undefined,
    });

    const total   = all.length;
    const schools = all.slice(0, limit);

    return NextResponse.json({ schools, total, limit });
  } catch (err) {
    return apiErrorFromUnknown(err, "Failed to fetch schools");
  }
}
