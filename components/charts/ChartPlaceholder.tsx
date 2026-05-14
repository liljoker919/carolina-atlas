/**
 * ChartPlaceholder — placeholder for future chart/analytics integration.
 * Displays a visual hint that charts will be added here.
 */

interface ChartPlaceholderProps {
  title?: string;
  height?: string;
}

export default function ChartPlaceholder({
  title = "Analytics Chart",
  height = "h-48",
}: ChartPlaceholderProps) {
  return (
    <div
      className={`${height} w-full rounded-xl border-2 border-dashed border-gray-200 bg-[#F5F7FA] flex flex-col items-center justify-center gap-2 text-gray-400`}
    >
      <svg
        className="w-10 h-10 text-gray-300"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs">Interactive charts — coming soon</p>
    </div>
  );
}
