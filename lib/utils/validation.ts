/**
 * Reusable validation and sanitization utilities for Carolina Atlas API routes.
 */

/**
 * Validates that a string matches the YYYY-MM-DD format and represents a real
 * calendar date (e.g. "2024-02-30" is rejected because February has no 30th).
 *
 * Returns `true` only when the string is a structurally correct ISO date that
 * refers to an actual day on the Gregorian calendar.
 */
export function isValidDateFormat(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;

  const [year, month, day] = dateStr.split("-").map(Number);

  // Use the local-timezone Date constructor to mirror how dates are parsed
  // elsewhere in the codebase (localDateToMs).  If the JS engine rolls over
  // to the next month (e.g. Feb 30 → Mar 2) the date components won't match.
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

/**
 * Sanitizes a single query-parameter string by trimming leading/trailing
 * whitespace.  A whitespace-only input is normalized to an empty string so
 * it is treated the same as an absent parameter.
 */
export function sanitizeParam(value: string): string {
  return value.trim();
}
