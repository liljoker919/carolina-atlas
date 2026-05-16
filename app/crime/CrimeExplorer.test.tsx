"use client";

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, afterEach } from "vitest";
import CrimeExplorer from "./CrimeExplorer";
import type { PoliceIncident } from "@/types";

// ── Helpers ────────────────────────────────────────────────────────────────

const makeIncident = (id: number, crime_type = "THEFT"): PoliceIncident => ({
  attributes: {
    OBJECTID: id,
    case_number: `2024-00${id}`,
    reported_block_address: `${id * 100} MAIN ST`,
    crime_type,
    district: "2",
    reported_date: Date.now(),
  },
});

/** Empty options payload — keeps dropdowns empty, avoids spurious matches. */
const EMPTY_OPTIONS = { crimeTypes: [], districts: [] };

function mockFetch(
  incidentsPayload: PoliceIncident[] | { error: { message: string } }
) {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) => {
      if (typeof url === "string" && url.includes("/api/incidents/options")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(EMPTY_OPTIONS),
        });
      }
      if (Array.isArray(incidentsPayload)) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(incidentsPayload),
        });
      }
      return Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve(incidentsPayload),
      });
    })
  );
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("CrimeExplorer", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows a loading spinner while fetching data", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {}))
    );

    render(<CrimeExplorer />);

    expect(
      screen.getByText("Fetching incident data from Raleigh PD…")
    ).toBeInTheDocument();
  });

  it("renders incident data in the table after a successful fetch", async () => {
    mockFetch([makeIncident(1, "ROBBERY")]);

    render(<CrimeExplorer />);

    // Table view is default; "ROBBERY" appears only in the incident row badge
    await waitFor(() => {
      expect(screen.getByRole("table")).toBeInTheDocument();
    });

    const crimeBadges = screen.getAllByText("ROBBERY");
    // At least one badge in the table row
    expect(crimeBadges.length).toBeGreaterThanOrEqual(1);
  });

  it("displays an error message when the API returns a non-ok response", async () => {
    mockFetch({ error: { message: "Upstream service unavailable" } });

    render(<CrimeExplorer />);

    // The title "Failed to load incidents" is only in the Incidents section
    await waitFor(() => {
      expect(screen.getByText("Failed to load incidents")).toBeInTheDocument();
    });

    // The message may appear more than once (Summary + Incidents sections both show ErrorMessage)
    const errorMessages = screen.getAllByText("Upstream service unavailable");
    expect(errorMessages.length).toBeGreaterThanOrEqual(1);
  });

  it("displays a generic error message when the API error body cannot be parsed", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        if (typeof url === "string" && url.includes("/api/incidents/options")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(EMPTY_OPTIONS),
          });
        }
        return Promise.resolve({
          ok: false,
          status: 503,
          json: () => Promise.reject(new Error("not JSON")),
        });
      })
    );

    render(<CrimeExplorer />);

    await waitFor(() => {
      expect(screen.getByText("Failed to load incidents")).toBeInTheDocument();
    });

    expect(screen.getAllByText(/Server error: 503/).length).toBeGreaterThanOrEqual(1);
  });

  it("shows a retry button after an API error", async () => {
    mockFetch({ error: { message: "Service down" } });

    render(<CrimeExplorer />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Try again" })
      ).toBeInTheDocument();
    });
  });

  it("retries the fetch when the retry button is clicked", async () => {
    let callCount = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        if (typeof url === "string" && url.includes("/api/incidents/options")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(EMPTY_OPTIONS),
          });
        }
        callCount++;
        if (callCount === 1) {
          // First incidents call: fail
          return Promise.resolve({
            ok: false,
            status: 500,
            json: () =>
              Promise.resolve({ error: { message: "Temporary failure" } }),
          });
        }
        // Subsequent calls: succeed
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([makeIncident(99, "ROBBERY")]),
        });
      })
    );

    render(<CrimeExplorer />);

    // Wait for error state
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Try again" })
      ).toBeInTheDocument();
    });

    // Click retry
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    // After retry, data should load successfully (error UI disappears)
    await waitFor(() => {
      expect(screen.queryByText("Failed to load incidents")).not.toBeInTheDocument();
    });

    // The incident badge should be visible in the table
    await waitFor(() => {
      expect(screen.getAllByText("ROBBERY").length).toBeGreaterThanOrEqual(1);
    });
  });

  it("shows empty state when no incidents are returned (table view)", async () => {
    mockFetch([]);

    render(<CrimeExplorer />);

    await waitFor(() => {
      expect(screen.getByText("No incidents found")).toBeInTheDocument();
    });
  });

  it("shows empty state when no incidents are returned (cards view)", async () => {
    mockFetch([]);

    render(<CrimeExplorer />);

    // Switch to cards view after data has loaded
    await waitFor(() => {
      expect(screen.queryByText("Fetching incident data from Raleigh PD…")).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Cards" }));

    expect(screen.getByText("No incidents found")).toBeInTheDocument();
  });
});

