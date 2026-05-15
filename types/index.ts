/**
 * TypeScript interfaces and types for Carolina Atlas
 * Covers police incidents, school data, demographics, and shared UI types
 */

// ─── Police Incident Types ─────────────────────────────────────────────────

export interface PoliceIncidentAttributes {
  OBJECTID: number;
  GlobalID?: string;
  /** Incident number / case number */
  case_number?: string;
  /** Block-level address */
  reported_block_address?: string;
  /** Crime type / offense description */
  crime_type?: string;
  /** Crime category */
  crime_category?: string;
  /** Crime description */
  crime_description?: string;
  /** Police district */
  district?: string;
  /** Date/time reported (epoch ms) */
  reported_date?: number;
  /** City */
  city?: string;
  /** Reporting agency */
  agency?: string;
  /** Date/time last updated (epoch ms) */
  updated_date?: number;
}

export interface PoliceIncident {
  attributes: PoliceIncidentAttributes;
}

export interface ArcGISResponse {
  features: PoliceIncident[];
  fields?: ArcGISField[];
  exceededTransferLimit?: boolean;
}

export interface ArcGISField {
  name: string;
  alias: string;
  type: string;
  length?: number;
}

/**
 * Shape of an ArcGIS REST API error response (returned with HTTP 200).
 * Always check for this before accessing `features`.
 */
export interface ArcGISErrorBody {
  error: {
    code: number;
    message: string;
    details?: string[];
  };
}

// ─── Filter / Search Types ────────────────────────────────────────────────

export interface IncidentFilters {
  searchQuery: string;
  crimeType: string;
  district: string;
  dateFrom: string;
  dateTo: string;
}

// ─── Statistics / Dashboard Types ────────────────────────────────────────

export interface StatCardData {
  label: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  icon?: string;
}

export interface FeaturedInsight {
  title: string;
  description: string;
  badge: string;
  badgeColor: string;
  link?: string;
}

// ─── API Error Types ─────────────────────────────────────────────────────

/**
 * Standard error envelope returned by every Carolina Atlas API route.
 *
 * @example
 *   { "error": { "message": "...", "code": "VALIDATION_ERROR", "status": 400 } }
 */
export interface ApiErrorResponse {
  error: {
    message: string;
    code: string;
    status: number;
  };
}

// ─── Navigation Types ────────────────────────────────────────────────────

export interface NavItem {
  label: string;
  href: string;
  icon?: string;
  badge?: string;
}
