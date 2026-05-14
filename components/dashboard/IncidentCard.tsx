/**
 * IncidentCard — displays a single police incident in a card layout.
 * Used in the Crime Explorer grid view.
 */

import type { PoliceIncident } from "@/types";
import { formatDateTime, getCrimeBadgeColor } from "@/lib/utils";

interface IncidentCardProps {
  incident: PoliceIncident;
}

export default function IncidentCard({ incident }: IncidentCardProps) {
  const attr = incident.attributes;
  const badgeColor = getCrimeBadgeColor(attr.CRIME_TYPE);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow flex flex-col gap-3">
      {/* Crime Type Badge */}
      <div className="flex items-start justify-between gap-2">
        <span
          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${badgeColor}`}
        >
          {attr.CRIME_TYPE || "Unknown"}
        </span>
        {attr.DISTRICT && (
          <span className="text-xs text-gray-400 whitespace-nowrap">
            District {attr.DISTRICT}
          </span>
        )}
      </div>

      {/* Location */}
      <div>
        <p className="text-sm font-semibold text-[#123047] leading-snug">
          {attr.LOCATION || "Location unavailable"}
        </p>
        {attr.CRIME_CATEGORY && (
          <p className="text-xs text-gray-500 mt-0.5">{attr.CRIME_CATEGORY}</p>
        )}
      </div>

      {/* Date/Time */}
      <div className="text-xs text-gray-400">
        {formatDateTime(attr.INC_DATETIME)}
      </div>

      {/* Incident Number */}
      {attr.INC_NO && (
        <div className="text-xs text-gray-400 border-t border-gray-50 pt-2">
          Case #{attr.INC_NO}
        </div>
      )}
    </div>
  );
}
