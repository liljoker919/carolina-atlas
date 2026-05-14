/**
 * StatCard — a dashboard-style metric card for displaying a single KPI.
 */

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export default function StatCard({
  label,
  value,
  trend,
  trendUp,
  icon,
  className = "",
}: StatCardProps) {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col gap-3 hover:shadow-md transition-shadow ${className}`}
    >
      <div className="flex items-start justify-between">
        <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
          {label}
        </span>
        {icon && (
          <span className="p-2 rounded-lg bg-[#F5F7FA] text-[#4B9CD3]">
            {icon}
          </span>
        )}
      </div>

      <span className="text-3xl font-bold text-[#123047]">{value}</span>

      {trend && (
        <span
          className={`text-xs font-medium flex items-center gap-1 ${
            trendUp ? "text-green-600" : "text-red-500"
          }`}
        >
          {trendUp ? "↑" : "↓"} {trend}
        </span>
      )}
    </div>
  );
}
