import { describe, it, expect } from "vitest";
import {
  validateDate,
  isValidDateFormat,
  sanitizeSearch,
  sanitizeParam,
  validateLimit,
  SEARCH_MAX_LENGTH,
} from "./index";

// ---------------------------------------------------------------------------
// validateDate
// ---------------------------------------------------------------------------

describe("validateDate", () => {
  it("returns valid for a correct date", () => {
    expect(validateDate("2024-01-15")).toEqual({ valid: true });
  });

  it("returns valid for a leap-year date", () => {
    expect(validateDate("2024-02-29")).toEqual({ valid: true });
  });

  it("returns invalid for an empty string", () => {
    const result = validateDate("");
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("returns invalid for a wrong format (MM/DD/YYYY)", () => {
    const result = validateDate("01/15/2024");
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/YYYY-MM-DD/);
  });

  it("returns invalid for an impossible date (Feb 30)", () => {
    const result = validateDate("2024-02-30");
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("returns invalid for month 13", () => {
    const result = validateDate("2024-13-01");
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("returns invalid for day 00", () => {
    const result = validateDate("2024-01-00");
    expect(result.valid).toBe(false);
  });

  it("returns invalid for a non-leap-year Feb 29", () => {
    const result = validateDate("2023-02-29");
    expect(result.valid).toBe(false);
  });

  it("includes the offending string in the error for bad format", () => {
    const result = validateDate("not-a-date");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("not-a-date");
  });
});

// ---------------------------------------------------------------------------
// isValidDateFormat (backward-compatible boolean helper)
// ---------------------------------------------------------------------------

describe("isValidDateFormat", () => {
  it("returns true for a valid date", () => {
    expect(isValidDateFormat("2024-06-15")).toBe(true);
  });

  it("returns false for an invalid date", () => {
    expect(isValidDateFormat("2024-02-30")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isValidDateFormat("")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// sanitizeSearch
// ---------------------------------------------------------------------------

describe("sanitizeSearch", () => {
  it("trims leading and trailing whitespace", () => {
    expect(sanitizeSearch("  robbery  ")).toBe("robbery");
  });

  it("returns empty string for whitespace-only input", () => {
    expect(sanitizeSearch("   ")).toBe("");
  });

  it("strips single quotes", () => {
    expect(sanitizeSearch("O'Brien")).toBe("OBrien");
  });

  it("strips double quotes", () => {
    expect(sanitizeSearch('"test"')).toBe("test");
  });

  it("strips semicolons", () => {
    expect(sanitizeSearch("foo; bar")).toBe("foo bar");
  });

  it("strips backslashes", () => {
    expect(sanitizeSearch("path\\to\\file")).toBe("pathtofile");
  });

  it("truncates to SEARCH_MAX_LENGTH characters", () => {
    const long = "a".repeat(SEARCH_MAX_LENGTH + 50);
    expect(sanitizeSearch(long)).toHaveLength(SEARCH_MAX_LENGTH);
  });

  it("handles SQL injection attempt", () => {
    const result = sanitizeSearch("'; DROP TABLE incidents; --");
    expect(result).not.toContain("'");
    expect(result).not.toContain(";");
  });

  it("preserves normal alphanumeric text", () => {
    expect(sanitizeSearch("robbery downtown 2024")).toBe("robbery downtown 2024");
  });
});

// ---------------------------------------------------------------------------
// sanitizeParam
// ---------------------------------------------------------------------------

describe("sanitizeParam", () => {
  it("trims whitespace", () => {
    expect(sanitizeParam("  hello  ")).toBe("hello");
  });

  it("returns empty string for whitespace-only input", () => {
    expect(sanitizeParam("   ")).toBe("");
  });

  it("returns the value unchanged when already trimmed", () => {
    expect(sanitizeParam("ROBBERY")).toBe("ROBBERY");
  });
});

// ---------------------------------------------------------------------------
// validateLimit
// ---------------------------------------------------------------------------

describe("validateLimit", () => {
  const DEFAULT = 500;
  const MAX = 2000;

  it("returns the parsed value when within range", () => {
    expect(validateLimit("50", DEFAULT, MAX)).toBe(50);
  });

  it("clamps to maxLimit when value exceeds it", () => {
    expect(validateLimit("9999", DEFAULT, MAX)).toBe(MAX);
  });

  it("clamps to 1 when value is 0", () => {
    expect(validateLimit("0", DEFAULT, MAX)).toBe(1);
  });

  it("clamps to 1 when value is negative", () => {
    expect(validateLimit("-10", DEFAULT, MAX)).toBe(1);
  });

  it("returns defaultLimit when rawValue is null", () => {
    expect(validateLimit(null, DEFAULT, MAX)).toBe(DEFAULT);
  });

  it("returns defaultLimit for a non-numeric string", () => {
    expect(validateLimit("abc", DEFAULT, MAX)).toBe(DEFAULT);
  });

  it("returns defaultLimit for an empty string", () => {
    expect(validateLimit("", DEFAULT, MAX)).toBe(DEFAULT);
  });

  it("returns defaultLimit for a whitespace-only string", () => {
    expect(validateLimit("   ", DEFAULT, MAX)).toBe(DEFAULT);
  });

  it("accepts maxLimit exactly", () => {
    expect(validateLimit(String(MAX), DEFAULT, MAX)).toBe(MAX);
  });

  it("accepts 1 exactly", () => {
    expect(validateLimit("1", DEFAULT, MAX)).toBe(1);
  });
});
