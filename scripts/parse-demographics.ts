/**
 * NC County Demographics parse script.
 *
 * Fetches ACS 5-Year Estimates from the Census Bureau REST API for all
 * 100 NC counties and writes a single demographics.json lookup keyed by
 * 5-digit FIPS code. No manual file downloads required.
 *
 * Usage:
 *   npm run parse:demographics
 *
 * Optional: set CENSUS_API_KEY env var to avoid rate limiting on CI.
 *   Free key at: https://api.census.gov/data/key_signup.html
 *
 * ACS tables used:
 *   B01001 — Sex by Age (under-18 and 65+ groups)
 *   B01002 — Median Age
 *   B02001 — Race
 *   B03002 — Hispanic or Latino Origin by Race
 *   B15003 — Educational Attainment (population 25+)
 *   B17001 — Poverty Status by Sex and Age
 *   B19013 — Median Household Income
 *   B23025 — Employment Status
 *   B25003 — Tenure (owner vs renter)
 *   B25064 — Median Gross Rent
 *   B25077 — Median Value of Owner-Occupied Units
 */

import * as fs from "fs";
import * as path from "path";
import type { CountyDemographics, DemographicsMap } from "../types/demographics";

const YEAR      = "2023";
const STATE     = "37"; // North Carolina FIPS
const BASE_URL  = `https://api.census.gov/data/${YEAR}/acs/acs5`;
const API_KEY   = process.env.CENSUS_API_KEY ?? "";

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildUrl(vars: string[]): string {
  const key = API_KEY ? `&key=${API_KEY}` : "";
  return `${BASE_URL}?get=${vars.join(",")}&for=county:*&in=state:${STATE}${key}`;
}

async function fetchCensus(vars: string[]): Promise<Record<string, string>[]> {
  const url = buildUrl(vars);
  const safeUrl = API_KEY ? url.replace(API_KEY, "***") : url;
  console.log(`  GET ${safeUrl}`);

  const res  = await fetch(url);
  const text = await res.text();

  if (!res.ok || text.trimStart().startsWith("<")) {
    throw new Error(`Census API error (HTTP ${res.status}):\n${text.slice(0, 600)}`);
  }

  const rows = JSON.parse(text) as string[][];
  const [headers, ...data] = rows;
  return data.map((row) =>
    Object.fromEntries(headers.map((h, i) => [h, row[i]]))
  );
}

// Parse numeric value; Census sentinel codes are large negatives (e.g. -666666666).
// All valid demographic values are >= 0, so treat any negative as null.
function num(v: string | undefined | null): number | null {
  if (v == null || v === "" || v === "null" || v === "-") return null;
  const n = Number(v);
  return isFinite(n) && n >= 0 ? n : null;
}

// (numerator / denominator) × 100, rounded to 1 decimal. Returns 0 on bad input.
function pct(numerator: number | null, denominator: number | null): number {
  if (!numerator || !denominator) return 0;
  return Math.round((numerator / denominator) * 1000) / 10;
}

// ── Variable lists ────────────────────────────────────────────────────────────

// Call 1: main demographics (population, income, poverty, employment, housing,
// race, Hispanic origin, education) — 31 named vars, well under the 50-var limit.
const MAIN_VARS = [
  "NAME",
  "B01001_001E", // Total population
  "B01002_001E", // Median age
  "B19013_001E", // Median household income
  "B17001_002E", // People below poverty level (numerator)
  "B17001_001E", // Population for poverty calculation (denominator)
  "B23025_005E", // Unemployed — civilian labor force
  "B23025_002E", // Civilian labor force total
  "B25003_001E", // Occupied housing units (total)
  "B25003_002E", // Owner-occupied housing units
  "B25064_001E", // Median gross rent (dollars)
  "B25077_001E", // Median home value — owner-occupied (dollars)
  "B02001_001E", // Race total
  "B02001_002E", // White alone
  "B02001_003E", // Black or African American alone
  "B02001_004E", // American Indian and Alaska Native alone
  "B02001_005E", // Asian alone
  "B02001_006E", // Native Hawaiian and Other Pacific Islander alone
  "B02001_007E", // Some other race alone
  "B02001_008E", // Two or more races
  "B03002_001E", // Hispanic or Latino origin — total
  "B03002_012E", // Hispanic or Latino
  "B15003_001E", // Population 25 years and over (education denominator)
  "B15003_017E", // High school diploma
  "B15003_018E", // GED or alternative credential
  "B15003_019E", // Some college, less than 1 year
  "B15003_020E", // Some college, 1+ years, no degree
  "B15003_021E", // Associate's degree
  "B15003_022E", // Bachelor's degree
  "B15003_023E", // Master's degree
  "B15003_024E", // Professional school degree
  "B15003_025E", // Doctorate degree
];

