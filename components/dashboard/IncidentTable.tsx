/**
 * IncidentTable — displays police incidents in a sortable data table.
 * Used in the Crime Explorer table view.
 */

import type { PoliceIncident } from "@/types";
import { formatDateTime, getCrimeBadgeColor } from "@/lib/utils";

interface IncidentTableProps {
  incidents: PoliceIncident[];
}

export default function IncidentTable({ incidents }: IncidentTableProps) {
  if (incidents.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No incidents found matching your filters.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-sm">
      <table className="min-w-full divide-y divide-gray-100 bg-white text-sm">
        <thead className="bg-[#F5F7FA]">
          <tr>
            {["Date/Time", "Crime Type", "Location", "District", "Case #"].map(
              (col) => (
                <th
                  key={col}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  {col}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {incidents.map((incident, idx) => {
            const attr = incident.attributes;
            const badgeColor = getCrimeBadgeColor(attr.CRIME_TYPE);

            return (
              <tr
                key={attr.OBJECTID ?? idx}
                className="hover:bg-[#F5F7FA] transition-colors"
              >
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                  {formatDateTime(attr.INC_DATETIME)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${badgeColor}`}
                  >
                    {attr.CRIME_TYPE || "Unknown"}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-700 max-w-xs truncate">
                  {attr.LOCATION || "—"}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {attr.DISTRICT || "—"}
                </td>
                <td className="px-4 py-3 text-gray-400">
                  {attr.INC_NO || "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
