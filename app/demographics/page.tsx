import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";
import ComingSoon from "@/components/ui/ComingSoon";

export const metadata: Metadata = {
  title: "NC Demographics — Census & Community Data",
  description: "Population trends, income levels, housing, and US Census Bureau data for North Carolina communities.",
};

export default function DemographicsPage() {
  return (
    <div>
      <PageHeader
        badge="Coming Soon"
        title="NC Demographics"
        subtitle="Population trends, income levels, housing data, and more — sourced from US Census Bureau and American Community Survey datasets."
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ComingSoon
          title="Demographics Data Coming Soon"
          description="We are building integrations with US Census Bureau and American Community Survey (ACS) APIs to bring you detailed demographic information for every North Carolina community."
          icon={
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
      </div>
    </div>
  );
}
