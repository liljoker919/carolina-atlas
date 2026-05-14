/**
 * LoadingSpinner — centered animated loading indicator.
 */

interface LoadingSpinnerProps {
  label?: string;
  size?: "sm" | "md" | "lg";
}

export default function LoadingSpinner({
  label = "Loading data…",
  size = "md",
}: LoadingSpinnerProps) {
  const sizeClass = {
    sm: "w-6 h-6 border-2",
    md: "w-10 h-10 border-4",
    lg: "w-16 h-16 border-4",
  }[size];

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <div
        className={`${sizeClass} rounded-full border-[#4B9CD3] border-t-transparent animate-spin`}
      />
      {label && <p className="text-sm text-gray-500">{label}</p>}
    </div>
  );
}
