import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";
import ComingSoon from "@/components/ui/ComingSoon";

export const metadata: Metadata = {
  title: "NC Community Reports — Transparency & Trend Data",
  description: "Public transparency reports and community trend analysis for North Carolina municipalities.",
};

export default function CommunityReportsPage() {
  return (
    <div>
      <PageHeader
        badge="Coming Soon"
        title="Community Reports"
        subtitle="Public transparency reports aggregating crime trends, education outcomes, and community indicators for North Carolina municipalities."
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ComingSoon
          title="Community Reports Coming Soon"
          description="We are building automated community transparency reports that combine crime, education, and demographic data into digestible, shareable PDF and interactive reports for NC residents and officials."
          icon={
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
      </div>
    </div>
  );
}
