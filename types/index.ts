/**
 * TypeScript interfaces and types for Carolina Atlas
 * Covers police incidents, school data, demographics, and shared UI types
 */

// ─── Police Incident Types ─────────────────────────────────────────────────

export interface PoliceIncidentAttributes {
  OBJECTID: number;
  GlobalID?: string;
  /** Incident number / case number */
  INC_NO?: string;
  /** Block-level address */
  LOCATION?: string;
  /** Crime type / offense description */
  CRIME_TYPE?: string;
  /** Crime category */
  CRIME_CATEGORY?: string;
  /** Police district */
  DISTRICT?: string;
  /** Reporting officer's beat */
  BEAT?: string;
  /** Date/time reported (epoch ms) */
  INC_DATETIME?: number;
  /** Date/time dispatched (epoch ms) */
  DISPATCH_DATETIME?: number;
  /** Response type */
  RESPONSE_TYPE?: string;
  /** Status of incident */
  STATUS?: string;
  /** City */
  CITY?: string;
  /** State */
  STATE?: string;
  /** ZIP code */
  ZIP?: string;
}

export interface PoliceIncidentGeometry {
  x: number;
  y: number;
}

export interface PoliceIncident {
  attributes: PoliceIncidentAttributes;
  geometry?: PoliceIncidentGeometry;
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

// ─── Navigation Types ────────────────────────────────────────────────────

export interface NavItem {
  label: string;
  href: string;
  icon?: string;
  badge?: string;
}