// Call 2: age group counts to derive under-18 % and 65+ % (20 vars).
const AGE_VARS = [
  "B01001_003E", "B01001_004E", "B01001_005E", "B01001_006E", // Male  <5, 5-9, 10-14, 15-17
  "B01001_027E", "B01001_028E", "B01001_029E", "B01001_030E", // Female <5, 5-9, 10-14, 15-17
  "B01001_020E", "B01001_021E", "B01001_022E", "B01001_023E", // Male  65-66, 67-69, 70-74, 75-79
  "B01001_024E", "B01001_025E",                               // Male  80-84, 85+
  "B01001_044E", "B01001_045E", "B01001_046E", "B01001_047E", // Female 65-66, 67-69, 70-74, 75-79
  "B01001_048E", "B01001_049E",                               // Female 80-84, 85+
];

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n[ACS ${YEAR} 5-Year] Fetching NC county demographics from Census Bureau API…\n`);

  // Sequential to avoid rate-limiting without an API key.
  const mainRows = await fetchCensus(MAIN_VARS);
  const ageRows  = await fetchCensus(AGE_VARS);

  // Index age rows by 5-digit FIPS so we can look them up when merging
  const ageByFips: Record<string, Record<string, string>> = {};
  for (const row of ageRows) {
    ageByFips[`${row.state}${row.county}`] = row;
  }

  console.log(`\n  ✓ main: ${mainRows.length} counties`);
  console.log(`  ✓ age:  ${ageRows.length} counties`);

  const result: DemographicsMap = {};

  for (const row of mainRows) {
    const fips = `${row.state}${row.county}`;
    const age  = ageByFips[fips] ?? {};

    // "Wake County, North Carolina" → "Wake"
    const county = row.NAME.replace(/ County, North Carolina$/, "").trim();

    const totalPop = num(row.B01001_001E);

    // Under 18: sum male + female age bands (< 5, 5–9, 10–14, 15–17)
    const under18 =
      (num(age.B01001_003E) ?? 0) + (num(age.B01001_004E) ?? 0) +
      (num(age.B01001_005E) ?? 0) + (num(age.B01001_006E) ?? 0) +
      (num(age.B01001_027E) ?? 0) + (num(age.B01001_028E) ?? 0) +
      (num(age.B01001_029E) ?? 0) + (num(age.B01001_030E) ?? 0);

    // 65+: sum male + female age bands
    const over65 =
      (num(age.B01001_020E) ?? 0) + (num(age.B01001_021E) ?? 0) +
      (num(age.B01001_022E) ?? 0) + (num(age.B01001_023E) ?? 0) +
      (num(age.B01001_024E) ?? 0) + (num(age.B01001_025E) ?? 0) +
      (num(age.B01001_044E) ?? 0) + (num(age.B01001_045E) ?? 0) +
      (num(age.B01001_046E) ?? 0) + (num(age.B01001_047E) ?? 0) +
      (num(age.B01001_048E) ?? 0) + (num(age.B01001_049E) ?? 0);

    // Education: HS or higher = diploma + GED + any college level + degrees
    const edu25plus = num(row.B15003_001E);
    const hsOrHigher =
      (num(row.B15003_017E) ?? 0) + (num(row.B15003_018E) ?? 0) +
      (num(row.B15003_019E) ?? 0) + (num(row.B15003_020E) ?? 0) +
      (num(row.B15003_021E) ?? 0) + (num(row.B15003_022E) ?? 0) +
      (num(row.B15003_023E) ?? 0) + (num(row.B15003_024E) ?? 0) +
      (num(row.B15003_025E) ?? 0);
    const bachelorsOrHigher =
      (num(row.B15003_022E) ?? 0) + (num(row.B15003_023E) ?? 0) +
      (num(row.B15003_024E) ?? 0) + (num(row.B15003_025E) ?? 0);

    // Housing tenure
    const totalHousing  = num(row.B25003_001E);
    const ownerOccupied = num(row.B25003_002E);
    const ownerPct      = pct(ownerOccupied, totalHousing);

    // Race percentages (race-alone from B02001, Hispanic origin from B03002)
    const raceTotal = num(row.B02001_001E);
    const hispTotal = num(row.B03002_001E);

    result[fips] = {
      fips,
      county,
      year: YEAR,

      population: {
        total:       totalPop ?? 0,
        median_age:  num(row.B01002_001E) ?? 0,
        under18_pct: pct(under18, totalPop),
        over65_pct:  pct(over65,  totalPop),
      },

      economics: {
        median_household_income: num(row.B19013_001E),
        poverty_pct:      pct(num(row.B17001_002E), num(row.B17001_001E)),
        unemployment_pct: pct(num(row.B23025_005E), num(row.B23025_002E)),
      },

      housing: {
        median_home_value:   num(row.B25077_001E),
        median_gross_rent:   num(row.B25064_001E),
        owner_occupied_pct:  ownerPct,
        renter_occupied_pct: Math.round((100 - ownerPct) * 10) / 10,
      },

      education: {
        hs_or_higher_pct:        pct(hsOrHigher,        edu25plus),
        bachelors_or_higher_pct: pct(bachelorsOrHigher, edu25plus),
      },

      race: {
        white_pct:       pct(num(row.B02001_002E), raceTotal),
        black_pct:       pct(num(row.B02001_003E), raceTotal),
        aian_pct:        pct(num(row.B02001_004E), raceTotal),
        asian_pct:       pct(num(row.B02001_005E), raceTotal),
        nhpi_pct:        pct(num(row.B02001_006E), raceTotal),
        other_pct:       pct(num(row.B02001_007E), raceTotal),
        multiracial_pct: pct(num(row.B02001_008E), raceTotal),
        hispanic_pct:    pct(num(row.B03002_012E), hispTotal),
      },
    };
  }

  // ── Write output ────────────────────────────────────────────────────────────

  const DIST = path.join(process.cwd(), "data", "dist");
  if (!fs.existsSync(DIST)) fs.mkdirSync(DIST, { recursive: true });

  const outPath = path.join(DIST, "demographics.json");
  const total   = Object.keys(result).length;
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2), "utf-8");

  const sizeKb = Math.round(fs.statSync(outPath).size / 1024);
  console.log(`\n✅  Wrote ${total} NC counties → data/dist/demographics.json (${sizeKb} KB)\n`);
}

main().catch((err) => { console.error(err); process.exit(1); });
