/**
 * SchoolTable — displays school records in a sortable data table.
 * Used in the Schools Explorer table view.
 */

import type { School } from "@/types/school";
import EmptyState from "@/components/ui/EmptyState";

function spgBadgeClass(grade?: string): string {
  switch (grade) {
    case "A": return "bg-green-100 text-green-800";
    case "B": return "bg-blue-100 text-blue-800";
    case "C": return "bg-yellow-100 text-yellow-800";
    case "D": return "bg-orange-100 text-orange-800";
    case "F": return "bg-red-100 text-red-800";
    default:  return "bg-gray-100 text-gray-500";
  }
}

function growthCell(status?: string): { text: string; className: string } {
  switch (status) {
    case "Exceeded": return { text: "↑ Exceeded", className: "text-green-600" };
    case "Met":      return { text: "✓ Met",       className: "text-blue-600" };
    case "NotMet":   return { text: "↓ Not Met",   className: "text-red-500" };
    default:         return { text: "—",           className: "text-gray-400" };
  }
}

interface SchoolTableProps {
  schools: School[];
  onReset?: () => void;
}

export default function SchoolTable({ schools, onReset }: SchoolTableProps) {
  if (schools.length === 0) {
    return (
      <EmptyState
        title="No schools found"
        description="No schools match your current filters. Try adjusting or clearing your search."
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
              School
            </th>
            <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              District
            </th>
            <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              County
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Grade
            </th>
            <th className="hidden sm:table-cell px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Score
            </th>
            <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Growth
            </th>
            <th className="hidden lg:table-cell px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Absent %
            </th>
            <th className="hidden xl:table-cell px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Class Size
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {schools.map((school) => {
            const growth = growthCell(school.eg_status);
            return (
              <tr
                key={school.agency_code}
                className="hover:bg-[#F5F7FA] transition-colors"
              >
                <td className="px-4 py-3">
                  <p className="font-medium text-[#123047] leading-snug">
                    {school.url ? (
                      <a
                        href={school.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-[#4B9CD3] transition-colors"
                      >
                        {school.name}
                      </a>
                    ) : (
                      school.name
                    )}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Grades {school.grade_span} · {school.city}
                  </p>
                </td>
                <td className="hidden sm:table-cell px-4 py-3 text-gray-600 max-w-[12rem] truncate">
                  {school.district_name}
                </td>
                <td className="hidden md:table-cell px-4 py-3 text-gray-600">
                  {school.county}
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      school.spg_masked
                        ? "bg-gray-100 text-gray-400"
                        : spgBadgeClass(school.spg_grade)
                    }`}
                  >
                    {school.spg_masked ? "—" : (school.spg_grade ?? "—")}
                  </span>
                </td>
                <td className="hidden sm:table-cell px-4 py-3 text-center text-gray-700 font-medium">
                  {school.spg_score != null && !school.spg_masked
                    ? school.spg_score
                    : "—"}
                </td>
                <td className={`hidden lg:table-cell px-4 py-3 text-sm font-medium ${growth.className}`}>
                  {growth.text}
                </td>
                <td className="hidden lg:table-cell px-4 py-3 text-center text-gray-700">
                  {school.chronic_absent_pct != null && !school.chronic_absent_masked
                    ? `${school.chronic_absent_pct}%`
                    : "—"}
                </td>
                <td className="hidden xl:table-cell px-4 py-3 text-center text-gray-700">
                  {school.avg_class_size ?? "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
