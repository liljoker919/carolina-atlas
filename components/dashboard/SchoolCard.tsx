/**
 * SchoolCard — displays a single NC school record in a card layout.
 * Used in the Schools Explorer grid view.
 */

import type { School, CategoryCode } from "@/types/school";

const CATEGORY_SHORT: Record<CategoryCode, string> = {
  E: "Elementary",
  M: "Middle",
  H: "High School",
  A: "K-12",
  T: "Alternative",
  I: "Early College",
};

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

function growthLabel(status?: string): { text: string; className: string } {
  switch (status) {
    case "Exceeded": return { text: "↑ Exceeded",  className: "text-green-600" };
    case "Met":      return { text: "✓ Met",        className: "text-blue-600" };
    case "NotMet":   return { text: "↓ Not Met",    className: "text-red-500" };
    default:         return { text: "—",            className: "text-gray-400" };
  }
}

interface SchoolCardProps {
  school: School;
}

export default function SchoolCard({ school }: SchoolCardProps) {
  const growth = growthLabel(school.eg_status);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow flex flex-col gap-3">

      {/* Top row: category badge + SPG grade */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-[#EAF2FB] text-[#4B9CD3]">
            {CATEGORY_SHORT[school.category_code] ?? school.category_code}
          </span>
          {school.title_I && (
            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
              Title I
            </span>
          )}
        </div>
        <span
          className={`shrink-0 inline-block px-3 py-0.5 rounded-full text-sm font-bold ${
            school.spg_masked ? "bg-gray-100 text-gray-400" : spgBadgeClass(school.spg_grade)
          }`}
          title={school.spg_masked ? "Grade suppressed for privacy" : `SPG Grade ${school.spg_grade}`}
        >
          {school.spg_masked ? "—" : (school.spg_grade ?? "—")}
        </span>
      </div>

      {/* School name + location */}
      <div>
        <p className="text-sm font-semibold text-[#123047] leading-snug">
          {school.name}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">{school.district_name}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {school.city}, {school.county} County · Grades {school.grade_span}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 text-center border-t border-gray-50 pt-3">
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Score</p>
          <p className="text-sm font-semibold text-[#123047]">
            {school.spg_score != null && !school.spg_masked ? school.spg_score : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Growth</p>
          <p className={`text-xs font-medium ${growth.className}`}>{growth.text}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Absent</p>
          <p className="text-sm font-semibold text-[#123047]">
            {school.chronic_absent_pct != null && !school.chronic_absent_masked
              ? `${school.chronic_absent_pct}%`
              : "—"}
          </p>
        </div>
      </div>

      {/* Website link */}
      {school.url && (
        <a
          href={school.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[#4B9CD3] hover:text-[#123047] transition-colors truncate"
        >
          Visit website →
        </a>
      )}
    </div>
  );
}
