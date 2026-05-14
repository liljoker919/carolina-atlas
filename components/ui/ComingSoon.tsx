/**
 * ComingSoon — placeholder card for features in development.
 */

interface ComingSoonProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
}

export default function ComingSoon({
  title,
  description = "This feature is under development and will be available in a future release.",
  icon,
}: ComingSoonProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      {icon ? (
        <div className="mb-4 text-[#4B9CD3]">{icon}</div>
      ) : (
        <div className="mb-4 w-16 h-16 rounded-full bg-[#F5F7FA] flex items-center justify-center text-[#4B9CD3]">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2M5 21H3M9 7h6M9 11h6M9 15h4"
            />
          </svg>
        </div>
      )}
      <h2 className="text-xl font-bold text-[#123047] mb-2">{title}</h2>
      <p className="text-gray-500 max-w-md text-sm leading-relaxed">{description}</p>
      <div className="mt-6 px-4 py-2 rounded-full bg-[#E0A93B]/10 border border-[#E0A93B]/30 text-[#E0A93B] text-xs font-semibold uppercase tracking-wider">
        Coming Soon
      </div>
    </div>
  );
}
