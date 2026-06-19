/**
 * IncidentTable — displays police incidents in a data table.
 * Used in the Crime Explorer table view.
 */

import type { PoliceIncident } from "@/types";
import { formatDateTime, getCrimeBadgeColor } from "@/lib/utils";
import EmptyState from "@/components/ui/EmptyState";

interface IncidentTableProps {
  incidents: PoliceIncident[];
  onReset?: () => void;
}

export default function IncidentTable({ incidents, onReset }: IncidentTableProps) {
  if (incidents.length === 0) {
    return (
      <EmptyState
        title="No incidents found"
        description="No incidents match your current filters. Try adjusting or clearing your search."
        actionLabel={onReset ? "Clear filters" : undefined}
        onAction={onReset}
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-sm">
      <table className="min-w-full divide-y divide-gray-100 bg-white text-sm">
        <thead className="bg-[#F5F7FA]">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Date/Time
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Crime Type
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Location
            </th>
            <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              District
            </th>
            <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Case #
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {incidents.map((incident, idx) => {
            const attr = incident.attributes;
            const badgeColor = getCrimeBadgeColor(attr.crime_type);

            return (
              <tr
                key={attr.OBJECTID ?? idx}
                className="hover:bg-[#F5F7FA] transition-colors"
              >
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                  {formatDateTime(attr.reported_date)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${badgeColor}`}
                  >
                    {attr.crime_type || "Unknown"}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-700 max-w-[8rem] sm:max-w-xs truncate">
                  {attr.reported_block_address || "—"}
                </td>
                <td className="hidden sm:table-cell px-4 py-3 text-gray-600">
                  {attr.district || "—"}
                </td>
                <td className="hidden md:table-cell px-4 py-3 text-gray-400">
                  {attr.case_number || "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
