/**
 * EmptyState — displayed when a data set is empty (no results found).
 */

interface EmptyStateProps {
  title?: string;
  description?: string;
  /** Optional action label and handler (e.g. "Clear filters"). */
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  title = "No results found",
  description = "No data matches your current filters. Try adjusting or clearing your search.",
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 text-center px-4"
      role="status"
      aria-live="polite"
    >
      <div className="mb-4 w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
        <svg
          className="w-7 h-7"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
          />
        </svg>
      </div>
      <h3 className="text-base font-semibold text-gray-700 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 max-w-sm">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-4 py-2 text-sm font-medium text-[#4B9CD3] border border-[#4B9CD3] rounded-lg hover:bg-[#4B9CD3] hover:text-white transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
