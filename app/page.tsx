/**
 * Homepage — Carolina Atlas
 * Features: Hero section, stat cards, featured insights panel, CTA
 */

import Link from "next/link";
import StatCard from "@/components/dashboard/StatCard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Carolina Atlas — Transparent Civic Data for NC Communities",
  description:
    "Explore live crime data, school performance, and community demographics for North Carolina. Carolina Atlas makes public government data accessible to every resident.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Carolina Atlas — Transparent Civic Data for NC Communities",
    description:
      "Explore live crime data, school performance, and community demographics for North Carolina.",
    url: "https://carolina-atlas.com",
  },
};

// ─── Stat card data (illustrative; will be live data in future releases) ───
const STAT_CARDS = [
  {
    label: "Incidents (30 Days)",
    value: "Live",
    trend: "Updated daily",
    trendUp: true,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    label: "NC Counties Covered",
    value: "100",
    trend: "Full state coverage planned",
    trendUp: true,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    label: "Public Datasets",
    value: "1",
    trend: "More datasets coming",
    trendUp: true,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
      </svg>
    ),
  },
  {
    label: "Data Sources",
    value: "Open",
    trend: "100% public data",
    trendUp: true,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

// ─── Featured insights ────────────────────────────────────────────────────
const FEATURED_INSIGHTS = [
  {
    badge: "Live",
    badgeColor: "bg-green-100 text-green-700",
    title: "Raleigh Police Incident Explorer",
    description:
      "Browse and filter daily police incidents from the Raleigh Police Department. Search by crime type, district, date range, or location.",
    href: "/crime",
    cta: "Explore Incidents →",
  },
  {
    badge: "Coming Soon",
    badgeColor: "bg-amber-100 text-amber-700",
    title: "School Performance Dashboard",
    description:
      "Track school ratings, test scores, and educational metrics across all 100 North Carolina counties.",
    href: "/schools",
    cta: "View Schools →",
  },
  {
    badge: "Coming Soon",
    badgeColor: "bg-blue-100 text-blue-700",
    title: "Demographics & Census Data",
    description:
      "Explore population trends, income levels, housing data, and more — sourced from US Census Bureau datasets.",
    href: "/demographics",
    cta: "Explore Demographics →",
  },
];

export default function HomePage() {
  return (
    <div>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="bg-[#123047] text-white py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl">
            <span className="inline-block mb-4 px-3 py-1 rounded-full bg-[#4B9CD3]/20 border border-[#4B9CD3]/40 text-[#4B9CD3] text-xs font-semibold uppercase tracking-wider">
              Beta — MVP Release
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Transparent civic data for{" "}
              <span className="text-[#4B9CD3]">North Carolina</span>{" "}
              communities
            </h1>
            <p className="text-blue-200 text-lg sm:text-xl leading-relaxed mb-8 max-w-2xl">
              Carolina Atlas brings public government data to life — helping
              residents understand crime trends, school performance, demographics,
              and community indicators in their neighborhoods.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/crime"
                className="px-6 py-3 bg-[#4B9CD3] hover:bg-[#3a8bc2] text-white font-semibold rounded-lg transition-colors shadow-md"
              >
                Explore Crime Data
              </Link>
              <Link
                href="/about"
                className="px-6 py-3 bg-transparent border border-blue-400 hover:border-white text-blue-100 hover:text-white font-semibold rounded-lg transition-colors"
              >
                About the Project
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Dashboard ───────────────────────────────────────────────── */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-6">
            Platform at a glance
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STAT_CARDS.map((card) => (
              <StatCard
                key={card.label}
                label={card.label}
                value={card.value}
                trend={card.trend}
                trendUp={card.trendUp}
                icon={card.icon}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Insights ─────────────────────────────────────────────── */}
      <section className="py-12 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#123047]">
                Featured Insights
              </h2>
              <p className="text-gray-500 mt-1 text-sm">
                Explore available civic datasets and tools
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURED_INSIGHTS.map((insight) => (
              <div
                key={insight.title}
                className="bg-[#F5F7FA] rounded-xl p-6 flex flex-col gap-4 border border-gray-100 hover:shadow-md transition-shadow"
              >
                <span
                  className={`self-start px-2.5 py-0.5 rounded-full text-xs font-semibold ${insight.badgeColor}`}
                >
                  {insight.badge}
                </span>
                <h3 className="text-lg font-bold text-[#123047]">
                  {insight.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed flex-1">
                  {insight.description}
                </p>
                <Link
                  href={insight.href}
                  className="text-sm font-semibold text-[#4B9CD3] hover:text-[#123047] transition-colors"
                >
                  {insight.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mission / Transparency ────────────────────────────────────────── */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-[#123047] rounded-2xl p-8 sm:p-12 text-white flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                Built for public transparency
              </h2>
              <p className="text-blue-200 leading-relaxed mb-6">
                Carolina Atlas is committed to using only publicly available data
                from government sources. We display block-level addresses only
                and never expose personally identifiable information. Our goal is
                to empower residents with the same data available to public
                officials.
              </p>
              <Link
                href="/about"
                className="inline-block px-5 py-2.5 bg-[#E0A93B] hover:bg-[#c8932a] text-white font-semibold rounded-lg transition-colors text-sm"
              >
                Learn More About Our Mission
              </Link>
            </div>
            <div className="hidden md:flex w-32 h-32 rounded-full bg-[#4B9CD3]/20 items-center justify-center flex-shrink-0">
              <svg className="w-16 h-16 text-[#4B9CD3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
