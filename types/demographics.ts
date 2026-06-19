/**
 * Types for NC county demographics from ACS 5-Year Estimates.
 * Field names reflect the final computed/derived values stored in
 * data/dist/demographics.json — not the raw Census variable codes.
 *
 * Primary key: 5-digit FIPS code (e.g. "37183" = Wake County).
 * county field matches the School.county field for cross-referencing.
 */

export interface CountyDemographics {
  fips: string;    // "37183"
  county: string;  // "Wake" — matches School.county
  year: string;    // "2023" = ACS 2019-2023 5-year

  population: {
    total: number;
    median_age: number;
    under18_pct: number;
    over65_pct: number;
  };

  economics: {
    median_household_income: number | null; // null when suppressed
    poverty_pct: number;
    unemployment_pct: number;
  };

  housing: {
    median_home_value: number | null;   // null when suppressed
    median_gross_rent: number | null;   // null when suppressed
    owner_occupied_pct: number;
    renter_occupied_pct: number;
  };

  education: {
    hs_or_higher_pct: number;        // % of adults 25+ with HS diploma or higher
    bachelors_or_higher_pct: number; // % of adults 25+ with bachelor's or higher
  };

  race: {
    white_pct: number;
    black_pct: number;
    hispanic_pct: number;    // separate from race (can overlap)
    asian_pct: number;
    aian_pct: number;        // American Indian / Alaska Native
    nhpi_pct: number;        // Native Hawaiian / Pacific Islander
    other_pct: number;       // Some other race alone
    multiracial_pct: number; // Two or more races
  };
}

export type DemographicsMap = Record<string, CountyDemographics>;
