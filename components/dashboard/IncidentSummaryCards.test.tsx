import { render, screen, within } from "@testing-library/react";
import { vi } from "vitest";
import IncidentSummaryCards from "./IncidentSummaryCards";
import type { PoliceIncident } from "@/types";

const NOW = Date.now();
const DAYS = (n: number) => n * 24 * 60 * 60 * 1000;

const makeIncident = (
  id: number,
  crime_type: string,
  district: string,
  reported_date: number
): PoliceIncident => ({
  attributes: {
    OBJECTID: id,
    crime_type,
    district,
    reported_date,
  },
});

const incidents: PoliceIncident[] = [
  makeIncident(1, "THEFT",   "1", NOW - DAYS(1)),   // recent
  makeIncident(2, "THEFT",   "1", NOW - DAYS(2)),   // recent
  makeIncident(3, "ASSAULT", "2", NOW - DAYS(3)),   // recent
  makeIncident(4, "THEFT",   "3", NOW - DAYS(10)),  // not recent
  makeIncident(5, "ROBBERY", "2", NOW - DAYS(20)),  // not recent
];

/** Get the StatCard container that has the given label text. */
function getCardByLabel(label: string): HTMLElement {
  const labelEl = screen.getByText(label);
  // StatCard renders label in a span; the card root is the closest div ancestor
  return labelEl.closest("div[class*='rounded-xl']") as HTMLElement;
}

describe("IncidentSummaryCards", () => {
  it("shows the correct total incident count", () => {
    render(<IncidentSummaryCards incidents={incidents} />);
    const card = getCardByLabel("Total Incidents");
    expect(within(card).getByText("5")).toBeInTheDocument();
  });

  it("shows the most common crime type", () => {
    render(<IncidentSummaryCards incidents={incidents} />);
    // THEFT appears 3 times (most frequent)
    expect(screen.getByText("THEFT")).toBeInTheDocument();
  });

  it("shows the number of unique districts", () => {
    render(<IncidentSummaryCards incidents={incidents} />);
    // Districts: 1, 2, 3 → 3 unique
    const card = getCardByLabel("Districts");
    expect(within(card).getByText("3")).toBeInTheDocument();
  });

  it("shows recent incidents count for last 7 days", () => {
    // No fake timers needed: the `incidents` array uses module-level `NOW = Date.now()`,
    // so incidents 1–3 (1–3 days ago) are always within 7 days of the real current time.
    render(<IncidentSummaryCards incidents={incidents} />);

    const card = getCardByLabel("Last 7 Days");
    expect(within(card).getByText("3")).toBeInTheDocument();
  });

  it("includes incidents at the 7-day cutoff and excludes older ones", () => {
    const fixedNow = new Date("2024-01-15T12:00:00.000Z");
    vi.useFakeTimers();
    vi.setSystemTime(fixedNow);

    try {
      const boundaryIncidents: PoliceIncident[] = [
        makeIncident(101, "THEFT", "1", fixedNow.getTime() - DAYS(7)),
        makeIncident(102, "ASSAULT", "2", fixedNow.getTime() - DAYS(7) + 1),
        makeIncident(103, "ROBBERY", "3", fixedNow.getTime() - DAYS(7) - 1),
      ];

      render(<IncidentSummaryCards incidents={boundaryIncidents} />);
      const card = getCardByLabel("Last 7 Days");
      expect(within(card).getByText("2")).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("renders all four card labels", () => {
    render(<IncidentSummaryCards incidents={incidents} />);
    expect(screen.getByText("Total Incidents")).toBeInTheDocument();
    expect(screen.getByText("Top Crime Type")).toBeInTheDocument();
    expect(screen.getByText("Districts")).toBeInTheDocument();
    expect(screen.getByText("Last 7 Days")).toBeInTheDocument();
  });

  it("shows placeholder dashes when loading", () => {
    render(<IncidentSummaryCards incidents={[]} loading />);
    // All four value cells should show "—"
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBe(4);
  });

  it("shows 0 total for empty incidents", () => {
    render(<IncidentSummaryCards incidents={[]} />);
    const card = getCardByLabel("Total Incidents");
    expect(within(card).getByText("0")).toBeInTheDocument();
  });

  it("shows fallback dash for most common crime type when no incidents", () => {
    render(<IncidentSummaryCards incidents={[]} />);
    const card = getCardByLabel("Top Crime Type");
    expect(within(card).getByText("—")).toBeInTheDocument();
  });

  it("does not show trend when loading", () => {
    render(<IncidentSummaryCards incidents={[]} loading />);
    expect(screen.queryByText("in current view")).not.toBeInTheDocument();
    expect(screen.queryByText("most frequent")).not.toBeInTheDocument();
    expect(screen.queryByText("unique districts")).not.toBeInTheDocument();
    expect(screen.queryByText("recent incidents")).not.toBeInTheDocument();
  });
});
