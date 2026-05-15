/**
 * Shared validation utilities for Carolina Atlas API routes.
 *
 * These utilities are designed to be reused across crime, schools,
 * demographics, and census API endpoints.
 */

// ---------------------------------------------------------------------------
// Date validation
// ---------------------------------------------------------------------------

/**
 * Result returned by {@link validateDate}.
 */
export interface DateValidationResult {
  /** `true` when the date string is structurally valid and represents a real calendar day. */
  valid: boolean;
  /** Human-readable explanation of why validation failed; absent when `valid` is `true`. */
  error?: string;
}

/**
 * Validates that a string matches the YYYY-MM-DD format and represents a real
 * calendar date (e.g. "2024-02-30" is rejected because February has no 30th).
 *
 * Returns a {@link DateValidationResult} so callers can surface a specific
 * error message rather than just a boolean.
 *
 * @example
 * validateDate("2024-01-15") // { valid: true }
 * validateDate("2024-13-01") // { valid: false, error: "..." }
 * validateDate("")           // { valid: false, error: "..." }
 */
export function validateDate(dateStr: string): DateValidationResult {
  if (!dateStr) {
    return { valid: false, error: "Date is required." };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return {
      valid: false,
      error: `Invalid date format "${dateStr}". Expected YYYY-MM-DD.`,
    };
  }

  const [year, month, day] = dateStr.split("-").map(Number);

  // Use the local-timezone Date constructor to mirror how dates are parsed
  // elsewhere in the codebase (localDateToMs). If the JS engine rolls over to
  // the next month (e.g. Feb 30 → Mar 2) the date components won't match.
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return {
      valid: false,
      error: `"${dateStr}" is not a real calendar date.`,
    };
  }

  return { valid: true };
}

/**
 * Backward-compatible helper that returns a plain boolean.
 * Prefer {@link validateDate} in new code so callers can surface the error.
 */
export function isValidDateFormat(dateStr: string): boolean {
  return validateDate(dateStr).valid;
}

// ---------------------------------------------------------------------------
// Search / string sanitization
// ---------------------------------------------------------------------------

/**
 * Maximum character length enforced by {@link sanitizeSearch}.
 * Queries longer than this limit are truncated to prevent excessively large
 * WHERE clauses being forwarded to upstream services.
 */
export const SEARCH_MAX_LENGTH = 200;

/**
 * Sanitizes a free-text search query for use in an API request:
 * 1. Trims leading/trailing whitespace.
 * 2. Strips SQL-injection-prone characters: single-quotes, double-quotes,
 *    semicolons, and backslashes.
 * 3. Truncates to {@link SEARCH_MAX_LENGTH} characters.
 *
 * A whitespace-only input is normalised to an empty string so it is treated
 * the same as an absent parameter.
 *
 * @example
 * sanitizeSearch("  robbery  ") // "robbery"
 * sanitizeSearch("'; DROP TABLE incidents; --") // "DROP TABLE incidents --"
 * sanitizeSearch("a".repeat(300)) // 200-character string
 */
export function sanitizeSearch(value: string): string {
  return value
    .trim()
    .replace(/['";\\]/g, "") // strip SQL-sensitive characters
    .trim()
    .slice(0, SEARCH_MAX_LENGTH);
}

/**
 * Sanitizes a single query-parameter string by trimming leading/trailing
 * whitespace.  A whitespace-only input is normalized to an empty string so
 * it is treated the same as an absent parameter.
 *
 * For free-text search fields prefer {@link sanitizeSearch}, which also strips
 * potentially dangerous characters and enforces a length limit.
 */
export function sanitizeParam(value: string): string {
  return value.trim();
}

// ---------------------------------------------------------------------------
// Limit validation
// ---------------------------------------------------------------------------

/**
 * Parses a raw `limit` query-parameter string and clamps the result to the
 * range [1, `maxLimit`].  Falls back to `defaultLimit` when the raw value is
 * absent, empty, or not a finite integer.
 *
 * @param rawValue    - The raw string from `searchParams.get("limit")`, or `null`.
 * @param defaultLimit - Value to use when `rawValue` is absent or invalid.
 * @param maxLimit    - Hard upper bound; the returned value will never exceed this.
 *
 * @example
 * validateLimit("50",   500, 2000) // 50
 * validateLimit("9999", 500, 2000) // 2000
 * validateLimit("0",    500, 2000) // 1
 * validateLimit(null,   500, 2000) // 500
 * validateLimit("abc",  500, 2000) // 500
 */
export function validateLimit(
  rawValue: string | null,
  defaultLimit: number,
  maxLimit: number
): number {
  if (rawValue === null) return defaultLimit;

  const trimmedValue = rawValue.trim();
  if (trimmedValue === "") return defaultLimit;
  if (!/^[+-]?\d+$/.test(trimmedValue)) return defaultLimit;

  const parsed = Number(trimmedValue);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) return defaultLimit;

  return Math.min(Math.max(parsed, 1), maxLimit);
}
