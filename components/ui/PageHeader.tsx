/**
 * PageHeader — consistent page title + subtitle banner for inner pages.
 */

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
}

export default function PageHeader({ title, subtitle, badge }: PageHeaderProps) {
  return (
    <div className="bg-[#123047] text-white py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {badge && (
          <span className="inline-block mb-3 px-3 py-1 rounded-full bg-[#4B9CD3]/20 border border-[#4B9CD3]/40 text-[#4B9CD3] text-xs font-semibold uppercase tracking-wider">
            {badge}
          </span>
        )}
        <h1 className="text-3xl sm:text-4xl font-bold">{title}</h1>
        {subtitle && (
          <p className="mt-2 text-blue-200 max-w-2xl text-sm sm:text-base">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
