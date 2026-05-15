/**
 * Unit tests for lib/utils/validation.ts
 *
 * Covers:
 *  - isValidDateFormat: valid dates, invalid format, impossible calendar dates,
 *    edge cases (leap years, month boundaries)
 *  - sanitizeParam: whitespace trimming, whitespace-only strings
 */

import { describe, expect, it } from "vitest";
import { isValidDateFormat, sanitizeParam } from "./validation";

// ---------------------------------------------------------------------------
// isValidDateFormat
// ---------------------------------------------------------------------------

describe("isValidDateFormat", () => {
  // ── Valid dates ────────────────────────────────────────────────────────

  it("accepts a normal date", () => {
    expect(isValidDateFormat("2024-06-15")).toBe(true);
  });

  it("accepts the first day of the year", () => {
    expect(isValidDateFormat("2024-01-01")).toBe(true);
  });

  it("accepts the last day of the year", () => {
    expect(isValidDateFormat("2024-12-31")).toBe(true);
  });

  it("accepts a leap day on a valid leap year", () => {
    expect(isValidDateFormat("2024-02-29")).toBe(true);
  });

  it("accepts Feb 28 on a non-leap year", () => {
    expect(isValidDateFormat("2023-02-28")).toBe(true);
  });

  // ── Invalid format strings ─────────────────────────────────────────────

  it("rejects a date with slashes", () => {
    expect(isValidDateFormat("2024/06/15")).toBe(false);
  });

  it("rejects MM-DD-YYYY ordering", () => {
    expect(isValidDateFormat("06-15-2024")).toBe(false);
  });

  it("rejects a date with only two digit year", () => {
    expect(isValidDateFormat("24-06-15")).toBe(false);
  });

  it("rejects a date missing the day segment", () => {
    expect(isValidDateFormat("2024-06")).toBe(false);
  });

  it("rejects a completely empty string", () => {
    expect(isValidDateFormat("")).toBe(false);
  });

  it("rejects a plain text string", () => {
    expect(isValidDateFormat("not-a-date")).toBe(false);
  });

  it("rejects a datetime string (with time component)", () => {
    expect(isValidDateFormat("2024-06-15T12:00:00")).toBe(false);
  });

  // ── Impossible calendar dates ──────────────────────────────────────────

  it("rejects Feb 29 on a non-leap year", () => {
    expect(isValidDateFormat("2023-02-29")).toBe(false);
  });

  it("rejects Feb 30", () => {
    expect(isValidDateFormat("2024-02-30")).toBe(false);
  });

  it("rejects month 00", () => {
    expect(isValidDateFormat("2024-00-15")).toBe(false);
  });

  it("rejects month 13", () => {
    expect(isValidDateFormat("2024-13-01")).toBe(false);
  });

  it("rejects day 00", () => {
    expect(isValidDateFormat("2024-06-00")).toBe(false);
  });

  it("rejects day 32 in a 31-day month", () => {
    expect(isValidDateFormat("2024-01-32")).toBe(false);
  });

  it("rejects April 31 (month with only 30 days)", () => {
    expect(isValidDateFormat("2024-04-31")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// sanitizeParam
// ---------------------------------------------------------------------------

describe("sanitizeParam", () => {
  it("returns the value unchanged when it has no extra whitespace", () => {
    expect(sanitizeParam("THEFT")).toBe("THEFT");
  });

  it("trims leading whitespace", () => {
    expect(sanitizeParam("  THEFT")).toBe("THEFT");
  });

  it("trims trailing whitespace", () => {
    expect(sanitizeParam("THEFT  ")).toBe("THEFT");
  });

  it("trims both leading and trailing whitespace", () => {
    expect(sanitizeParam("  THEFT  ")).toBe("THEFT");
  });

  it("returns an empty string for a whitespace-only input", () => {
    expect(sanitizeParam("   ")).toBe("");
  });

  it("returns an empty string for an already-empty input", () => {
    expect(sanitizeParam("")).toBe("");
  });

  it("preserves internal whitespace within the value", () => {
    expect(sanitizeParam("  ARMED ROBBERY  ")).toBe("ARMED ROBBERY");
  });
});
